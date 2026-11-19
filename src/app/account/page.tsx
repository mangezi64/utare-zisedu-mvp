"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  User,
  CheckCircle2,
  Building2,
  Calendar,
  Briefcase,
  FileText,
  Sparkles,
  Laptop,
  Wifi,
  Sun,
  Edit3,
  Save,
  Download,
  ArrowRight,
  ShieldCheck,
  Globe,
  LogOut,
  KeyRound,
  Upload,
  Trash2,
  Camera,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CandidateCvArtifact,
  CandidateDocument,
  CandidateDocumentCategory,
  CandidateProfile,
  GeneratedCoverLetter,
  GeneratedCv,
  ZimbabweanCity,
} from "@/types";
import { JobApplicationRecord, StoredCandidateRecord } from "@/lib/store";
import { useViewMode } from "@/lib/view-mode-context";
import ZimbabweCitySelect from "@/components/ZimbabweCitySelect";
import DeleteAccountPanel from "@/components/DeleteAccountPanel";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrengthBox from "@/components/PasswordStrengthBox";
import { validatePassword } from "@/lib/validation";

const DEFAULT_PROFILE: CandidateProfile = {
  fullName: "Chipo Nyamande",
  email: "chipo.nyamande@example.co.zw",
  phone: "+263 77 210 9876",
  city: "Harare",
  highestQualification: "Bachelors Degree",
  fieldOfStudy: "BSc Honours in Economics & Statistics",
  yearsExperience: 1,
  canWorkRemotely: false,
  hubSupportNeed: "Full Hub Access Needed (Need Workstation, Solar Power & Internet)",
  hasDedicatedLaptop: false,
  primaryDevice: "Smartphone Only",
  internetAccessType: "Mobile Data Bundles Only",
  powerReliabilityHours: 5,
  hasGlobalPaymentRail: false,
  primaryGoal: "International Remote Work",
  currentSkills: ["Statistical Analysis", "Academic Research", "Excel", "Report Writing"],
};

