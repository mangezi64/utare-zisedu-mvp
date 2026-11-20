"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Globe,
  Sun,
  ShieldCheck,
  ArrowRight,
  Users,
  Search,
  Building2,
  Briefcase,
  ExternalLink,
  X,
  Plus,
  Copy,
  Check,
  KeyRound,
  Eye,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { validatePassword } from "@/lib/validation";
import { useViewMode } from "@/lib/view-mode-context";
import {
  EmployerRegistration,
  EmployerVerificationStatus,
  OrgRole,
  RemoteJob,
} from "@/types";

interface EmployerDirectoryItem extends EmployerRegistration {
  activeJobsCount?: number;
}

const STEPS = [
  {
    num: "01",
    title: "Share your needs",
    text: "Describe roles, required skills, working arrangements, and timezone overlap clearly.",
  },
  {
    num: "02",
    title: "Support readiness",
    text: "Candidates are pre-assessed on English fluency, digital literacy, and paired with solar-backed Starlink hubs.",
  },
  {
    num: "03",
    title: "Explore a fit",
    text: "Post verified opportunities and review tailored applications through a transparent, scoped Employer Portal.",
  },
];

const VERIFICATION_BADGE: Record<
  EmployerVerificationStatus,
  { label: string; cls: string }
> = {
  verified: {
    label: "Verified",
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export default function EmployersPage() {
  const router = useRouter();
  const {
    loading: sessionLoading,
    isAuthenticated,
    isEmployer,
    isAdmin,
    isHub,
  } = useViewMode();

  const isCandidateView =
    !sessionLoading && isAuthenticated && !isAdmin && !isEmployer && !isHub;

  // Redirect employers straight to /employer
  useEffect(() => {
    if (!sessionLoading && isEmployer) {
      router.replace("/employer");
    }
  }, [sessionLoading, isEmployer, router]);

  // Admin preview toggle
  const [previewPublic, setPreviewPublic] = useState(false);

  // Shared Directory State (Candidate & Admin)
  const [employers, setEmployers] = useState<EmployerDirectoryItem[]>([]);
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  // Candidate Filters & Drawer
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [selectedEmployer, setSelectedEmployer] =
    useState<EmployerDirectoryItem | null>(null);

  // Admin Operations State
  const [statusFilter, setStatusFilter] = useState<
    "all" | EmployerVerificationStatus
  >("all");
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Admin Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    orgRole: "org_admin" as OrgRole,
    industry: "Technology & SaaS",
    hiringModel: "100% Remote Contract",
    autoVerify: true,
  });
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(
    null
  );
  const [generatedInviteEmailSent, setGeneratedInviteEmailSent] = useState<
    boolean | null
  >(null);

  // Admin Reset Link State
  const [resetLinkResult, setResetLinkResult] = useState<{
    companyName: string;
    email: string;
    resetUrl: string;
    expiresAt?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Public Form State
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    password: "",
    website: "",
    industry: "Technology & SaaS",
    rolesInterested:
      "Digital Operations, Data Analysis, Software Engineering",
    hiringModel: "100% Remote Contract",
    estimatedHires: 2,
    timezoneOverlapNeeded: "CAT (GMT+2) / UK-EU overlap",
    additionalNotes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmationPath, setConfirmationPath] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<
    string | null
  >(null);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pwStrength = validatePassword(formData.password);

  const loadDirectory = useCallback(async () => {
    setLoadingDirectory(true);
    setDirectoryError(null);
    try {
      const empUrl = isAdmin ? "/api/employers" : "/api/employers?directory=1";
      const [empRes, jobsRes] = await Promise.all([
        fetch(empUrl, { credentials: "include", cache: "no-store" }),
        fetch("/api/jobs", { credentials: "include", cache: "no-store" }),
      ]);
      const empData = await empRes.json().catch(() => ({}));
      if (!empRes.ok) {
        throw new Error(empData.error || "Unable to load employers directory.");
      }
      setEmployers(Array.isArray(empData.employers) ? empData.employers : []);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json().catch(() => ({}));
        setJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);
      }
    } catch (err: any) {
      setDirectoryError(err?.message || "Failed to load directory.");
    } finally {
      setLoadingDirectory(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!sessionLoading && (isCandidateView || (isAdmin && !previewPublic))) {
      loadDirectory();
    }
  }, [sessionLoading, isCandidateView, isAdmin, previewPublic, loadDirectory]);

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      // Fallback ignored
    }
  }

  async function handleAdminVerify(
    employerId: string,
    verificationStatus: EmployerVerificationStatus
  ) {
    setUpdatingId(employerId);
    setAdminNotice(null);
    setAdminError(null);
    try {
      const res = await fetch("/api/employers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ employerId, verificationStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update verification status.");
      }
      setEmployers((prev) =>
        prev.map((e) =>
          e.id === employerId ? { ...e, verificationStatus } : e
        )
      );
      setAdminNotice(`Employer status updated to ${verificationStatus}.`);
    } catch (err: any) {
      setAdminError(err?.message || "Unable to update employer status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSendResetLink(emp: EmployerDirectoryItem) {
    setUpdatingId(`reset-${emp.id}`);
    setAdminNotice(null);
    setAdminError(null);
    setResetLinkResult(null);
    try {
      const res = await fetch("/api/admin/employers/reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ employerId: emp.id, email: emp.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate reset link.");
      }
      setResetLinkResult({
        companyName: emp.companyName,
        email: emp.email,
        resetUrl: data.resetUrl,
        expiresAt: data.expiresAt,
      });
      setAdminNotice(
        `One-time password reset link generated for ${emp.companyName} (${emp.email}).`
      );
    } catch (err: any) {
      setAdminError(err?.message || "Failed to generate reset link.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleInviteEmployer(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setAdminError(null);
    setGeneratedInviteUrl(null);
    setGeneratedInviteEmailSent(null);
    try {
      const res = await fetch("/api/admin/employers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to invite employer.");
      }
      setGeneratedInviteUrl(data.inviteUrl || null);
      setGeneratedInviteEmailSent(Boolean(data.emailSent));
      setAdminNotice(`Invite created for ${inviteForm.companyName}.`);
      await loadDirectory();
    } catch (err: any) {
      setAdminError(err?.message || "Failed to invite employer.");
    } finally {
      setInviting(false);
    }
  }

  // Filter helpers
  const industries = useMemo(() => {
    const set = new Set<string>();
    employers.forEach((e) => {
      if (e.industry) set.add(e.industry);
    });
    return Array.from(set).sort();
  }, [employers]);

  const hiringModels = useMemo(() => {
    const set = new Set<string>();
    employers.forEach((e) => {
      if (e.hiringModel) set.add(e.hiringModel);
    });
    return Array.from(set).sort();
  }, [employers]);

  const getJobsForEmployer = useCallback(
    (emp: EmployerDirectoryItem) => {
      const nameLower = emp.companyName.trim().toLowerCase();
      return jobs.filter(
        (j) =>
          j.status !== "archived" &&
          (j.employerId === emp.id ||
            j.company.trim().toLowerCase() === nameLower)
      );
    },
    [jobs]
  );

  const filteredEmployers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employers.filter((emp) => {
      if (isAdmin && statusFilter !== "all") {
        const st = emp.verificationStatus || "pending";
        if (st !== statusFilter) return false;
      }
      if (industryFilter !== "all" && emp.industry !== industryFilter) {
        return false;
      }
      if (modelFilter !== "all" && emp.hiringModel !== modelFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        emp.companyName,
        emp.industry,
        emp.hiringModel,
        emp.contactPerson,
        emp.email,
        ...(emp.rolesInterested || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [employers, searchQuery, industryFilter, modelFilter, isAdmin, statusFilter]);

  async function handleResendConfirmation(emailToResend: string) {
    if (!emailToResend.trim()) return;
    setIsResending(true);
    setResendNotice(null);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.confirmationPath) {
        setConfirmationPath(data.confirmationPath);
      }
      setResendNotice(
        data.message ||
          data.error ||
          "Confirmation email dispatched. Please check your inbox, Spam, or Junk folder."
      );
    } catch {
      setResendNotice("Unable to resend confirmation email right now.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setConfirmationPath(null);
    setPendingConfirmationEmail(null);
    setResendNotice(null);
    setErrorMessage(null);

    if (formData.password && !pwStrength.isValid) {
      setErrorMessage(
        pwStrength.error || "Please choose a stronger password."
      );
      setSubmitting(false);
      return;
    }

    try {
      const submittedEmail = formData.email.trim().toLowerCase();
      const res = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit registration");
      }

      setSuccessMessage(
        data.message || "Employer enrolment registered successfully."
      );
      if (data.confirmationPath) {
        setConfirmationPath(data.confirmationPath);
      }
      if (data.requiresEmailConfirmation && !data.confirmationPath) {
        setPendingConfirmationEmail(data.email || submittedEmail);
      }
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        password: "",
        website: "",
        industry: "Technology & SaaS",
        rolesInterested:
          "Digital Operations, Data Analysis, Software Engineering",
        hiringModel: "100% Remote Contract",
        estimatedHires: 2,
        timezoneOverlapNeeded: "CAT (GMT+2) / UK-EU overlap",
        additionalNotes: "",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // 1. Employer redirect state
  if (!sessionLoading && isEmployer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Redirecting to your Employer Portal...
        </p>
        <Link
          href="/employer"
          className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
        >
          Click here if not redirected automatically
        </Link>
      </div>
    );
  }

  // 2. Candidate Verified Employers Directory
  if (isCandidateView) {
    const selectedJobs = selectedEmployer
      ? getJobsForEmployer(selectedEmployer)
      : [];

    return (
      <div className="w-full min-h-screen pb-16">
        <PageBreadcrumb current="Verified Employers" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6 sm:p-8 shadow-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-wider text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Hiring Partners
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
              Verified Employers Directory
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Explore vetted remote and hybrid employers actively hiring
              Zimbabwean talent. Click any organization to inspect its profile
              and open roles.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="grid gap-3 sm:grid-cols-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="sm:col-span-2 relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, industry, or role..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </label>

            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              aria-label="Filter by industry"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
            >
              <option value="all">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              aria-label="Filter by hiring model"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
            >
              <option value="all">All Hiring Models</option>
              {hiringModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {directoryError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {directoryError}
            </div>
          )}

          {loadingDirectory ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
              Loading verified employers...
            </div>
          ) : filteredEmployers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-base font-bold text-slate-900">
                No verified employers match your filters
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing your search or browse all active opportunities.
              </p>
              <Link
                href="/opportunities"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
              >
                Browse Opportunities <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployers.map((emp) => {
                const activeJobs = getJobsForEmployer(emp);
                const roleCount =
                  typeof emp.activeJobsCount === "number"
                    ? emp.activeJobsCount
                    : activeJobs.length;

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedEmployer(emp)}
                    className="group text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                          {emp.companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[0.78rem] font-bold text-emerald-800">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-emerald-800 transition">
                        {emp.companyName}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {emp.industry} · {emp.hiringModel}
                      </p>

                      {emp.rolesInterested && emp.rolesInterested.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {emp.rolesInterested.slice(0, 3).map((role) => (
                            <span
                              key={role}
                              className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.78rem] font-medium text-slate-700"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <Briefcase className="h-3.5 w-3.5" />
                        {roleCount} active {roleCount === 1 ? "role" : "roles"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600 group-hover:text-emerald-700">
                        View details <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Employer Details + Active Roles Modal/Drawer */}
        {selectedEmployer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setSelectedEmployer(null)}
          >
            <div
              className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[0.78rem] font-bold text-emerald-800">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Partner
                  </span>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                    {selectedEmployer.companyName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedEmployer.industry} · {selectedEmployer.hiringModel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEmployer(null)}
                  aria-label="Close employer details"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <div>
                  <p className="text-slate-500">Timezone Overlap</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedEmployer.timezoneOverlapNeeded || "CAT (GMT+2)"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Hiring Model</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedEmployer.hiringModel}
                  </p>
                </div>
                {selectedEmployer.website && (
                  <div className="col-span-2">
                    <p className="text-slate-500">Website</p>
                    <a
                      href={selectedEmployer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline mt-0.5"
                    >
                      {selectedEmployer.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Active Roles ({selectedJobs.length})
                  </h3>
                  <Link
                    href="/opportunities"
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    All Opportunities →
                  </Link>
                </div>

                {selectedJobs.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-600">
                    No active roles are currently listed for this employer.
                    Check back soon or browse{" "}
                    <Link
                      href="/opportunities"
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      Opportunities
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {job.title}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {job.category} · {job.arrangement || "Remote"} ·{" "}
                              {job.compensationUsdMonthly}
                            </p>
                          </div>
                          {job.level && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.78rem] font-semibold text-slate-700">
                              {job.level}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link
                            href={`/jobs?jobId=${encodeURIComponent(job.id)}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
                          >
                            Tailor CV &amp; Apply
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href="/opportunities"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            View in Opportunities
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Admin Employer Operations & Directory (unless Preview Public Page is toggled)
  if (!sessionLoading && isAdmin && !previewPublic) {
    return (
      <div className="w-full min-h-screen pb-16">
        <PageBreadcrumb current="Employer Operations" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-6 shadow-sm">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-wider text-amber-900">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Operations
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
                Employer Operations &amp; Directory
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Verify organizations, send one-time onboarding invite links, and
                issue single-use password reset links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewPublic(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview Public Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratedInviteUrl(null);
                  setGeneratedInviteEmailSent(null);
                  setShowInviteModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Invite Employer
              </button>
            </div>
          </div>

          {adminNotice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-2">
              <span>{adminNotice}</span>
              <button
                type="button"
                onClick={() => setAdminNotice(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {adminError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900 flex items-center justify-between gap-2">
              <span>{adminError}</span>
              <button
                type="button"
                onClick={() => setAdminError(null)}
                className="text-rose-700 hover:text-rose-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {resetLinkResult && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-blue-950">
                  One-Time Reset Link for {resetLinkResult.companyName} (
                  {resetLinkResult.email})
                </p>
                <button
                  type="button"
                  onClick={() => setResetLinkResult(null)}
                  className="text-blue-700 hover:text-blue-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resetLinkResult.resetUrl}
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(resetLinkResult.resetUrl, "reset")}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 transition"
                >
                  {copiedKey === "reset" ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status & Search Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "verified", "pending", "rejected"] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                      statusFilter === st
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            <label className="relative flex items-center sm:w-72">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, contact, email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </label>
          </div>

          {directoryError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              {directoryError}
            </div>
          )}

          {loadingDirectory ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Loading employer records...
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployers.map((emp) => {
                const st: EmployerVerificationStatus =
                  emp.verificationStatus || "pending";
                const badge = VERIFICATION_BADGE[st];
                const isBusy = updatingId === emp.id;

                return (
                  <div
                    key={emp.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {emp.companyName}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.78rem] font-bold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Contact: <strong>{emp.contactPerson}</strong> (
                        {emp.email}) · {emp.industry} · {emp.hiringModel}
                      </p>
                      {emp.rolesInterested && emp.rolesInterested.length > 0 && (
                        <p className="text-[0.78rem] text-slate-500">
                          Roles: {emp.rolesInterested.join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {st !== "verified" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAdminVerify(emp.id, "verified")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verify
                        </button>
                      )}
                      {st !== "rejected" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAdminVerify(emp.id, "rejected")}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updatingId === `reset-${emp.id}`}
                        onClick={() => handleSendResetLink(emp)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        {updatingId === `reset-${emp.id}`
                          ? "Generating..."
                          : "Send / Copy Reset Link"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredEmployers.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                  No employers match the selected filter.
                </div>
              )}
            </div>
          )}
        </div>

        {/* + Invite Employer Modal */}
        {showInviteModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
            onClick={() => setShowInviteModal(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Invite Employer Organization
                </h2>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {generatedInviteUrl ? (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>
                      One-time invite link ready
                      {generatedInviteEmailSent
                        ? " (email dispatched)"
                        : " (share manually)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteUrl}
                      className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedInviteUrl, "invite")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
                    >
                      {copiedKey === "invite" ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInviteEmployer} className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Company Name *
                    <input
                      type="text"
                      required
                      value={inviteForm.companyName}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          companyName: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Contact Person *
                      <input
                        type="text"
                        required
                        value={inviteForm.contactPerson}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            contactPerson: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Work Email *
                      <input
                        type="email"
                        required
                        value={inviteForm.email}
                        onChange={(e) =>
                          setInviteForm({ ...inviteForm, email: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Organization Role
                      <select
                        value={inviteForm.orgRole}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            orgRole: e.target.value as OrgRole,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="org_admin">Organization Admin</option>
                        <option value="org_member">Team Member</option>
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Industry
                      <input
                        type="text"
                        value={inviteForm.industry}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            industry: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 pt-1">
                    <input
                      type="checkbox"
                      checked={inviteForm.autoVerify}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          autoVerify: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    Auto-verify organization immediately
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {inviting ? "Creating Invite..." : "Create Invite Link"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Public "For Employers & Partners" Pitch & Registration Form
  return (
    <div>
      {isAdmin && previewPublic && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-950">
          <span>Previewing Public &ldquo;For Employers &amp; Partners&rdquo; Page</span>
          <button
            type="button"
            onClick={() => setPreviewPublic(false)}
            className="rounded-lg bg-amber-600 px-3 py-1 text-white font-bold hover:bg-amber-700 transition"
          >
            Back to Admin Operations
          </button>
        </div>
      )}

      {/* Faith & Amanda's Page Hero */}
      <section className="page-hero">
        <span className="eyebrow">FOR EMPLOYERS &amp; PARTNERS</span>
        <h1>Connect with talent ready to grow.</h1>
        <p>
          UTARE bridges organisations and verified Zimbabwean talent—combining
          tertiary academic credentials, practical competency diagnostics,
          solar-backed Starlink workstations, and international payment rail
          compatibility.
        </p>

        <div className="hero-actions">
          {isAdmin ? (
            <Link href="/employer" className="button button-green">
              Open Employer Portal &amp; Applicants
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login?tab=register&role=employer"
                className="button button-green"
              >
                Create Employer Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login?redirect=/employer" className="button">
                Employer Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Two-Column Intro */}
      <section className="content-section two-col employer-intro">
        <div>
          <div className="section-heading">
            <span className="eyebrow">WHY CONSIDER ZIMBABWEAN TALENT?</span>
            <h2>Skills, perspective and potential</h2>
            <p>
              Zimbabwean candidates bring strong educational backgrounds,
              fluent English communication, and practical motivation to
              contribute. UTARE makes those capabilities easier to verify,
              equip, and connect.
            </p>
          </div>
        </div>

        <div className="prose">
          <p>
            Employers can collaborate by sharing clear role requirements,
            posting remote or hybrid opportunities, and reviewing pre-assessed
            candidates through transparent processes.
          </p>
          <p>
            Every candidate on the platform is evaluated across a 6-factor
            readiness diagnostic and supported with local partner hub
            infrastructure to eliminate power or connectivity disruptions.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <a href="#employer-enquiry-form" className="button button-green">
              Register employer interest <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/contact" className="button">
              Start a conversation
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Employer Process */}
      <section className="partner-options employer-steps">
        {STEPS.map((s) => (
          <article key={s.num}>
            <span className="eyebrow">COLLABORATION PROCESS · {s.num}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </section>

      {/* 4 Operational Guarantees */}
      <section
        className="content-section"
        style={{ paddingTop: "20px", paddingBottom: "20px" }}
      >
        <div className="feature-grid">
          <article className="feature-card">
            <span className="icon-tile">
              <Globe className="h-5 w-5" />
            </span>
            <h3>CAT (GMT+2) Timezone</h3>
            <p>
              Full 6–8 hour direct working overlap with UK, European, and South
              African business hours.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <Sun className="h-5 w-5" />
            </span>
            <h3>Infrastructure Guaranteed</h3>
            <p>
              Candidates operate from verified local hubs with 100% solar
              microgrids, Starlink broadband, and PC loans.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h3>Verified Competency</h3>
            <p>
              Pre-assessed across English fluency, digital literacy, async
              workflows, and domain problem solving.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <Users className="h-5 w-5" />
            </span>
            <h3>Compliant EOR &amp; Rails</h3>
            <p>
              Seamless contractor onboarding via Deel, Payoneer, Wise, or
              direct USD Nostro wire transfers.
            </p>
          </article>
        </div>
      </section>

      {/* Employer Enquiry & Portal Enrolment Form */}
      <section
        id="employer-enquiry-form"
        className="content-section employer-form-section"
      >
        <div>
          <div className="section-heading">
            <span className="eyebrow">EMPLOYER ENQUIRY &amp; PORTAL</span>
            <h2>Tell us how you&apos;d like to collaborate</h2>
            <p>
              Register your organisation below to save your hiring inquiry to
              our PostgreSQL database. Include a password to activate your
              Employer Portal account so you can post jobs and review
              applicants directly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-card form-stack">
          {successMessage && (
            <div className="rounded-xl border border-[#c2e2d4] bg-[#eaf5f0] p-4 text-xs font-semibold text-[#101a33] space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#08785f]" />
                <span>{successMessage}</span>
              </div>
              {confirmationPath && (
                <div>
                  <Link
                    href={confirmationPath}
                    className="button button-green"
                    style={{
                      minHeight: "36px",
                      padding: "0 14px",
                      fontSize: "0.8125rem",
                    }}
                  >
                    Confirm Email &amp; Open Employer Portal{" "}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
              {pendingConfirmationEmail && !confirmationPath && (
                <div className="space-y-2 pt-1">
                  <p className="font-normal text-[#2e4a3d]">
                    Can&apos;t see the email in your inbox? Check your{" "}
                    <strong>Spam, Junk, or Promotions</strong> folder for a
                    message from <strong>UTARE ZEM AI</strong> (
                    <code>utarezemai@gmail.com</code>), mark it as &ldquo;Not
                    spam&rdquo;, and click the confirmation link.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={() =>
                        handleResendConfirmation(pendingConfirmationEmail)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#08785f]/30 bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-[#08785f] hover:bg-[#f2fbf7] disabled:opacity-60 transition"
                    >
                      {isResending ? "Sending..." : "Resend Confirmation Email"}
                    </button>
                    {resendNotice && (
                      <span className="text-[0.78rem] font-medium text-[#1b4d3e]">
                        {resendNotice}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900">
              ✕ {errorMessage}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Organisation name *</span>
              <input
                type="text"
                required
                placeholder="e.g. Savannah Tech Labs UK"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Contact person *</span>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins (Head of Ops)"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Contact email *</span>
              <input
                type="email"
                required
                placeholder="you@organisation.org"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Company website</span>
              <input
                type="url"
                placeholder="https://organisation.org"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
            </label>
          </div>

          <div className="field">
            <span>
              Create Portal Password (Optional — enables Employer Portal sign-in)
            </span>
            <PasswordInput
              value={formData.password}
              onChange={(password) => setFormData({ ...formData, password })}
              placeholder="Strong password (8+ chars, upper/lower/num/symbol)"
              autoComplete="new-password"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Industry</span>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Partnership &amp; hiring model</span>
              <select
                value={formData.hiringModel}
                onChange={(e) =>
                  setFormData({ ...formData, hiringModel: e.target.value })
                }
              >
                <option value="100% Remote Contract">
                  100% Remote Contract
                </option>
                <option value="Full-Time EOR via Deel">
                  Full-Time EOR via Deel
                </option>
                <option value="Freelance / Task-based">
                  Freelance / Task-based
                </option>
                <option value="Skills & Hub Partnership">
                  Skills &amp; Hub Partnership
                </option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Roles of interest</span>
            <input
              type="text"
              placeholder="e.g. Digital Operations, Data Analysis, Software Engineering"
              value={formData.rolesInterested}
              onChange={(e) =>
                setFormData({ ...formData, rolesInterested: e.target.value })
              }
            />
          </label>

          <label className="field">
            <span>How might you work with UTARE?</span>
            <textarea
              rows={4}
              placeholder="Share details about your hiring needs, required skills, or partnership interest..."
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
            />
          </label>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="button button-green"
            >
              {submitting ? "Registering..." : "Register interest"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
