"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  Laptop,
  Wifi,
  Sun,
  Shield,
  Download,
  Eye,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Award,
  Globe,
  Clock,
  Compass,
  Zap,
  Building2,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import {
  CandidateCvArtifact,
  CandidateDocument,
} from "@/types";
import {
  JobApplicationRecord,
  StoredCandidateRecord,
} from "@/lib/store";

export interface CandidateQuickInfoModalProps {
  candidate: StoredCandidateRecord | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  documents?: CandidateDocument[];
  cvArtifacts?: CandidateCvArtifact[];
  applications?: JobApplicationRecord[];
  onOpenPathway?: (candidate: StoredCandidateRecord) => void;
}

type TabKey = "overview" | "infrastructure" | "credentials" | "pathway";

interface PreviewDocumentState {
  title: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  category?: string;
  issuer?: string;
}

export default function CandidateQuickInfoModal({
  candidate,
  isOpen,
  onClose,
  userRole = "candidate",
  documents: initialDocuments = [],
  cvArtifacts: initialCvArtifacts = [],
  applications: initialApplications = [],
  onOpenPathway,
}: CandidateQuickInfoModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loadedDocs, setLoadedDocs] = useState<CandidateDocument[]>(initialDocuments);
  const [loadedArtifacts, setLoadedArtifacts] = useState<CandidateCvArtifact[]>(initialCvArtifacts);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocumentState | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      setLoadedDocs(initialDocuments);
    }
  }, [initialDocuments]);

  useEffect(() => {
    if (initialCvArtifacts && initialCvArtifacts.length > 0) {
      setLoadedArtifacts(initialCvArtifacts);
    }
  }, [initialCvArtifacts]);

  // Fetch candidate-specific documents when modal opens if not already loaded
  useEffect(() => {
    if (!isOpen || !candidate?.profile?.email) return;

    const email = candidate.profile.email.trim().toLowerCase();
    const hasExistingDocs = loadedDocs.some(
      (d) => (d.candidateEmail || "").trim().toLowerCase() === email
    );

    if (!hasExistingDocs) {
      setFetchingDocs(true);
      fetch(`/api/auth/attachments?email=${encodeURIComponent(email)}`, {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (Array.isArray(data.documents) && data.documents.length > 0) {
              setLoadedDocs((prev) => {
                const map = new Map<string, CandidateDocument>();
                [...prev, ...data.documents].forEach((d) => map.set(d.id, d));
                return Array.from(map.values());
              });
            }
            if (Array.isArray(data.cvArtifacts) && data.cvArtifacts.length > 0) {
              setLoadedArtifacts((prev) => {
                const map = new Map<string, CandidateCvArtifact>();
                [...prev, ...data.cvArtifacts].forEach((a) => map.set(a.id, a));
                return Array.from(map.values());
              });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load candidate documents:", err);
        })
        .finally(() => {
          setFetchingDocs(false);
        });
    }
  }, [isOpen, candidate?.profile?.email, loadedDocs]);

  // Handle ESC key and prevent body scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (previewDoc) {
          setPreviewDoc(null);
        } else {
          onClose();
        }
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, previewDoc]);

  // Filter documents & artifacts for active candidate
  const candidateEmail = (candidate?.profile?.email || "").trim().toLowerCase();
  const candidateDocs = useMemo(() => {
    if (!candidateEmail) return [];
    return loadedDocs.filter(
      (d) =>
        (d.candidateEmail || "").trim().toLowerCase() === candidateEmail ||
        (candidate?.id && d.candidateId === candidate.id)
    );
  }, [loadedDocs, candidateEmail, candidate?.id]);

  const candidateArtifacts = useMemo(() => {
    if (!candidateEmail) return [];
    return loadedArtifacts.filter(
      (a) =>
        (a.candidateEmail || "").trim().toLowerCase() === candidateEmail ||
        (candidate?.id && a.candidateId === candidate.id)
    );
  }, [loadedArtifacts, candidateEmail, candidate?.id]);

  const candidateApplications = useMemo(() => {
    if (!candidate) return [];
    const name = (candidate.profile?.fullName || "").trim().toLowerCase();
    return initialApplications.filter(
      (a) =>
        a.candidateId === candidate.id ||
        (a.candidateEmail && a.candidateEmail.trim().toLowerCase() === candidateEmail) ||
        (name && a.candidateName?.trim().toLowerCase() === name)
    );
  }, [initialApplications, candidate, candidateEmail]);

  if (!isOpen || !candidate) return null;

  const { profile, assessment, pathway, createdAt } = candidate;

  // Name initials for avatar fallback
  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CA";

  // Target Role
  const targetRole =
    pathway?.targetRemoteRoles?.[0]?.role || profile?.primaryGoal || "Remote Professional";

  // Available hours calculation
  const powerHours = profile?.powerReliabilityHours ?? 6;
  const estimatedWeeklyHours = Math.min(powerHours * 5, 40);

  // Helper to trigger safe preview or open blob in new tab
  function handleOpenBlobInNewTab(dataUrl: string, mimeType: string) {
    try {
      if (dataUrl.startsWith("data:")) {
        const parts = dataUrl.split(",");
        const byteString = atob(parts[1]);
        const mime = parts[0].split(":")[1].split(";")[0] || mimeType;
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        window.open(dataUrl, "_blank");
      }
    } catch {
      window.open(dataUrl, "_blank");
    }
  }

  function handleOpenPathwayClick() {
    if (onOpenPathway) {
      onOpenPathway(candidate!);
    } else {
      window.location.href = `/pathway?email=${encodeURIComponent(profile.email)}`;
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-quick-info-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (previewDoc) setPreviewDoc(null);
          else onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 rounded-full p-2 text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile?.avatarDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.avatarDataUrl}
                  alt={profile.fullName || "Candidate Avatar"}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md bg-white"
                />
              ) : (
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-2xl shadow-md border-2 border-emerald-400/40">
                  {initials}
                </div>
              )}
              {profile?.hasDedicatedLaptop && (
                <span
                  title="Has dedicated laptop"
                  className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-white border-2 border-slate-900"
                >
                  <Laptop className="h-3 w-3" />
                </span>
              )}
            </div>

            {/* Candidate Identity Details */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[0.78rem] font-bold uppercase tracking-wider">
                  {userRole}
                </span>
                <span className="rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[0.78rem] font-semibold">
                  {profile?.city || "Zimbabwe"}
                </span>
                <span className="rounded-md bg-white/10 text-slate-200 px-2 py-0.5 text-[0.78rem] font-medium">
                  {assessment?.readinessTier || "Bridge-Ready"}
                </span>
                {createdAt && (
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h2
                id="candidate-quick-info-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate"
              >
                {profile?.fullName || "Candidate Profile"}
              </h2>

              <p className="text-xs sm:text-sm text-emerald-200/90 font-medium truncate">
                Target Role: <strong>{targetRole}</strong> • {profile?.highestQualification} in{" "}
                {profile?.fieldOfStudy}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <a
                    href={`mailto:${profile?.email}`}
                    className="hover:underline hover:text-white"
                  >
                    {profile?.email}
                  </a>
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={`tel:${profile.phone}`}
                      className="hover:underline hover:text-white"
                    >
                      {profile.phone}
                    </a>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {profile?.yearsExperience ?? 0} yr(s) experience
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Profile &amp; Career
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("infrastructure")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "infrastructure"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            Equipment &amp; Readiness
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "credentials"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Credentials &amp; CVs ({candidateDocs.length + candidateArtifacts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pathway")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "pathway"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            AI Pathway Summary
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY (SCROLLABLE) */}
        {/* ========================================================================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* TAB 1: OVERVIEW & CAREER */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <div className="text-[0.78rem] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-emerald-600" />
                    Target Role &amp; Goal
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{targetRole}</div>
                  <div className="text-xs text-slate-500">
                    Primary Goal: {profile?.primaryGoal || "International Remote Career"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <div className="text-[0.78rem] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                    Qualification &amp; Field
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {profile?.highestQualification}
                  </div>
                  <div className="text-xs text-slate-500">
                    Field of Study: {profile?.fieldOfStudy}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <div className="text-[0.78rem] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-600" />
                    Location &amp; Status
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {profile?.city}, Zimbabwe
                  </div>
                  <div className="text-xs text-slate-500">
                    Employment: {profile?.employmentStatus} ({profile?.monthlyIncomeBracket})
                  </div>
                </div>
              </div>

              {/* Skills & Strengths */}
              <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  Reported Skills &amp; Competencies
                </h3>
                {profile?.currentSkills && profile.currentSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.currentSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific skills listed.</p>
                )}
              </div>

              {/* Submitted Applications Summary */}
              {candidateApplications.length > 0 && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-blue-700" />
                      Submitted Applications ({candidateApplications.length})
                    </h3>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {candidateApplications.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1 shadow-2xs"
                      >
                        <div className="font-bold text-slate-900">{app.jobTitle}</div>
                        <div className="text-slate-500 text-[0.78rem]">
                          {app.company} • Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                        {app.status && (
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[0.72rem] font-bold uppercase text-slate-700">
                            Status: {app.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INFRASTRUCTURE & READINESS */}
          {activeTab === "infrastructure" && (
            <div className="space-y-6">
              {/* Equipment & Constraint Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[0.78rem] font-bold uppercase tracking-wider">Device Type</span>
                    <Laptop className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {profile?.primaryDevice || "Smartphone Only"}
                  </div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[0.72rem] font-bold ${
                      profile?.hasDedicatedLaptop
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {profile?.hasDedicatedLaptop ? "✓ Dedicated Laptop" : "⚠️ Needs Laptop Access"}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[0.78rem] font-bold uppercase tracking-wider">Internet Setup</span>
                    <Wifi className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {profile?.internetAccessType || "Mobile Bundles"}
                  </div>
                  <div className="text-[0.78rem] text-slate-500">
                    Connectivity: {profile?.internetAccessType?.includes("Fiber") || profile?.internetAccessType?.includes("Starlink") ? "High Bandwidth" : "Constrained / Cellular"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[0.78rem] font-bold uppercase tracking-wider">Power Reliability</span>
                    <Sun className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {powerHours} hrs / day
                  </div>
                  <div className="text-[0.78rem] text-slate-500">
                    Est. {estimatedWeeklyHours} hrs/wk productive capacity
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[0.78rem] font-bold uppercase tracking-wider">Payment Rail</span>
                    <Globe className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {profile?.hasGlobalPaymentRail ? "Configured" : "Needs Onboarding"}
                  </div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[0.72rem] font-bold ${
                      profile?.hasGlobalPaymentRail
                        ? "bg-purple-100 text-purple-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {profile?.hasGlobalPaymentRail ? "✓ Deel / Payoneer Ready" : "Local Nostro Only"}
                  </span>
                </div>
              </div>

              {/* Assessment Diagnostic Scores */}
              <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-emerald-700" />
                      Readiness Diagnostics &amp; Factor Scores
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluated by {pathway?.generatedBy === "gemini-live" ? "Live Gemini AI" : "Utare Deterministic Engine"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-lg bg-emerald-100 text-emerald-900 px-3 py-1 text-xs font-bold">
                      Readiness Tier: {assessment?.readinessTier || "Bridge-Ready"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Overall Score:</span>
                      <strong className="text-emerald-700">
                        {assessment?.overallScore ?? 75}/100
                      </strong>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.min(assessment?.overallScore ?? 75, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Infrastructure Index:</span>
                      <strong className="text-blue-700">
                        {assessment?.infrastructureIndexScore ?? 60}/100
                      </strong>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.min(assessment?.infrastructureIndexScore ?? 60, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Digital Readiness:</span>
                      <strong className="text-purple-700">
                        {assessment?.digitalReadinessScore ?? 70}/100
                      </strong>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{
                          width: `${Math.min(assessment?.digitalReadinessScore ?? 70, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Domain Competency:</span>
                      <strong className="text-amber-700">
                        {assessment?.domainCompetencyScore ?? 75}/100
                      </strong>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{
                          width: `${Math.min(assessment?.domainCompetencyScore ?? 75, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Critical Gaps & Strengths */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      Identified Skill &amp; Infrastructure Gaps
                    </h4>
                    {assessment?.criticalGaps && assessment.criticalGaps.length > 0 ? (
                      <ul className="space-y-1 text-xs text-rose-950">
                        {assessment.criticalGaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No critical hardware or skill gaps flagged.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Demonstrated Strengths
                    </h4>
                    {assessment?.strengths && assessment.strengths.length > 0 ? (
                      <ul className="space-y-1 text-xs text-emerald-950">
                        {assessment.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Standard foundational competencies.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIALS & CVS */}
          {activeTab === "credentials" && (
            <div className="space-y-6">
              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-700" />
                      Degrees, Certificates &amp; Uploaded Credentials ({candidateDocs.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Uploaded by candidate to support their qualifications and application submissions.
                    </p>
                  </div>
                  {fetchingDocs && (
                    <span className="text-xs text-emerald-600 animate-pulse font-medium">
                      Checking uploads...
                    </span>
                  )}
                </div>

                {candidateDocs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 bg-slate-50/50">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    No degrees or certificates uploaded yet by this candidate.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {candidateDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-emerald-300 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{doc.title}</span>
                            <span className="rounded bg-emerald-100 text-emerald-800 text-[0.72rem] font-bold px-1.5 py-0.5 uppercase">
                              {doc.category}
                            </span>
                            <span className="rounded bg-slate-100 text-slate-600 text-[0.72rem] font-semibold px-1.5 py-0.5">
                              v{doc.version} {doc.isLatest ? "· Latest" : ""}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {doc.issuer ? `${doc.issuer} • ` : ""}
                            {doc.issueYear ? `Year: ${doc.issueYear} • ` : ""}
                            {doc.fileName} ({Math.max(1, Math.round((doc.fileSizeBytes || 0) / 1024))} KB)
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {doc.dataUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  title: doc.title,
                                  fileName: doc.fileName,
                                  mimeType: doc.mimeType,
                                  dataUrl: doc.dataUrl,
                                  category: doc.category,
                                  issuer: doc.issuer,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                              Preview
                            </button>
                          )}

                          {doc.dataUrl && (
                            <a
                              href={doc.dataUrl}
                              download={doc.fileName}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-2xs"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tailored CV Artifacts */}
              {candidateArtifacts.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-700" />
                    Generated Tailored CVs &amp; Application Letters ({candidateArtifacts.length})
                  </h3>

                  <div className="grid gap-2">
                    {candidateArtifacts.map((art) => (
                      <div
                        key={art.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-blue-300 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {art.jobTitle}
                            </span>
                            <span className="text-xs text-slate-600">at {art.company}</span>
                            <span className="rounded bg-blue-100 text-blue-800 text-[0.72rem] font-bold px-1.5 py-0.5">
                              v{art.version}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Generated: {new Date(art.createdAt).toLocaleDateString()} • Headline:{" "}
                            {art.generatedCv?.headline || "Professional CV"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: `Tailored CV: ${art.jobTitle} (${art.company})`,
                                fileName: `${art.jobTitle.replace(/\s+/g, "_")}_CV.txt`,
                                mimeType: "text/plain",
                                dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(
                                  `${art.generatedCv.fullName}\n${art.generatedCv.headline}\n${art.generatedCv.contactLine}\n\nSUMMARY\n${art.generatedCv.summary}\n\nCORE SKILLS\n${art.generatedCv.coreSkills.join(", ")}\n\nEXPERIENCE\n${(art.generatedCv.experience || []).map((e: { role: string; organization: string; dates: string; bullets: string[] }) => `${e.role} at ${e.organization} (${e.dates})\n${(e.bullets || []).map((b: string) => `• ${b}`).join("\n")}`).join("\n\n")}`
                                )}`,
                                category: "Generated CV",
                                issuer: "Utare CV Studio",
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                            View CV Text
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI PATHWAY SUMMARY */}
          {activeTab === "pathway" && (
            <div className="space-y-6">
              {/* Executive Diagnosis & Bridge Plan */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-700 text-white text-[0.78rem] font-bold px-2.5 py-0.5 uppercase tracking-wide">
                    {pathway?.recommendedTrack || "Career Track"}
                  </span>
                  <span className="text-xs font-semibold text-emerald-900">
                    Generated by: {pathway?.generatedBy || "utare-deterministic-engine"}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Executive Career Diagnosis
                  </h4>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {pathway?.executiveDiagnosis ||
                      "Candidate evaluated for high-impact remote delivery with paired hardware bridge support."}
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-emerald-200/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Infrastructure Bridge Plan
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {pathway?.infrastructureBridgePlan ||
                      "Pairing candidate with local partner hub workstations for guaranteed power and solar connectivity."}
                  </p>
                </div>
              </div>

              {/* Coach & Hub Pairing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paired Coach */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-4 w-4 text-emerald-600" />
                      Assigned Industry Coach
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[0.72rem] ${
                        candidate.coachingStatus === "Session Confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {candidate.coachingStatus}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-base">
                    {pathway?.assignedCoach?.fullName || "Assigned Coach"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {pathway?.assignedCoach?.title} • {pathway?.assignedCoach?.organization} (
                    {pathway?.assignedCoach?.city})
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2">
                    {pathway?.assignedCoach?.bio}
                  </div>
                </div>

                {/* Recommended Hub */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Matched Partner Hub
                    </span>
                    {candidate.bookedHubDesk ? (
                      <span className="font-bold text-[0.72rem] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        ✓ Desk Booked
                      </span>
                    ) : (
                      <span className="text-[0.72rem] text-slate-500">Pass Available</span>
                    )}
                  </div>

                  <div className="font-bold text-slate-900 text-base">
                    {pathway?.recommendedHub?.name || "Local Innovation Hub"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {pathway?.recommendedHub?.city} • {pathway?.recommendedHub?.address}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[0.78rem] text-slate-600 pt-1">
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
                      ☀️ Solar Backup: {pathway?.recommendedHub?.hasSolarBackup ? "Yes" : "Standard"}
                    </span>
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
                      🚀 {pathway?.recommendedHub?.avgSpeedMbps ?? 100} Mbps
                    </span>
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
                      💺 {pathway?.recommendedHub?.availableWorkstations ?? 20} Desks
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Roles & Monthly USD */}
              {pathway?.targetRemoteRoles && pathway.targetRemoteRoles.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    Target Remote Roles &amp; Earning Potential
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pathway.targetRemoteRoles.map((role, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{role.role}</span>
                          <span className="rounded bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 text-[0.78rem]">
                            {role.estimatedMonthlyUsd}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[0.78rem]">{role.matchReason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones Preview */}
              {pathway?.upskillingMilestones && pathway.upskillingMilestones.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    Upskilling Roadmap ({pathway.upskillingMilestones.length} Milestones)
                  </h4>
                  <div className="space-y-2">
                    {pathway.upskillingMilestones.map((m, idx) => {
                      const isCompleted = candidate.completedMilestones?.includes(m.phase);
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs"
                        >
                          <div className="mt-0.5">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{m.phase}: {m.title}</span>
                              <span className="text-[0.72rem] text-slate-400">({m.durationWeeks} wks)</span>
                            </div>
                            <div className="text-slate-600 text-[0.78rem]">{m.objective}</div>
                            <div className="text-slate-500 text-[0.78rem]">
                              <strong>Deliverable:</strong> {m.deliverable}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================================= */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Facilitator Inspection Mode • ID: <code className="text-slate-700">{candidate.id}</code>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleOpenPathwayClick}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open Full Pathway Simulator
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1-CLICK DOCUMENT PREVIEW OVERLAY / DRAWER */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
        >
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-3 text-white">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-sm truncate">{previewDoc.title}</span>
                <span className="rounded bg-white/20 text-[0.72rem] font-bold px-1.5 py-0.5 text-slate-200">
                  {previewDoc.fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close preview"
                className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[350px]">
              {previewDoc.mimeType.startsWith("image/") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.title}
                  className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-sm border border-slate-200 bg-white"
                />
              ) : previewDoc.mimeType === "application/pdf" ||
                previewDoc.fileName.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.title}
                  className="w-full h-[65vh] rounded-lg border border-slate-300 bg-white shadow-sm"
                />
              ) : (
                <div className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm max-h-[65vh] overflow-y-auto">
                  <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {previewDoc.dataUrl.startsWith("data:text")
                      ? decodeURIComponent(previewDoc.dataUrl.split(",")[1] || "")
                      : `[Binary or Formatted Document: ${previewDoc.fileName}]`}
                  </pre>
                </div>
              )}
            </div>

            {/* Preview Footer Actions */}
            <div className="border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  handleOpenBlobInNewTab(previewDoc.dataUrl, previewDoc.mimeType)
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                Open in New Tab
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.dataUrl}
                  download={previewDoc.fileName}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