export default function CandidateAccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useViewMode();
  const [candidate, setCandidate] = useState<StoredCandidateRecord | null>(null);
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [cvArtifacts, setCvArtifacts] = useState<CandidateCvArtifact[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  function jumpToSection(sectionId: string) {
    setHighlightedSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      setHighlightedSection((prev) => (prev === sectionId ? null : prev));
    }, 2200);
  }

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwChangeAttempted, setPwChangeAttempted] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Document Upload state
  const [docCategory, setDocCategory] = useState<CandidateDocumentCategory>("degree");
  const [docTitle, setDocTitle] = useState("");
  const [docIssuer, setDocIssuer] = useState("");
  const [docYear, setDocYear] = useState("2024");
  const [docFile, setDocFile] = useState<{
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    dataUrl: string;
  } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  function loadAttachments() {
    fetch("/api/auth/attachments")
      .then((r) => r.json())
      .then((data) => {
        if (data.documents) setDocuments(data.documents);
        if (data.cvArtifacts) setCvArtifacts(data.cvArtifacts);
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    const url = user?.email
      ? `/api/auth/profile?email=${encodeURIComponent(user.email)}`
      : "/api/auth/profile";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.candidate) {
          setCandidate(data.candidate);
          setProfile(data.candidate.profile);
        } else if (user) {
          setProfile((prev) => ({
            ...prev,
            fullName: user.name || prev.fullName,
            email: user.email || prev.email,
            city: (user.city as ZimbabweanCity) || prev.city,
            highestQualification: (user.qualification as any) || prev.highestQualification,
            fieldOfStudy: user.fieldOfStudy || prev.fieldOfStudy,
          }));
        }
      })
      .catch(() => {});

    const jobsUrl = user?.email
      ? `/api/jobs?email=${encodeURIComponent(user.email)}`
      : "/api/jobs";

    fetch(jobsUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data.applications) {
          if (user?.email) {
            const userApps = data.applications.filter(
              (a: JobApplicationRecord) =>
                (user.name && a.candidateName.toLowerCase() === user.name.toLowerCase()) ||
                (user.id && a.candidateId === user.id) ||
                (user.email && a.candidateId === user.email) ||
                (user.email &&
                  a.candidateEmail &&
                  a.candidateEmail.toLowerCase() === user.email.toLowerCase())
            );
            setApplications(userApps);
          } else {
            setApplications([]);
          }
        }
      })
      .catch(() => {});

    loadAttachments();
  }, [user, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen">
        <PageBreadcrumb current="My Workspace" />
        <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign In to Your Workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in or create an account to view your personalized 6-factor diagnostic, AI career roadmap, booked partner hub pass, and submitted job applications.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/login?redirect=/account"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            Candidate Sign In / Register
          </Link>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200">
          <Link
            href="/opportunities"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            ← Or explore public remote opportunities first
          </Link>
        </div>
      </div>
      </div>
    );
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (data.candidate) {
        setCandidate(data.candidate);
        setProfile(data.candidate.profile);
        setIsEditing(false);
        setStatusMessage("Your candidate account & profile have been saved successfully!");
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch {
      setStatusMessage("Failed to save profile. Please check your details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxDim = 240;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setProfile((prev) => ({
          ...prev,
          avatarDataUrl: compressedDataUrl,
          includePhotoOnCv: true,
        }));
        const res = await fetch("/api/auth/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "avatar",
            avatarDataUrl: compressedDataUrl,
            includePhotoOnCv: true,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.candidate) {
          setCandidate(data.candidate);
          setProfile(data.candidate.profile);
          setStatusMessage("Profile photo uploaded & enabled for your tailored CVs!");
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleTogglePhotoOnCv(includePhoto: boolean) {
    setProfile((prev) => ({ ...prev, includePhotoOnCv: includePhoto }));
    await fetch("/api/auth/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "avatar",
        avatarDataUrl: profile.avatarDataUrl,
        includePhotoOnCv: includePhoto,
      }),
    }).catch(() => {});
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPwChangeAttempted(true);
    if (!currentPassword || !newPassword) {
      setPasswordError("Please enter both your current and new password.");
      return;
    }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) {
      const missing = pwCheck.requirements
        .filter((r) => !r.met)
        .map((r) => r.label)
        .join(", ");
      setPasswordError(
        missing
          ? `New password is missing: ${missing}.`
          : pwCheck.error || "Please choose a stronger password."
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "change",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPwChangeAttempted(false);
      setStatusMessage(data.message || "Password updated successfully!");
    } catch {
      setPasswordError("Unable to reach server. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  function handleDocFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024) {
      setStatusMessage("File exceeds 4.5 MB limit. Please upload a smaller PDF or image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDocFile({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        dataUrl: String(reader.result),
      });
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docFile || !docTitle.trim()) return;
    setUploadingDoc(true);
    try {
      const res = await fetch("/api/auth/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "document",
          category: docCategory,
          title: docTitle.trim(),
          issuer: docIssuer.trim() || undefined,
          issueYear: docYear.trim() || undefined,
          ...docFile,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.document) {
        setDocTitle("");
        setDocIssuer("");
        setDocFile(null);
        loadAttachments();
        setStatusMessage(data.message || "Credential document uploaded!");
      }
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleDeleteDocument(id: string) {
    await fetch(`/api/auth/attachments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    loadAttachments();
    setStatusMessage("Document removed.");
  }

  async function handleDownloadCvDocx(cv: GeneratedCv, key: string) {
    setDownloadingId(key);
    try {
      const enrichedCv: GeneratedCv = {
        ...cv,
        avatarDataUrl: cv.avatarDataUrl || profile.avatarDataUrl,
        includePhotoOnCv:
          cv.includePhotoOnCv !== undefined
            ? cv.includePhotoOnCv
            : Boolean(profile.includePhotoOnCv),
      };
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "cv-docx", cv: enrichedCv }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${cv.fullName.replace(/\s+/g, "_")}_Tailored_CV.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadLetterDocx(
    coverLetter: GeneratedCoverLetter,
    key: string
  ) {
    setDownloadingId(key);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "letter-docx", coverLetter }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${coverLetter.fullName.replace(
          /\s+/g,
          "_"
        )}_Application_Letter.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloadingId(null);
    }
  }

  const assignedHub = candidate?.pathway.recommendedHub;
  const assignedCoach = candidate?.pathway.assignedCoach;
  const milestones = candidate?.pathway.upskillingMilestones || [];
  const completedMilestones = candidate?.completedMilestones || [];

  return (
    <div className="w-full min-h-screen">
      <PageBreadcrumb current="My Workspace" />
      {/* Faith & Amanda's Main Dashboard Hero */}
      <section className="page-hero">
        <span className="eyebrow">MAIN DASHBOARD · CANDIDATE WORKSPACE</span>
        <h1>
          Welcome, {profile.fullName.split(" ")[0]}. Your next step starts
          here.
        </h1>
        <p>
          Your UTARE overview brings your 6-factor diagnostic, 90-day AI career
          pathway, matched innovation hub pass, and opportunity applications
          into one place.
        </p>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {statusMessage && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900 shadow-sm flex items-center justify-between">
          <span>✓ {statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Candidate Header / Summary Banner */}
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {profile.avatarDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.avatarDataUrl}
                alt={profile.fullName}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white font-extrabold text-2xl shadow-sm">
                {profile.fullName.charAt(0)}
              </div>
            )}
            <label
              title="Upload or change profile picture"
              className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Verified Candidate Workspace
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {profile.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {profile.highestQualification} in {profile.fieldOfStudy} • {profile.city}
            </p>
            <label className="inline-flex items-center gap-1.5 pt-0.5 text-[11px] font-semibold text-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(profile.includePhotoOnCv)}
                onChange={(e) => handleTogglePhotoOnCv(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700"
              />
              Include my profile photo on generated CVs (.docx & PDF)
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditing ? "Cancel Editing" : "Edit My Details"}
          </button>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            My CV & Application Studio
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Quick Workspace Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
          Jump to:
        </span>
        {[
          { id: "section-profile", label: "Profile & Hardware" },
          { id: "section-password", label: "Password & Security" },
          { id: "section-documents", label: `Degrees & Certs (${documents.length})` },
          ...(cvArtifacts.length > 0
            ? [{ id: "section-artifacts", label: `Saved CVs (${cvArtifacts.length})` }]
            : []),
          { id: "section-applications", label: `Applications (${applications.length})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => jumpToSection(item.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              highlightedSection === item.id
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Left is Profile & Info, Right is Pathway, Hub & Applications */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column (5 cols): Profile Info / Edit Form */}
        <div className="lg:col-span-5 space-y-6">
          <div
            id="section-profile"
            className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm space-y-4 transition ${
              highlightedSection === "section-profile"
                ? "border-emerald-600 ring-4 ring-emerald-500/20"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Personal Credentials & Hardware Profile
              </h2>
              <span className="text-xs font-semibold text-emerald-700">
                {candidate?.assessment?.readinessTier || "Bridge-Ready"}
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone (WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <ZimbabweCitySelect
                      value={profile.city}
                      onChange={(city) =>
                        setProfile({
                          ...profile,
                          city,
                        })
                      }
                      label="City / Town"
                      selectClassName="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={profile.yearsExperience}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          yearsExperience: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Field of Study / Discipline
                  </label>
                  <input
                    type="text"
                    value={profile.fieldOfStudy}
                    onChange={(e) =>
                      setProfile({ ...profile, fieldOfStudy: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={profile.hasDedicatedLaptop}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          hasDedicatedLaptop: e.target.checked,
                          primaryDevice: e.target.checked
                            ? "Dedicated Laptop / PC"
                            : "Smartphone Only",
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>I own a dedicated personal laptop</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={profile.hasGlobalPaymentRail}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          hasGlobalPaymentRail: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>I have an active Deel / Payoneer / Nostro account</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email:</span>
                    <span className="font-semibold text-slate-800">{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone:</span>
                    <span className="font-semibold text-slate-800">{profile.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Remote / Hub Mode:</span>
                    <span className="font-semibold text-slate-800">
                      {profile.hubSupportNeed
                        ? profile.hubSupportNeed.split("(")[0].trim()
                        : profile.hasDedicatedLaptop
                        ? "Hybrid / Independent"
                        : "Needs Hub Access"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Goal:</span>
                    <span className="font-semibold text-slate-800">{profile.primaryGoal}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5 text-purple-600" />
                      Primary Device
                    </span>
                    <span className="font-bold text-slate-800">{profile.primaryDevice}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Wifi className="h-3.5 w-3.5 text-blue-600" />
                      Connectivity
                    </span>
                    <span className="font-bold text-slate-800">
                      {profile.internetAccessType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sun className="h-3.5 w-3.5 text-amber-600" />
                      Power Reliability
                    </span>
                    <span className="font-bold text-slate-800">
                      {profile.powerReliabilityHours} hrs/day
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-400 block text-[11px] mb-1.5">
                    Skills on File:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.currentSkills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security & Password Update Card */}
          <div
            id="section-password"
            className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm space-y-4 transition ${
              highlightedSection === "section-password"
                ? "border-emerald-600 ring-4 ring-emerald-500/20"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-emerald-700" />
                Security &amp; Password Update
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Synced with Supabase Auth
              </span>
            </div>

            {passwordError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password *
                  </label>
                  <PasswordInput
                    required
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Min 8 chars, upper, lower, number, symbol"
                    autoComplete="new-password"
                    invalid={
                      pwChangeAttempted && !validatePassword(newPassword).isValid
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New *
                  </label>
                  <PasswordInput
                    required
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    invalid={
                      (confirmNewPassword.length > 0 &&
                        confirmNewPassword !== newPassword) ||
                      (pwChangeAttempted && !confirmNewPassword)
                    }
                  />
                </div>
              </div>
              <PasswordStrengthBox
                id="account-password-box"
                password={newPassword}
                showIssues={pwChangeAttempted}
              />
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition disabled:opacity-50"
              >
                {changingPassword ? "Updating Password..." : "Update My Password"}
              </button>
            </form>
          </div>

          {/* Quick Tools Access Card */}
          <div className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              Available Tools for You
            </h3>
            <div className="grid gap-2">
              <Link
                href="/assessment"
                className="flex items-center justify-between rounded-xl bg-white p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition border border-emerald-100 shadow-xs"
              >
                <span>1. Retake Skills & Readiness Diagnostic</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/pathway"
                className="flex items-center justify-between rounded-xl bg-white p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition border border-emerald-100 shadow-xs"
              >
                <span>2. View AI Career Pathway & Book Coach</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/hubs"
                className="flex items-center justify-between rounded-xl bg-white p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition border border-emerald-100 shadow-xs"
              >
                <span>3. Reserve Solar Workstation at Partner Hub</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/jobs"
                className="flex items-center justify-between rounded-xl bg-white p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition border border-emerald-100 shadow-xs"
              >
                <span>4. Generate Grounded Word (.docx) & PDF CV</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          <DeleteAccountPanel />
        </div>

        {/* Right Column (7 cols): Hub Assignment, Milestone Progress & Job Applications */}
        <div className="lg:col-span-7 space-y-6">
          {/* Matched Hub or Diaspora Track Card */}
          {profile.city.toLowerCase().includes("abroad") ||
          profile.city.toLowerCase().includes("diaspora") ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-700" />
                  <h3 className="text-base font-bold text-blue-900">
                    Diaspora Remote Track ({profile.city})
                  </h3>
                </div>
                <span className="rounded-full bg-blue-200 text-blue-900 px-2.5 py-0.5 text-xs font-bold">
                  International Candidate
                </span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                You are registered on the Diaspora Remote Track. You have full access to our skills diagnostic assessment, AI career roadmap, ATS CV & application studio, and verified remote job applications. Physical solar and Starlink co-working partner hubs operate within Zimbabwe (Harare, Bulawayo, Mutare, Gweru, Masvingo) and are accessible whenever you are in-country.
              </p>
              <div className="pt-2 flex justify-end">
                <Link
                  href="/jobs"
                  className="text-xs font-bold text-blue-800 hover:underline"
                >
                  Browse Remote Opportunities & Tailor CV →
                </Link>
              </div>
            </div>
          ) : assignedHub ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Your Assigned Partner Innovation Hub
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold">
                  100% Subsidized Pass
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-bold text-slate-900">{assignedHub.name}</div>
                <p className="text-xs text-slate-600">{assignedHub.address}</p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-600">
                  <span className="bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-amber-900">
                    ☀️ 100% Solar Inverter Backup
                  </span>
                  <span className="bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-blue-900">
                    ⚡ {assignedHub.internetProvider} ({assignedHub.avgSpeedMbps} Mbps)
                  </span>
                  <span className="bg-purple-50 border border-purple-200 rounded px-2 py-0.5 text-purple-900">
                    💻 PC Loan Available
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href={`/hubs?city=${assignedHub.city}`}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  View Hub Amenities & Operating Hours →
                </Link>
              </div>
            </div>
          ) : null}

          {/* AI Roadmap Milestones */}
          {milestones.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Your AI Upskilling Roadmap & Milestones
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {completedMilestones.length} of {milestones.length} Completed
                </span>
              </div>

              <div className="space-y-3">
                {milestones.map((m) => {
                  const done = completedMilestones.includes(m.phase);
                  return (
                    <div
                      key={m.phase}
                      className={`rounded-xl border p-4 text-xs transition ${
                        done
                          ? "border-emerald-300 bg-emerald-50/50"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 text-sm">
                            {m.title}
                          </span>
                          <p className="text-slate-600">{m.objective}</p>
                          <div className="text-slate-500 font-medium">
                            Deliverable: <strong>{m.deliverable}</strong>
                          </div>
                        </div>
                        {done ? (
                          <span className="flex items-center gap-1 font-bold text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" /> Done
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">In Progress</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1 flex justify-end">
                <Link
                  href="/pathway"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Open Full Pathway Roadmap →
                </Link>
              </div>
            </div>
          )}

          {/* Degrees, Certificates & Supporting Documents Vault (Versioned) */}
          <div
            id="section-documents"
            className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm space-y-4 transition ${
              highlightedSection === "section-documents"
                ? "border-emerald-600 ring-4 ring-emerald-500/20"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Degrees, Certificates &amp; Supporting Documents ({documents.length})
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Versioned Vault
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Upload your academic degrees, professional certificates, transcripts, or portfolio files. Re-uploading a credential with the same title automatically versions it (v1, v2, v3) and shares the latest verified version with employers when you apply.
            </p>

            <form
              onSubmit={handleUploadDocument}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Document Category *
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) =>
                      setDocCategory(e.target.value as CandidateDocumentCategory)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="degree">Bachelors / Masters Degree</option>
                    <option value="certificate">Professional Certificate</option>
                    <option value="transcript">Academic Transcript</option>
                    <option value="cv_upload">Existing CV / Resume</option>
                    <option value="portfolio">Portfolio / Work Sample</option>
                    <option value="other">Other Supporting Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. BSc Computer Science Degree"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Institution &amp; Year
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={docIssuer}
                      onChange={(e) => setDocIssuer(e.target.value)}
                      placeholder="e.g. UZ / NUST"
                      className="w-2/3 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={docYear}
                      onChange={(e) => setDocYear(e.target.value)}
                      placeholder="2024"
                      className="w-1/3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-emerald-400 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {docFile
                      ? `${docFile.fileName} (${Math.round(
                          docFile.fileSizeBytes / 1024
                        )} KB)`
                      : "Choose PDF, Image, or Word File"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleDocFileSelect}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!docFile || !docTitle.trim() || uploadingDoc}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingDoc ? "Uploading..." : "Upload & Save Version"}
                </button>
              </div>
            </form>

            {documents.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                No degrees or certificates uploaded yet. Upload your credentials above to attach them to your profile and job applications.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {doc.title}
                        </span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          v{doc.version} {doc.isLatest ? "· Latest" : ""}
                        </span>
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                          {doc.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {doc.issuer ? `${doc.issuer} • ` : ""}
                        {doc.issueYear ? `${doc.issueYear} • ` : ""}
                        {doc.fileName} ({Math.max(1, Math.round(doc.fileSizeBytes / 1024))} KB)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.dataUrl}
                        download={doc.fileName}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Versioned Tailored CVs & Application Letters */}
          {cvArtifacts.length > 0 && (
            <div
              id="section-artifacts"
              className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm space-y-4 transition ${
                highlightedSection === "section-artifacts"
                  ? "border-emerald-600 ring-4 ring-emerald-500/20"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Saved Tailored CVs &amp; Application Letters ({cvArtifacts.length})
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Version History
                </span>
              </div>

              <div className="space-y-2.5">
                {cvArtifacts.map((art) => (
                  <div
                    key={art.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {art.jobTitle} — {art.company}
                        </span>
                        <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                          Version v{art.version}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Generated {new Date(art.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={downloadingId === `cv-${art.id}`}
                        onClick={() =>
                          handleDownloadCvDocx(art.generatedCv, `cv-${art.id}`)
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 transition disabled:opacity-50"
                      >
                        <Download className="h-3 w-3" />
                        {downloadingId === `cv-${art.id}`
                          ? "Exporting..."
                          : "Download CV (.docx)"}
                      </button>
                      <button
                        type="button"
                        disabled={downloadingId === `let-${art.id}`}
                        onClick={() =>
                          handleDownloadLetterDocx(
                            art.generatedCoverLetter,
                            `let-${art.id}`
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                      >
                        <Download className="h-3 w-3" />
                        {downloadingId === `let-${art.id}`
                          ? "Exporting..."
                          : "Download Letter (.docx)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Applications Submitted */}
          <div
            id="section-applications"
            className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm space-y-4 transition ${
              highlightedSection === "section-applications"
                ? "border-emerald-600 ring-4 ring-emerald-500/20"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Your Job Applications ({applications.length})
                </h3>
              </div>
              <Link
                href="/jobs"
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Browse Remote Roles →
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                You haven&apos;t submitted any job applications yet. Go to the{" "}
                <Link href="/jobs" className="text-emerald-700 font-bold underline">
                  Remote Jobs & CV Studio
                </Link>{" "}
                to generate a tailored CV and submit your first application.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-slate-200 p-4 text-xs space-y-2.5 bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {app.jobTitle}
                        </span>
                        <div className="text-slate-600">{app.company}</div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          app.status === "hired"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "shortlisted"
                            ? "bg-amber-100 text-amber-900"
                            : app.status === "under_review"
                            ? "bg-blue-100 text-blue-800"
                            : app.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {app.status === "hired"
                          ? "Hired"
                          : app.status === "shortlisted"
                          ? "Shortlisted"
                          : app.status === "under_review"
                          ? "Under Review"
                          : app.status === "rejected"
                          ? "Not Selected"
                          : "Submitted"}
                      </span>
                    </div>

                    <p className="text-slate-600 line-clamp-2 italic bg-white p-2 rounded border border-slate-100">
                      &quot;{app.tailoredResumePitch}&quot;
                    </p>

                    {app.employerFeedbackNote ? (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] text-slate-700">
                        <strong className="text-slate-900">Employer Feedback: </strong>
                        {app.employerFeedbackNote}
                      </div>
                    ) : app.status === "rejected" ? (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] text-slate-500">
                        The employer exercised their right not to share specific feedback for this hiring decision.
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          app.sharedWithEmployer === false
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {app.sharedWithEmployer === false
                          ? "Sharing Paused (Hidden from Employer)"
                          : "Shared with Employer (Consent Active)"}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const nextVal = app.sharedWithEmployer === false;
                          const res = await fetch("/api/jobs", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              applicationId: app.id,
                              sharedWithEmployer: nextVal,
                            }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok && data.application) {
                            setApplications((prev) =>
                              prev.map((item) =>
                                item.id === app.id ? data.application : item
                              )
                            );
                            setStatusMessage(
                              nextVal
                                ? `Resumed sharing application with ${app.company}.`
                                : `Paused sharing — ${app.company} can no longer view this application.`
                            );
                          }
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {app.sharedWithEmployer === false
                          ? "Share with Employer"
                          : "Pause Employer Access"}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                      <div>
                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                        {app.updatedAt && app.updatedBy && (
                          <span className="ml-2 text-slate-400">
                            • Updated {new Date(app.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {app.generatedCv && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadCvDocx(
                                app.generatedCv!,
                                `app-cv-${app.id}`
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition"
                          >
                            <Download className="h-3 w-3" />
                            Download CV (.docx)
                          </button>
                        )}
                        {app.generatedCoverLetter && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadLetterDocx(
                                app.generatedCoverLetter!,
                                `app-let-${app.id}`
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Download className="h-3 w-3" />
                            Download Letter (.docx)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
