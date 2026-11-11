"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PRESET_PERSONAS, SEED_REMOTE_JOBS } from "@/lib/mock-data";
import { useViewMode } from "@/lib/view-mode-context";
import {
  CandidateProfile,
  CvSourceDetails,
  GeneratedCoverLetter,
  GeneratedCv,
  RemoteJob,
  StyleReport,
} from "@/types";
import { JobApplicationRecord, StoredCandidateRecord } from "@/lib/store";
import { buildDefaultCvDetails } from "@/lib/documents/sample-cv-details";
import {
  Globe,
  CheckCircle2,
  FileText,
  Sparkles,
  Send,
  Download,
  Copy,
  Printer,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from "lucide-react";

const FALLBACK_CANDIDATE_PROFILE: CandidateProfile = {
  fullName: "Chipo Nyamande",
  email: "chipo.nyamande@example.co.zw",
  phone: "+263 77 210 9876",
  city: "Harare",
  highestQualification: "Bachelors Degree",
  fieldOfStudy: "BSc Honours in Economics & Statistics",
  yearsExperience: 1,
  employmentStatus: "Unemployed",
  monthlyIncomeBracket: "$0 (Zero Income)",
  hasDedicatedLaptop: false,
  primaryDevice: "Smartphone Only",
  internetAccessType: "Mobile Data Bundles Only",
  powerReliabilityHours: 5,
  hasGlobalPaymentRail: false,
  primaryGoal: "International Remote Work",
  currentSkills: [
    "Statistical Analysis",
    "Academic Research",
    "Excel",
    "Report Writing",
  ],
};

export default function RemoteJobsPage() {
  const { user, isAuthenticated, isAdmin } = useViewMode();
  const [jobs, setJobs] = useState<RemoteJob[]>(SEED_REMOTE_JOBS);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [activeCandidate, setActiveCandidate] =
    useState<StoredCandidateRecord | null>(null);
  const [selectedRail, setSelectedRail] = useState<string>("All");

  // AI Model Status & Live Key Switcher
  const [aiStatus, setAiStatus] = useState<{
    enabled: boolean;
    model: string;
    ok: boolean;
    latencyMs?: number;
    error?: string;
  }>({ enabled: false, model: "gemini-2.5-flash", ok: false });
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [modelInput, setModelInput] = useState("gemini-2.5-flash");
  const [testingAi, setTestingAi] = useState(false);

  // CV & Cover Letter Studio State
  const [activeJob, setActiveJob] = useState<RemoteJob | null>(null);
  const [studioTab, setStudioTab] = useState<"cv" | "letter" | "facts">("cv");
  const [cvDetails, setCvDetails] = useState<CvSourceDetails>(() =>
    buildDefaultCvDetails(FALLBACK_CANDIDATE_PROFILE)
  );
  const [generatedDocs, setGeneratedDocs] = useState<{
    cv: GeneratedCv;
    coverLetter: GeneratedCoverLetter;
    cvPlain: string;
    letterPlain: string;
    styleReport: { cv: StyleReport; coverLetter: StyleReport };
  } | null>(null);
  const [generatingDocs, setGeneratingDocs] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState<string | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs);
        if (data.applications) setApplications(data.applications);
        if (data.activeCandidate) {
          setActiveCandidate(data.activeCandidate);
          setCvDetails(buildDefaultCvDetails(data.activeCandidate.profile));
        }
      })
      .catch(() => {});

    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((st) => {
        setAiStatus(st);
        if (st.model) setModelInput(st.model);
      })
      .catch(() => {});
  }, []);

  const currentProfile: CandidateProfile =
    activeCandidate?.profile || FALLBACK_CANDIDATE_PROFILE;
  const currentHubName: string =
    activeCandidate?.pathway.recommendedHub.name ||
    "Impact Hub Harare — Utare Node";

  async function handleOpenStudio(job: RemoteJob) {
    setActiveJob(job);
    setStudioTab("cv");
    await generateStudioDocuments(job, cvDetails);
  }

  async function generateStudioDocuments(
    job: RemoteJob,
    details: CvSourceDetails
  ) {
    setGeneratingDocs(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "json",
          profile: currentProfile,
          details,
          hubName: currentHubName,
          target: {
            title: job.title,
            company: job.company,
            description: job.description,
            requiredSkills: job.requiredSkills,
          },
        }),
      });
      const data = await res.json();
      if (data.cv && data.coverLetter) {
        setGeneratedDocs(data);
      }
    } finally {
      setGeneratingDocs(false);
    }
  }

  async function handleSaveAiConfig(e: React.FormEvent) {
    e.preventDefault();
    setTestingAi(true);
    try {
      const res = await fetch("/api/ai/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput,
          model: modelInput,
        }),
      });
      const st = await res.json();
      setAiStatus(st);
      if (st.ok && activeJob) {
        await generateStudioDocuments(activeJob, cvDetails);
      }
    } finally {
      setTestingAi(false);
    }
  }

  async function handleDownloadDocx(kind: "cv-docx" | "letter-docx") {
    if (!generatedDocs) return;
    setDownloadingDocx(kind);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: kind,
          cv: generatedDocs.cv,
          coverLetter: generatedDocs.coverLetter,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = currentProfile.fullName.replace(/[^a-zA-Z0-9]+/g, "_");
      a.download =
        kind === "cv-docx"
          ? `${safeName}_CV.docx`
          : `${safeName}_Application_Letter.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingDocx(null);
    }
  }

  function handleCopyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  }

  async function handleSubmitApplication() {
    if (!activeJob || !generatedDocs) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: activeJob.id,
          tailoredResumePitch: generatedDocs.cv.summary,
          candidateId: user?.id || activeCandidate?.id,
        }),
      });
      const data = await res.json();
      if (data.application) {
        setApplications([data.application, ...applications]);
        setActiveJob(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const rails = ["All", "Deel", "Payoneer", "Wise", "USD Wire (Nostro)"];
  const filteredJobs =
    selectedRail === "All"
      ? jobs
      : jobs.filter((job) =>
          job.supportedPaymentRails.some((r) =>
            r.toLowerCase().includes(selectedRail.toLowerCase())
          )
        );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
            {isAdmin
              ? "Facilitator Console — Verified Remote Jobs & Model Diagnostics"
              : "Verified Remote Jobs & Tailored Application Studio"}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isAdmin
              ? "Verified Remote Jobs & AI Studio (Admin Console)"
              : "Verified Remote Jobs, ATS CV & Application Studio"}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Generate structured, ATS-friendly CVs and natural-sounding
            application letters grounded strictly in candidate facts—with zero
            AI clichés and instant <strong>Word (.docx)</strong> &{" "}
            <strong>PDF</strong> export.
          </p>

          {isAuthenticated && user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 mt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Signed in as <strong>{user.name}</strong> ({user.email}). Generated CVs and applications are recorded under your candidate account.</span>
              </div>
              <Link href="/account" className="font-bold underline text-emerald-800 hover:text-emerald-900 shrink-0">
                My Workspace →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs text-slate-700 mt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Browsing studio as visitor. Sign in or create an account to save tailored CVs and track your applications.</span>
              </div>
              <Link href="/login" className="font-bold text-emerald-700 hover:underline shrink-0">
                Sign In / Register →
              </Link>
            </div>
          )}
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setShowAiConfig(!showAiConfig)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
              aiStatus.enabled && aiStatus.ok
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <KeyRound className="h-4 w-4 text-emerald-700" />
            {aiStatus.enabled && aiStatus.ok
              ? `Live Model Active: ${aiStatus.model}`
              : "Configure Live Gemini AI Model"}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-xs font-semibold text-emerald-900 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-700" />
            <div>
              <div className="font-bold">AI Career Engine Active</div>
              <div className="text-[10px] text-emerald-700 font-normal">
                Anti-AI-Slop Verified • Grounded ATS Resume
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live AI Model Configuration Drawer (Admin Console Only) */}
      {isAdmin && showAiConfig && (
        <form
          onSubmit={handleSaveAiConfig}
          className="no-print rounded-2xl border-2 border-emerald-600/30 bg-white p-6 shadow-md space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live Gemini Model Connection & Runtime Test
              </h2>
              <p className="text-xs text-slate-500">
                Paste a Google AI Studio key (`GEMINI_API_KEY`) to switch from
                the built-in deterministic writer to live Gemini generation, or
                leave blank to use the built-in writer.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                aiStatus.enabled && aiStatus.ok
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {aiStatus.enabled && aiStatus.ok
                ? `✓ Connected (${aiStatus.model}${
                    aiStatus.latencyMs ? ` · ${aiStatus.latencyMs}ms` : ""
                  })`
                : "Using Built-In Deterministic Writer"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Gemini API Key (`GEMINI_API_KEY`)
              </label>
              <input
                type="password"
                placeholder="AIzaSy... (stored locally in .env.local)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Name (`GEMINI_MODEL`)
              </label>
              <select
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              </select>
            </div>
          </div>

          {aiStatus.error && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Status note: {aiStatus.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={testingAi}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testingAi ? "animate-spin" : ""}`} />
              {testingAi ? "Testing Live Connection..." : "Save & Test Live Model"}
            </button>
          </div>
        </form>
      )}

      {/* Admin Demographic Archetype Switcher (Admin Console Only) */}
      {isAdmin && (
        <div className="no-print rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>🛠️ Facilitator Console: Switch Candidate Archetype (Demo Mode)</span>
            <span className="text-[11px] font-normal text-amber-800">
              Hidden from candidate view
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_PERSONAS.map((p) => {
              const isSelected = currentProfile.fullName === p.profile.fullName;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    const newRec: StoredCandidateRecord = {
                      id: `cand-${p.profile.fullName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
                      profile: p.profile,
                      assessment: {} as any,
                      pathway: {
                        recommendedHub: {
                          name:
                            p.profile.city === "Bulawayo"
                              ? "Bulawayo Digital Innovation & Remote Lab"
                              : p.profile.city === "Mutare"
                              ? "Manicaland Tech & Enterprise Hub"
                              : p.profile.city === "Masvingo"
                              ? "Great Zimbabwe Tech Lab"
                              : "Impact Hub Harare — Utare Node",
                        },
                      } as any,
                      completedMilestones: [],
                      coachingStatus: "Pending Booking",
                      createdAt: new Date().toISOString(),
                    };
                    setActiveCandidate(newRec);
                    const newDetails = buildDefaultCvDetails(p.profile);
                    setCvDetails(newDetails);
                    if (activeJob) {
                      generateStudioDocuments(activeJob, newDetails);
                    }
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-700 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {p.profile.fullName} ({p.profile.fieldOfStudy.split(" ")[0]})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Candidate Context Banner */}
      {isAdmin ? (
        <div className="no-print rounded-2xl border border-amber-300 bg-amber-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-amber-900">
              Facilitator Preview Candidate:{" "}
            </span>
            <span>
              <strong>{currentProfile.fullName}</strong> (
              {currentProfile.highestQualification} in{" "}
              {currentProfile.fieldOfStudy} • {currentProfile.city}) • Hub:{" "}
              {currentHubName}
            </span>
          </div>
          <span className="font-bold text-amber-800">
            Applications Submitted: {applications.length}
          </span>
        </div>
      ) : (
        <div className="no-print rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-sm">
              {currentProfile.fullName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {currentProfile.fullName}
              </div>
              <div className="text-slate-600">
                {currentProfile.highestQualification} in {currentProfile.fieldOfStudy} • {currentProfile.city} • Verified Hub:{" "}
                <strong className="text-slate-800">{currentHubName}</strong>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white border border-emerald-200 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
              Applications Submitted: {applications.length}
            </span>
          </div>
        </div>
      )}

      {/* CV & Application Letter Studio Drawer */}
      {activeJob && (
        <section className="rounded-3xl border-2 border-emerald-600 bg-white p-6 sm:p-8 shadow-xl space-y-6">
          <div className="no-print flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Humanized CV & Application Letter Studio •{" "}
                {generatedDocs?.cv.generatedBy === "gemini-live"
                  ? `Live Gemini (${aiStatus.model})`
                  : "Utare Grounded Writer"}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Target Role: {activeJob.title} — {activeJob.company}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {generatedDocs && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Human Tone Score: CV {generatedDocs.styleReport.cv.score}/100 · Letter{" "}
                    {generatedDocs.styleReport.coverLetter.score}/100
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={() => setActiveJob(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close Studio ✕
              </button>
            </div>
          </div>

          {/* Studio Tabs + Download Toolbar */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStudioTab("cv")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  studioTab === "cv"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                1. Structured ATS CV
              </button>
              <button
                type="button"
                onClick={() => setStudioTab("letter")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  studioTab === "letter"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                2. Application (Cover) Letter
              </button>
              <button
                type="button"
                onClick={() => setStudioTab("facts")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  studioTab === "facts"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                3. Edit Candidate Work & Education Facts
              </button>
            </div>

            {generatedDocs && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={downloadingDocx !== null}
                  onClick={() => handleDownloadDocx("cv-docx")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadingDocx === "cv-docx"
                    ? "Building Word..."
                    : "Download CV (.docx)"}
                </button>
                <button
                  type="button"
                  disabled={downloadingDocx !== null}
                  onClick={() => handleDownloadDocx("letter-docx")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadingDocx === "letter-docx"
                    ? "Building Word..."
                    : "Download Letter (.docx)"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      studioTab === "letter"
                        ? generatedDocs.letterPlain
                        : generatedDocs.cvPlain,
                      studioTab === "letter" ? "Letter" : "CV"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedLabel ? `Copied ${copiedLabel}!` : "Copy Plain Text"}
                </button>
              </div>
            )}
          </div>

          {generatingDocs ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Tailoring structured CV & humanized application letter for{" "}
              <strong>{activeJob.title}</strong>...
            </div>
          ) : (
            generatedDocs && (
              <>
                {/* TAB 1: STRUCTURED ATS CV PREVIEW */}
                {studioTab === "cv" && (
                  <div className="print-sheet mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-6 text-slate-900">
                    <div className="border-b-2 border-emerald-800 pb-4">
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {generatedDocs.cv.fullName}
                      </h3>
                      <p className="text-sm font-semibold text-emerald-800 mt-0.5">
                        {generatedDocs.cv.headline}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {generatedDocs.cv.contactLine}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Profile
                      </h4>
                      <p className="text-sm text-slate-800 leading-relaxed">
                        {generatedDocs.cv.summary}
                      </p>
                    </div>

                    {generatedDocs.cv.coreSkills.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                          Core Skills
                        </h4>
                        <p className="text-xs font-medium text-slate-800">
                          {generatedDocs.cv.coreSkills.join("  ·  ")}
                        </p>
                      </div>
                    )}

                    {generatedDocs.cv.experience.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                          Experience
                        </h4>
                        {generatedDocs.cv.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {exp.role}{" "}
                                <span className="font-normal text-slate-600">
                                  | {exp.organization}
                                  {exp.location ? `, ${exp.location}` : ""}
                                </span>
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {exp.dates}
                              </span>
                            </div>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 leading-relaxed">
                              {exp.bullets.map((b, bi) => (
                                <li key={bi}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {generatedDocs.cv.projects.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                          Projects
                        </h4>
                        {generatedDocs.cv.projects.map((proj, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="text-sm font-bold text-slate-900">
                              {proj.name}
                            </div>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                              {proj.bullets.map((b, bi) => (
                                <li key={bi}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {generatedDocs.cv.education.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                          Education
                        </h4>
                        {generatedDocs.cv.education.map((ed, idx) => (
                          <div key={idx}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {ed.qualification}{" "}
                                <span className="font-normal text-slate-600">
                                  | {ed.institution}
                                </span>
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {ed.year}
                              </span>
                            </div>
                            {ed.details && (
                              <p className="text-xs text-slate-600 mt-0.5">
                                {ed.details}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100 text-xs">
                      {generatedDocs.cv.certifications.length > 0 && (
                        <div>
                          <span className="font-bold uppercase text-emerald-800">
                            Certifications:{" "}
                          </span>
                          <span className="text-slate-700">
                            {generatedDocs.cv.certifications.join(" · ")}
                          </span>
                        </div>
                      )}
                      {generatedDocs.cv.languages.length > 0 && (
                        <div>
                          <span className="font-bold uppercase text-emerald-800">
                            Languages:{" "}
                          </span>
                          <span className="text-slate-700">
                            {generatedDocs.cv.languages.join(" · ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: HUMANIZED APPLICATION LETTER PREVIEW */}
                {studioTab === "letter" && (
                  <div className="print-sheet mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5 text-slate-900">
                    <div className="border-b border-slate-200 pb-4">
                      <div className="text-lg font-bold text-slate-900">
                        {generatedDocs.coverLetter.fullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {generatedDocs.coverLetter.contactLine}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      {generatedDocs.coverLetter.date}
                    </div>

                    <div className="text-xs text-slate-700 whitespace-pre-line">
                      {generatedDocs.coverLetter.recipient}
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      {generatedDocs.coverLetter.subject}
                    </div>

                    <div className="text-sm text-slate-800">
                      {generatedDocs.coverLetter.greeting}
                    </div>

                    <div className="space-y-4 text-sm text-slate-800 leading-relaxed">
                      {generatedDocs.coverLetter.paragraphs.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>

                    <div className="pt-2 space-y-1 text-sm text-slate-900">
                      <div>{generatedDocs.coverLetter.signOff}</div>
                      <div className="font-bold">
                        {generatedDocs.coverLetter.fullName}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: EDITABLE CANDIDATE FACTS */}
                {studioTab === "facts" && (
                  <div className="no-print rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                    <p className="text-xs text-slate-600">
                      Edit your work history or education notes below and click{" "}
                      <strong>Regenerate CV & Letter</strong>. The writer uses
                      only these facts and never invents employers or dates.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Professional Headline
                        </label>
                        <input
                          type="text"
                          value={cvDetails.headline || ""}
                          onChange={(e) =>
                            setCvDetails({
                              ...cvDetails,
                              headline: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          LinkedIn / GitHub / Portfolio Link
                        </label>
                        <input
                          type="text"
                          value={cvDetails.linkedinOrPortfolio || ""}
                          onChange={(e) =>
                            setCvDetails({
                              ...cvDetails,
                              linkedinOrPortfolio: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {cvDetails.workHistory[0] && (
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-bold text-slate-800">
                          Most Recent Role & Raw Notes (Converted into CV Bullets)
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <input
                            type="text"
                            placeholder="Role Title"
                            value={cvDetails.workHistory[0].role}
                            onChange={(e) => {
                              const next = [...cvDetails.workHistory];
                              next[0] = { ...next[0], role: e.target.value };
                              setCvDetails({ ...cvDetails, workHistory: next });
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Organisation"
                            value={cvDetails.workHistory[0].organization}
                            onChange={(e) => {
                              const next = [...cvDetails.workHistory];
                              next[0] = {
                                ...next[0],
                                organization: e.target.value,
                              };
                              setCvDetails({ ...cvDetails, workHistory: next });
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Dates (e.g. Jan 2024 - Present)"
                            value={cvDetails.workHistory[0].startDate}
                            onChange={(e) => {
                              const next = [...cvDetails.workHistory];
                              next[0] = {
                                ...next[0],
                                startDate: e.target.value,
                              };
                              setCvDetails({ ...cvDetails, workHistory: next });
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                          />
                        </div>
                        <textarea
                          rows={3}
                          value={cvDetails.workHistory[0].notes}
                          onChange={(e) => {
                            const next = [...cvDetails.workHistory];
                            next[0] = { ...next[0], notes: e.target.value };
                            setCvDetails({ ...cvDetails, workHistory: next });
                          }}
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setStudioTab("cv");
                        generateStudioDocuments(activeJob, cvDetails);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate CV & Application Letter from Updated Facts
                    </button>
                  </div>
                )}

                {/* Submit Application Footer */}
                <div className="no-print flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
                  <div className="text-xs text-slate-600">
                    <strong>Anti-Slop Audit:</strong>{" "}
                    {generatedDocs.styleReport.coverLetter.notes.join(" ")} (Avg
                    sentence: {generatedDocs.styleReport.coverLetter.avgSentenceLength}{" "}
                    words)
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitApplication}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Send className="h-4 w-4" />
                    {submitting
                      ? "Submitting Application..."
                      : `Mark Applied to ${activeJob.company}`}
                  </button>
                </div>
              </>
            )
          )}
        </section>
      )}

      {/* Payment Rail Filter */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 mr-1">
          Filter by Supported Payment Rail:
        </span>
        {rails.map((rail) => (
          <button
            key={rail}
            type="button"
            onClick={() => setSelectedRail(rail)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              selectedRail === rail
                ? "bg-emerald-700 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {rail}
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="no-print grid gap-6 lg:grid-cols-2">
        {filteredJobs.map((job) => {
          const alreadyApplied = applications.some((a) => a.jobId === job.id);

          return (
            <div
              key={job.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-emerald-700">
                      {job.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {job.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {job.company}
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-800">
                    {job.compensationUsdMonthly}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-semibold">Payout Rails:</span>
                    <span>{job.supportedPaymentRails.join(", ")}</span>
                  </div>
                  {job.isAsyncFriendly && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                      100% Async Friendly
                    </span>
                  )}
                </div>

                {alreadyApplied ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Application Submitted
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenStudio(job)}
                      className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View CV & Letter
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenStudio(job)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Generate Structured CV & Application Letter (.docx / PDF)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
