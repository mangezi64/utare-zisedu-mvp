"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  Building2,
  Briefcase,
  Users,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Mail,
  MapPin,
  GraduationCap,
  ShieldCheck,
  Archive,
  RefreshCw,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";
import DeleteAccountPanel from "@/components/DeleteAccountPanel";
import {
  ApplicationStatus,
  EmployerApplicantView,
  EmployerRegistration,
  OrgRole,
  RemoteJob,
} from "@/types";

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  orgRole?: OrgRole;
  isActive?: boolean;
  invitedAt?: string;
  invitedBy?: string;
}

const STATUS_LABELS: Record<
  ApplicationStatus,
  { label: string; badge: string }
> = {
  submitted: {
    label: "Submitted",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
  },
  under_review: {
    label: "Under Review",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
  },
  shortlisted: {
    label: "Shortlisted",
    badge: "bg-amber-50 text-amber-900 border-amber-300",
  },
  hired: {
    label: "Hired",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
  rejected: {
    label: "Not Selected",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export default function EmployerPortalPage() {
  const {
    user,
    loading: sessionLoading,
    isEmployer,
    isAdmin,
    isOrgAdmin,
    isOrgMember,
  } = useViewMode();

  const canManageOrg = isAdmin || isOrgAdmin || !isOrgMember;

  const [employer, setEmployer] = useState<EmployerRegistration | null>(null);
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [applicants, setApplicants] = useState<EmployerApplicantView[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Org Management Tabs & State (org_admin / admin only)
  const [activePortalTab, setActivePortalTab] = useState<
    "hiring" | "team" | "profile"
  >("hiring");
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    fullName: "",
    email: "",
    orgRole: "org_member" as OrgRole,
  });
  const [oneTimeLinkBanner, setOneTimeLinkBanner] = useState<{
    label: string;
    url: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Company Profile Edit State (org_admin / admin only)
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    companyName: "",
    contactPerson: "",
    website: "",
    industry: "",
    hiringModel: "",
    timezoneOverlapNeeded: "",
  });

  // Filters & active applicant modal
  const dossierRef = useRef<HTMLElement | null>(null);
  const jobFormRef = useRef<HTMLElement | null>(null);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");
  const [activeApplicant, setActiveApplicant] =
    useState<EmployerApplicantView | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<"pitch" | "cv" | "letter">(
    "pitch"
  );

  // New Job Form State
  const [showJobForm, setShowJobForm] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    category: "Operations",
    level: "Entry" as "Entry" | "Mid-level" | "Experienced",
    arrangement: "Remote" as "Remote" | "Hybrid" | "On-site",
    compensationUsdMonthly: "$900 – $1,400 / mo",
    supportedPaymentRails: "Deel, Payoneer, USD Wire (Nostro)",
    requiredSkills: "English Fluency, Async Communication, Problem Solving",
    minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
    isAsyncFriendly: true,
    companyWebsite: "",
    externalRoleUrl: "",
    description: "",
  });

  const loadPortalData = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/employer/portal", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.employer) {
        setEmployer(data.employer);
        setProfileForm({
          companyName: data.employer.companyName || "",
          contactPerson: data.employer.contactPerson || "",
          website: data.employer.website || "",
          industry: data.employer.industry || "",
          hiringModel: data.employer.hiringModel || "",
          timezoneOverlapNeeded: data.employer.timezoneOverlapNeeded || "",
        });
      }
      if (data.jobs) setJobs(data.jobs);
      if (data.applicants) setApplicants(data.applicants);
    } catch {
      // Ignore fetch error
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadTeamMembers = useCallback(async () => {
    if (!canManageOrg) return;
    setLoadingTeam(true);
    try {
      const res = await fetch("/api/employer/team", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setTeamMembers(Array.isArray(data.members) ? data.members : []);
    } catch {
      // Ignore fetch error
    } finally {
      setLoadingTeam(false);
    }
  }, [canManageOrg]);

  useEffect(() => {
    if (isEmployer || isAdmin) {
      loadPortalData();
      if (canManageOrg) {
        loadTeamMembers();
      }
    } else if (!sessionLoading) {
      setLoadingData(false);
    }
  }, [isEmployer, isAdmin, canManageOrg, sessionLoading, loadPortalData, loadTeamMembers]);

  if (!sessionLoading && !isEmployer && !isAdmin) {
    return (
      <div className="w-full min-h-screen">
        <PageBreadcrumb current="Employer Portal" />
        <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 shadow-sm">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Employer Portal Access Required
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your verified Employer account or enrol your organization
          to post roles and review applications submitted for your open
          positions.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/login?redirect=/employer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Employer Sign In
          </Link>
          <Link
            href="/login?tab=register&role=employer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            Enrol as an Employer
          </Link>
        </div>
      </div>
      </div>
    );
  }

  async function handlePostJob(e: React.FormEvent) {
    e.preventDefault();
    setPostingJob(true);
    setBannerNotice(null);
    setErrorNotice(null);
    try {
      const res = await fetch("/api/employer/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(jobForm),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorNotice(data.error || "Failed to post role.");
        return;
      }
      if (data.job) {
        setJobs((prev) => [data.job, ...prev]);
      }
      setBannerNotice(data.message || "Role posted successfully.");
      setShowJobForm(false);
      setJobForm({
        ...jobForm,
        title: "",
        description: "",
      });
    } catch {
      setErrorNotice("Network error while posting role.");
    } finally {
      setPostingJob(false);
    }
  }

  async function handleUpdateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    feedbackNote?: string
  ) {
    setErrorNotice(null);
    try {
      const res = await fetch("/api/employer/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_application_status",
          applicationId,
          status,
          ...(feedbackNote !== undefined ? { feedbackNote } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.applicant) {
        setErrorNotice(data.error || "Could not update status.");
        return;
      }
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? data.applicant : a))
      );
      if (activeApplicant?.id === applicationId) {
        setActiveApplicant(data.applicant);
      }
      setBannerNotice(
        `Application status updated to "${STATUS_LABELS[status].label}".`
      );
    } catch {
      setErrorNotice("Failed to update application status.");
    }
  }

  async function handleToggleJobArchive(job: RemoteJob) {
    const nextStatus = job.status === "archived" ? "approved" : "archived";
    try {
      const res = await fetch("/api/employer/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_job_status",
          jobId: job.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.job) {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? data.job : j))
        );
      }
    } catch {}
  }

  async function handleCopyOneTimeLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  }

  async function handleAddTeamMember(e: React.FormEvent) {
    e.preventDefault();
    setAddingMember(true);
    setErrorNotice(null);
    setOneTimeLinkBanner(null);
    try {
      const res = await fetch("/api/employer/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMember),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to add team member.");
      }
      if (data.inviteUrl) {
        setOneTimeLinkBanner({
          label: `One-time invite link for ${newMember.fullName} (${newMember.email})`,
          url: data.inviteUrl,
        });
      }
      setBannerNotice(`Added ${newMember.fullName} to your organization.`);
      setNewMember({ fullName: "", email: "", orgRole: "org_member" });
      setShowAddMember(false);
      await loadTeamMembers();
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to add team member.");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleToggleMemberRole(member: TeamMemberItem) {
    const nextRole: OrgRole =
      member.orgRole === "org_admin" ? "org_member" : "org_admin";
    setErrorNotice(null);
    try {
      const res = await fetch("/api/employer/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: member.id,
          email: member.email,
          orgRole: nextRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update role.");
      }
      setBannerNotice(`Updated ${member.name}'s role to ${nextRole === "org_admin" ? "Organization Admin" : "Team Member"}.`);
      await loadTeamMembers();
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to update role.");
    }
  }

  async function handleMemberResetLink(member: TeamMemberItem) {
    setErrorNotice(null);
    setOneTimeLinkBanner(null);
    try {
      const res = await fetch("/api/employer/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "reset_link",
          userId: member.id,
          email: member.email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate reset link.");
      }
      const url = data.resetUrl || data.inviteUrl;
      if (url) {
        setOneTimeLinkBanner({
          label: `One-time reset link for ${member.name} (${member.email})`,
          url,
        });
      }
      setBannerNotice(`Generated one-time reset link for ${member.email}.`);
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to generate reset link.");
    }
  }

  async function handleRemoveMember(member: TeamMemberItem) {
    setErrorNotice(null);
    try {
      const res = await fetch("/api/employer/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: member.id, email: member.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to remove team member.");
      }
      setBannerNotice(`Removed ${member.name} from organization access.`);
      await loadTeamMembers();
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to remove team member.");
    }
  }

  async function handleSaveCompanyProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setErrorNotice(null);
    try {
      const res = await fetch("/api/employer/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_employer_profile",
          ...profileForm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update company profile.");
      }
      if (data.employer) setEmployer(data.employer);
      setBannerNotice("Company profile updated successfully.");
    } catch (err: any) {
      setErrorNotice(err?.message || "Unable to update company profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  const isVerified = employer?.verificationStatus === "verified" || isAdmin;
  const filteredApplicants = applicants.filter((a) => {
    if (selectedJobFilter !== "all" && a.jobId !== selectedJobFilter) {
      return false;
    }
    if (selectedStatusFilter !== "all" && a.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen">
      <PageBreadcrumb current="Employer Portal" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              Employer Hiring Portal
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                canManageOrg
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : "bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {canManageOrg ? "Organization Admin" : "Team Member"}
            </span>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                Verified Partner — Roles Publish Immediately
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-900">
                <Clock className="h-3.5 w-3.5 text-amber-700" />
                Pending One-Time Facilitator Verification
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {employer?.companyName || user?.companyName || "Employer Workspace"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Post available remote roles and review applications submitted for
            your positions. Candidate views are strictly scoped to
            application-relevant credentials, skills, and submitted documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadPortalData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setShowJobForm((v) => {
                const next = !v;
                if (next) {
                  setTimeout(() => {
                    jobFormRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 80);
                }
                return next;
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            <PlusCircle className="h-4 w-4" />
            {showJobForm ? "Close Job Form" : "Post New Remote Role"}
          </button>
        </div>
      </div>

      {bannerNotice && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center justify-between">
          <span>✓ {bannerNotice}</span>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorNotice}
          </span>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-xs text-rose-700 hover:text-rose-900"
          >
            ✕
          </button>
        </div>
      )}

      {oneTimeLinkBanner && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-blue-950">
              {oneTimeLinkBanner.label}
            </p>
            <button
              type="button"
              onClick={() => setOneTimeLinkBanner(null)}
              className="text-blue-700 hover:text-blue-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={oneTimeLinkBanner.url}
              className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800"
            />
            <button
              type="button"
              onClick={() => handleCopyOneTimeLink(oneTimeLinkBanner.url)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 transition"
            >
              {copiedLink ? (
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

      {/* Portal Section Tabs (Team Management & Company Profile hidden for org_member) */}
      {canManageOrg && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActivePortalTab("hiring")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activePortalTab === "hiring"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Hiring &amp; Applicants
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePortalTab("team");
              loadTeamMembers();
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activePortalTab === "team"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Team Management ({teamMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActivePortalTab("profile")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activePortalTab === "profile"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Company Profile
          </button>
        </div>
      )}

      {/* Post New Job Drawer */}
      {showJobForm && (
        <section
          ref={jobFormRef}
          className="scroll-mt-24 rounded-3xl border-2 border-emerald-600/40 bg-white p-6 sm:p-8 shadow-md ring-4 ring-emerald-500/10 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Share an Available Role on Utare ZEM
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isVerified
                  ? "Your organization is verified — this role will go live on the Opportunities board immediately."
                  : "Your role will be saved now and published automatically as soon as a Facilitator verifies your organization."}
              </p>
            </div>
          </div>

          <form onSubmit={handlePostJob} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, title: e.target.value })
                  }
                  placeholder="e.g. Junior Data & Operations Analyst"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={jobForm.category}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                >
                  <option value="Operations">Operations &amp; Admin</option>
                  <option value="Data">Data &amp; Analytics</option>
                  <option value="Software">Software &amp; QA</option>
                  <option value="Finance">Finance &amp; Accounting</option>
                  <option value="Creative">Creative &amp; Marketing</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Compensation (USD) *
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.compensationUsdMonthly}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      compensationUsdMonthly: e.target.value,
                    })
                  }
                  placeholder="$900 – $1,400 / mo"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={jobForm.level}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      level: e.target.value as
                        | "Entry"
                        | "Mid-level"
                        | "Experienced",
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                >
                  <option value="Entry">Entry</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Experienced">Experienced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Arrangement
                </label>
                <select
                  value={jobForm.arrangement}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      arrangement: e.target.value as
                        | "Remote"
                        | "Hybrid"
                        | "On-site",
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supported Payment Rails
                </label>
                <input
                  type="text"
                  value={jobForm.supportedPaymentRails}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      supportedPaymentRails: e.target.value,
                    })
                  }
                  placeholder="Deel, Payoneer, Wise"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.requiredSkills}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, requiredSkills: e.target.value })
                  }
                  placeholder="Excel, SQL, Process Documentation, English Fluency"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Readiness Tier
                </label>
                <select
                  value={jobForm.minReadinessTier}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      minReadinessTier: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                >
                  <option value="Market-Ready (Direct Placement)">
                    Market-Ready (Direct Placement)
                  </option>
                  <option value="Bridge-Ready (Hub + Rapid Upskilling)">
                    Bridge-Ready (Hub + Rapid Upskilling)
                  </option>
                  <option value="Foundation Track (Hardware Bridge + Intensive Coaching)">
                    Foundation Track
                  </option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Website URL (Shared with Candidates)
                </label>
                <input
                  type="url"
                  value={jobForm.companyWebsite}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, companyWebsite: e.target.value })
                  }
                  placeholder="https://yourcompany.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role Reference / Careers Page Link (Optional)
                </label>
                <input
                  type="url"
                  value={jobForm.externalRoleUrl}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, externalRoleUrl: e.target.value })
                  }
                  placeholder="https://yourcompany.com/careers/role-details"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role Description &amp; Responsibilities *
              </label>
              <textarea
                rows={4}
                required
                value={jobForm.description}
                onChange={(e) =>
                  setJobForm({ ...jobForm, description: e.target.value })
                }
                placeholder="Describe key deliverables, tools used, and timezone overlap expectations..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowJobForm(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={postingJob}
                className="rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
              >
                {postingJob ? "Publishing Role..." : "Publish Role"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Team Management Panel (org_admin / admin only) */}
      {canManageOrg && activePortalTab === "team" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-700" />
                Organization Team Management
              </h2>
              <p className="text-xs text-slate-500">
                Invite hiring managers or recruiters, toggle roles, issue
                one-time reset links, or revoke access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMember((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {showAddMember ? "Cancel" : "+ Add Employee"}
            </button>
          </div>

          {showAddMember && (
            <form
              onSubmit={handleAddTeamMember}
              className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 grid gap-3 sm:grid-cols-4 items-end"
            >
              <label className="block text-xs font-semibold text-slate-700">
                Full Name *
                <input
                  type="text"
                  required
                  value={newMember.fullName}
                  onChange={(e) =>
                    setNewMember({ ...newMember, fullName: e.target.value })
                  }
                  placeholder="e.g. Tariro Moyo"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Work Email *
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  placeholder="tariro@company.com"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Org Role
                <select
                  value={newMember.orgRole}
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      orgRole: e.target.value as OrgRole,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="org_member">Team Member</option>
                  <option value="org_admin">Organization Admin</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={addingMember}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {addingMember ? "Adding..." : "Send One-Time Invite"}
              </button>
            </form>
          )}

          {loadingTeam ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Loading organization members...
            </p>
          ) : teamMembers.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No team members found yet. Click &ldquo;+ Add Employee&rdquo; to
              invite your first teammate.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {teamMembers.map((member) => {
                const isMemberAdmin = member.orgRole === "org_admin";
                return (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {member.name}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            isMemberAdmin
                              ? "bg-blue-50 border-blue-200 text-blue-800"
                              : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          {isMemberAdmin ? "Organization Admin" : "Team Member"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleMemberRole(member)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Make {isMemberAdmin ? "Team Member" : "Org Admin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemberResetLink(member)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <KeyRound className="h-3 w-3" />
                        Reset Link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Company Profile Panel (org_admin / admin only) */}
      {canManageOrg && activePortalTab === "profile" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-700" />
              Company Profile Settings
            </h2>
            <p className="text-xs text-slate-500">
              Update your organization&apos;s public directory details and
              hiring preferences.
            </p>
          </div>
          <form
            onSubmit={handleSaveCompanyProfile}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="block text-xs font-semibold text-slate-700">
              Company Name
              <input
                type="text"
                required
                value={profileForm.companyName}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    companyName: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Primary Contact Person
              <input
                type="text"
                required
                value={profileForm.contactPerson}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    contactPerson: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Website
              <input
                type="url"
                value={profileForm.website}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, website: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Industry
              <input
                type="text"
                value={profileForm.industry}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, industry: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Hiring Model
              <input
                type="text"
                value={profileForm.hiringModel}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    hiringModel: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Timezone Overlap
              <input
                type="text"
                value={profileForm.timezoneOverlapNeeded}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    timezoneOverlapNeeded: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Company Profile"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Main Two-Column Grid: Posted Roles (Left) + Scoped Applicants (Right) */}
      {(!canManageOrg || activePortalTab === "hiring") && (
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Employer's Posted Roles */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-700" />
                Your Posted Roles ({jobs.length})
              </h2>
              <button
                type="button"
                onClick={() => setSelectedJobFilter("all")}
                className={`text-xs font-semibold ${
                  selectedJobFilter === "all"
                    ? "text-emerald-700 underline"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Show all applicants ({applicants.length})
              </button>
            </div>

            {loadingData ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Loading your roles...
              </p>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  You haven&apos;t posted any roles yet.
                </p>
                <p className="text-[11px] text-slate-500">
                  Click &ldquo;Post New Remote Role&rdquo; above to share an open
                  position on the platform and receive tailored applications.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const count = applicants.filter(
                    (a) => a.jobId === job.id
                  ).length;
                  const isSelected = selectedJobFilter === job.id;
                  return (
                    <div
                      key={job.id}
                      className={`rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedJobFilter(
                                isSelected ? "all" : job.id
                              )
                            }
                            className="text-left font-bold text-sm text-slate-900 hover:text-emerald-700"
                          >
                            {job.title}
                          </button>
                          <p className="text-xs text-slate-500">
                            {job.category} • {job.compensationUsdMonthly}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            job.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : job.status === "archived"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {job.status === "approved"
                            ? "Live"
                            : job.status === "archived"
                            ? "Archived"
                            : "Pending Verification"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedJobFilter(isSelected ? "all" : job.id)
                          }
                          className="font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Users className="h-3.5 w-3.5" />
                          {count} {count === 1 ? "Applicant" : "Applicants"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleJobArchive(job)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                        >
                          <Archive className="h-3 w-3" />
                          {job.status === "archived" ? "Re-open" : "Archive"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Data Privacy Notice Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Scoped Applicant View
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              To protect candidate privacy, this portal displays only
              application-related credentials, verified readiness tier, skills,
              and submitted CV/cover letter documents for candidates who
              explicitly consented to share their application.
            </p>
          </div>

          <DeleteAccountPanel />
        </div>

        {/* Right Column: Applicants for Employer's Roles */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-700" />
                  Applicants for Your Roles ({filteredApplicants.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Review tailored applications and update candidate pipeline
                  status.
                </p>
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="hired">Hired</option>
                <option value="rejected">Not Selected</option>
              </select>
            </div>

            {filteredApplicants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  No applications match the current filter.
                </p>
                <p className="text-[11px] text-slate-500">
                  When candidates apply to your posted roles, their tailored
                  applications and CVs will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplicants.map((app) => {
                  const statusMeta =
                    STATUS_LABELS[app.status] || STATUS_LABELS.submitted;
                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {app.candidateName}
                            </h3>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.badge}`}
                            >
                              {statusMeta.label}
                            </span>
                            {app.aiEvaluation && (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                  app.aiEvaluation.fitScore >= 82
                                    ? "bg-emerald-700 text-white"
                                    : app.aiEvaluation.fitScore >= 70
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-700 text-white"
                                }`}
                              >
                                ★ {app.aiEvaluation.fitScore}% AI Fit · {app.aiEvaluation.fitTier}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                            Applied for: {app.jobTitle}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {app.candidateEmail && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {app.candidateEmail}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {app.candidateCity}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {app.candidateQualification}
                              {app.candidateFieldOfStudy
                                ? ` • ${app.candidateFieldOfStudy}`
                                : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-semibold text-slate-500">
                            Stage:
                          </label>
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleUpdateApplicationStatus(
                                app.id,
                                e.target.value as ApplicationStatus
                              )
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="hired" disabled={!canManageOrg}>
                              Hired{!canManageOrg ? " (Admin only)" : ""}
                            </option>
                            <option value="rejected" disabled={!canManageOrg}>
                              Not Selected{!canManageOrg ? " (Admin only)" : ""}
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Readiness Tier & Skills */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          {app.readinessTier}
                        </span>
                        {app.documents && app.documents.length > 0 && (
                          <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                            📄 {app.documents.length} Verified Credential(s) Attached
                          </span>
                        )}
                        {app.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* AI Candidate Fit Recommendation */}
                      {app.aiEvaluation && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-1">
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                            AI Candidate Fit &amp; Ranking Assessment ({app.aiEvaluation.fitScore}% Match)
                          </div>
                          <p className="text-xs text-emerald-950 leading-relaxed">
                            {app.aiEvaluation.recommendationSummary}
                          </p>
                          <p className="text-[11px] text-emerald-800 font-medium">
                            {app.aiEvaluation.credentialsSummary}
                          </p>
                        </div>
                      )}

                      {/* Tailored Application Summary / Pitch */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">
                          Submitted Application Summary:
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {app.tailoredResumePitch}
                        </p>
                      </div>

                      {/* Optional Employer Feedback Note (Employer Discretion) */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-700">
                            Optional Candidate Feedback
                          </span>
                          <span className="text-slate-400">
                            Employers reserve the right to share or withhold feedback
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            defaultValue={app.employerFeedbackNote || ""}
                            placeholder="Optional note for candidate (leave blank to withhold)..."
                            onBlur={(e) => {
                              const nextNote = e.target.value.trim();
                              if (nextNote !== (app.employerFeedbackNote || "")) {
                                handleUpdateApplicationStatus(
                                  app.id,
                                  app.status,
                                  nextNote
                                );
                              }
                            }}
                            className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <span className="text-[11px] text-slate-400">
                          Applied {new Date(app.appliedAt).toLocaleDateString()}
                          {app.updatedAt && app.updatedBy
                            ? ` • Stage updated by ${app.updatedBy} on ${new Date(
                                app.updatedAt
                              ).toLocaleDateString()}`
                            : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveApplicant(app);
                            setActiveDocTab(
                              app.generatedCv ? "cv" : "pitch"
                            );
                            setTimeout(() => {
                              dossierRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }, 80);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Full Application &amp; Credentials
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Full Application Inspection Drawer/Modal */}
      {activeApplicant && (
        <section
          ref={dossierRef}
          className="scroll-mt-24 rounded-3xl border-2 border-slate-900 bg-white p-6 sm:p-8 shadow-xl ring-4 ring-emerald-500/15 space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Application Dossier • {activeApplicant.jobTitle}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {activeApplicant.candidateName}
              </h2>
              <p className="text-xs text-slate-600">
                {activeApplicant.candidateQualification} in{" "}
                {activeApplicant.candidateFieldOfStudy} •{" "}
                {activeApplicant.candidateCity} •{" "}
                {activeApplicant.candidateEmail}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveApplicant(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close Dossier ✕
              </button>
            </div>
          </div>

          {/* Document Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveDocTab("pitch")}
              className={`rounded-lg px-3.5 py-2 ${
                activeDocTab === "pitch"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              AI Fit Analysis, Pitch &amp; Credentials
            </button>
            {activeApplicant.generatedCv && (
              <button
                type="button"
                onClick={() => setActiveDocTab("cv")}
                className={`rounded-lg px-3.5 py-2 ${
                  activeDocTab === "cv"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Tailored CV
              </button>
            )}
            {activeApplicant.generatedCoverLetter && (
              <button
                type="button"
                onClick={() => setActiveDocTab("letter")}
                className={`rounded-lg px-3.5 py-2 ${
                  activeDocTab === "letter"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Cover Letter
              </button>
            )}
          </div>

          {activeDocTab === "pitch" && (
            <div className="space-y-4">
              {activeApplicant.aiEvaluation && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                      AI Hiring Fit &amp; Recommendation ({activeApplicant.aiEvaluation.fitScore}% Fit)
                    </h3>
                    <span className="rounded-full bg-emerald-700 px-3 py-0.5 text-xs font-bold text-white">
                      {activeApplicant.aiEvaluation.fitTier}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-950 leading-relaxed">
                    {activeApplicant.aiEvaluation.recommendationSummary}
                  </p>
                  {activeApplicant.aiEvaluation.suggestedInterviewQuestions.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-xs font-bold text-emerald-900">
                        Suggested Interview Questions:
                      </div>
                      <ul className="list-disc pl-5 text-xs text-emerald-900 space-y-1">
                        {activeApplicant.aiEvaluation.suggestedInterviewQuestions.map(
                          (q, qi) => (
                            <li key={qi}>{q}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl bg-slate-50 p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Executive Pitch for {activeApplicant.jobTitle}
                </h3>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {activeApplicant.tailoredResumePitch}
                </p>
              </div>

              {activeApplicant.documents && activeApplicant.documents.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Attached Degrees, Certificates &amp; Supporting Documents ({activeApplicant.documents.length})
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeApplicant.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {doc.title} (v{doc.version})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {doc.category.toUpperCase()} • {doc.fileName}
                          </div>
                        </div>
                        <a
                          href={doc.dataUrl}
                          download={doc.fileName}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Submitted Skills &amp; Readiness
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
                    {activeApplicant.readinessTier}
                  </span>
                  {activeApplicant.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeDocTab === "cv" && activeApplicant.generatedCv && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 text-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeApplicant.generatedCv.fullName}
                </h3>
                <p className="text-xs font-semibold text-emerald-700">
                  {activeApplicant.generatedCv.headline}
                </p>
                <p className="text-xs text-slate-500">
                  {activeApplicant.generatedCv.contactLine}
                </p>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeApplicant.generatedCv.summary}
              </p>
              {activeApplicant.generatedCv.experience.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Experience
                  </h4>
                  {activeApplicant.generatedCv.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-xs font-bold text-slate-900">
                        {exp.role} — {exp.organization} ({exp.dates})
                      </div>
                      <ul className="list-disc pl-5 text-xs text-slate-700 space-y-0.5">
                        {exp.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeDocTab === "letter" &&
            activeApplicant.generatedCoverLetter && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-3 text-xs text-slate-800 leading-relaxed">
                <div className="font-bold text-sm text-slate-900">
                  {activeApplicant.generatedCoverLetter.subject}
                </div>
                <p>{activeApplicant.generatedCoverLetter.greeting}</p>
                {activeApplicant.generatedCoverLetter.paragraphs.map(
                  (p, idx) => (
                    <p key={idx}>{p}</p>
                  )
                )}
                <p className="pt-2 font-semibold">
                  {activeApplicant.generatedCoverLetter.signOff}
                </p>
              </div>
            )}
        </section>
      )}
    </div>
    </div>
  );
}
