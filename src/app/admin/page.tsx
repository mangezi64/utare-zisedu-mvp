"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Users,
  Sparkles,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  KeyRound,
  RefreshCw,
  Search,
  Laptop,
  Wifi,
  Sun,
  Shield,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  Globe,
} from "lucide-react";
import { EmployerRegistration, InnovationHub, RemoteJob, ZimbabweanCity } from "@/types";
import { JobApplicationRecord, StoredCandidateRecord } from "@/lib/store";
import { useViewMode } from "@/lib/view-mode-context";
import ZimbabweCitySelect from "@/components/ZimbabweCitySelect";

export default function AdminConsolePage() {
  const { isAdmin, loginAsAdmin, setMode } = useViewMode();
  const [activeTab, setActiveTab] = useState<
    "hubs" | "jobs" | "candidates" | "employers" | "ai"
  >("jobs");

  // Data states
  const [hubs, setHubs] = useState<InnovationHub[]>([]);
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [candidates, setCandidates] = useState<StoredCandidateRecord[]>([]);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [employers, setEmployers] = useState<EmployerRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Hub Form Modal / Drawer
  const [showHubForm, setShowHubForm] = useState(false);
  const [hubForm, setHubForm] = useState({
    name: "",
    city: "Harare" as ZimbabweanCity,
    address: "",
    hasSolarBackup: true,
    internetProvider: "Starlink Business + Liquid Fiber Redundancy",
    avgSpeedMbps: 150,
    availableWorkstations: 25,
    laptopLoanAvailable: true,
    dailyPassUsd: 0,
    utarePartnerSubsidized: true,
    contactEmail: "",
    operatingHours: "08:00 - 18:00 (Mon - Sat)",
  });
  const [savingHub, setSavingHub] = useState(false);

  // Job Form Modal / Drawer
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    category: "Software & Automation",
    compensationUsdMonthly: "$1,000 – $1,600 / mo",
    supportedPaymentRails: "Deel, Payoneer, USD Wire (Nostro)",
    requiredSkills: "",
    minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
    isAsyncFriendly: true,
    description: "",
    applicationUrl: "",
    sourceUrl: "",
  });
  const [savingJob, setSavingJob] = useState(false);
  const [discoveringJobs, setDiscoveringJobs] = useState(false);
  const [jobFilter, setJobFilter] = useState<"all" | "pending_review" | "approved">("all");

  // AI status
  const [aiStatus, setAiStatus] = useState<{
    enabled: boolean;
    model: string;
    ok: boolean;
    latencyMs?: number;
    error?: string;
  }>({ enabled: false, model: "gemini-2.5-flash", ok: false });
  const [testingAi, setTestingAi] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [modelInput, setModelInput] = useState("gemini-2.5-flash");

  // Flash message
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  function notify(msg: string) {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 5000);
  }

  async function loadAllData() {
    setLoading(true);
    try {
      const adminHeaders = {
        "x-utare-role": "admin",
        "x-utare-email": "admin@utare.co.zw",
      };
      const [hubsRes, jobsRes, candRes, aiRes, empRes] = await Promise.all([
        fetch("/api/admin/hubs", { headers: adminHeaders }).then((r) => r.json()),
        fetch("/api/jobs?all=1&role=admin", { headers: adminHeaders }).then((r) => r.json()),
        fetch("/api/admin/candidates?role=admin", { headers: adminHeaders }).then((r) => r.json()),
        fetch("/api/ai/status").then((r) => r.json()),
        fetch("/api/employers?role=admin", { headers: adminHeaders }).then((r) => r.json()).catch(() => ({ employers: [] })),
      ]);

      if (hubsRes.hubs) setHubs(hubsRes.hubs);
      if (jobsRes.jobs) setJobs(jobsRes.jobs);
      if (jobsRes.applications) setApplications(jobsRes.applications);
      if (candRes.candidates) setCandidates(candRes.candidates);
      if (empRes && empRes.employers) setEmployers(empRes.employers);
      if (aiRes) {
        setAiStatus(aiRes);
        if (aiRes.model) setModelInput(aiRes.model);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Hub Actions
  async function handleCreateHub(e: React.FormEvent) {
    e.preventDefault();
    setSavingHub(true);
    try {
      const res = await fetch("/api/admin/hubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-utare-role": "admin",
          "x-utare-email": "admin@utare.co.zw",
        },
        body: JSON.stringify(hubForm),
      });
      const data = await res.json();
      if (data.hub) {
        setHubs([data.hub, ...hubs.filter((h) => h.id !== data.hub.id)]);
        setShowHubForm(false);
        setHubForm({
          name: "",
          city: "Harare",
          address: "",
          hasSolarBackup: true,
          internetProvider: "Starlink Business + Liquid Fiber Redundancy",
          avgSpeedMbps: 150,
          availableWorkstations: 25,
          laptopLoanAvailable: true,
          dailyPassUsd: 0,
          utarePartnerSubsidized: true,
          contactEmail: "",
          operatingHours: "08:00 - 18:00 (Mon - Sat)",
        });
        notify(data.message || `Partner Hub "${data.hub.name}" enlisted successfully.`);
      }
    } finally {
      setSavingHub(false);
    }
  }

  async function handleDeleteHub(id: string, name: string) {
    if (!confirm(`Are you sure you want to unlist ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/hubs?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-utare-role": "admin",
          "x-utare-email": "admin@utare.co.zw",
        },
      });
      if (res.ok) {
        setHubs(hubs.filter((h) => h.id !== id));
        notify(`Hub "${name}" unlisted.`);
      }
    } catch {}
  }

  // Job Actions
  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    setSavingJob(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-utare-role": "admin",
          "x-utare-email": "admin@utare.co.zw",
        },
        body: JSON.stringify(jobForm),
      });
      const data = await res.json();
      if (data.job) {
        setJobs([data.job, ...jobs.filter((j) => j.id !== data.job.id)]);
        setShowJobForm(false);
        setJobForm({
          title: "",
          company: "",
          category: "Software & Automation",
          compensationUsdMonthly: "$1,000 – $1,600 / mo",
          supportedPaymentRails: "Deel, Payoneer, USD Wire (Nostro)",
          requiredSkills: "",
          minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
          isAsyncFriendly: true,
          description: "",
          applicationUrl: "",
          sourceUrl: "",
        });
        notify(data.message || `Job "${data.job.title}" added and published.`);
      }
    } finally {
      setSavingJob(false);
    }
  }

  async function handleDiscoverJobs() {
    setDiscoveringJobs(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-utare-role": "admin",
          "x-utare-email": "admin@utare.co.zw",
        },
        body: JSON.stringify({ action: "discover" }),
      });
      const data = await res.json();
      if (data.discovered) {
        await loadAllData();
        notify(data.message || `Discovered ${data.count} new remote roles awaiting approval.`);
      }
    } finally {
      setDiscoveringJobs(false);
    }
  }

  async function handleUpdateJobStatus(jobId: string, status: "approved" | "pending_review" | "archived") {
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-utare-role": "admin",
          "x-utare-email": "admin@utare.co.zw",
        },
        body: JSON.stringify({ jobId, status }),
      });
      const data = await res.json();
      if (data.job) {
        setJobs(jobs.map((j) => (j.id === jobId ? data.job : j)));
        notify(`Job status updated to "${status}".`);
      }
    } catch {}
  }

  async function handleDeleteJob(id: string) {
    if (!confirm("Are you sure you want to remove this job listing?")) return;
    try {
      const res = await fetch(`/api/admin/jobs?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-utare-role": "admin",
          "x-utare-email": "admin@utare.co.zw",
        },
      });
      if (res.ok) {
        setJobs(jobs.filter((j) => j.id !== id));
        notify("Job listing removed.");
      }
    } catch {}
  }

  // AI Actions
  async function handleTestAi(e: React.FormEvent) {
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
      const data = await res.json();
      setAiStatus(data);
      if (data.ok) {
        notify(`Live Gemini AI connected successfully (${data.model} · ${data.latencyMs}ms).`);
      } else {
        notify(`AI Status Note: ${data.error || "Using built-in deterministic writer."}`);
      }
    } finally {
      setTestingAi(false);
    }
  }

  const filteredJobs = jobs.filter((j) => {
    if (jobFilter === "pending_review") return j.status === "pending_review";
    if (jobFilter === "approved") return j.status !== "pending_review" && j.status !== "archived";
    return true;
  });

  const pendingJobCount = jobs.filter((j) => j.status === "pending_review").length;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-sm">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Facilitator Access Required</h1>
        <p className="mt-2 text-sm text-slate-600">
          The Admin Console is reserved for evaluators, partners, and facilitators to approve jobs, enlist partner hubs, and review candidate cohorts.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/login?redirect=/admin"
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition inline-flex items-center justify-center gap-2"
          >
            Sign In with Facilitator Account
          </Link>
          <button
            type="button"
            onClick={loginAsAdmin}
            className="rounded-xl border border-amber-300 bg-white px-5 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 transition"
          >
            Quick Demo: Stewart Mangezi
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition inline-flex items-center justify-center"
          >
            Return to Public Website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner Notice */}
      {bannerNotice && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm flex items-center justify-between">
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

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-900">
            <Shield className="h-3.5 w-3.5 text-amber-700" />
            Utare ZISEDU AI — Facilitator & Admin Operations Console
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            Ecosystem Admin, Partner Hubs & Verified Jobs
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Enlist local innovation hubs, approve AI-discovered remote opportunities,
            manage intake candidates, and inspect AI model health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMode("user");
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            ← View as Candidate
          </button>
          <Link
            href="/jobs"
            className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
          >
            Open CV Studio
          </Link>
        </div>
      </div>

      {/* Key Metric Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Enlisted Hubs</span>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {hubs.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {hubs.filter((h) => h.hasSolarBackup).length} Solar Backup • {hubs.reduce((acc, h) => acc + h.availableWorkstations, 0)} Desks
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Verified Remote Jobs</span>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {jobs.filter((j) => j.status !== "archived").length}
          </div>
          <p className="text-xs text-amber-700 font-semibold mt-1">
            {pendingJobCount > 0 ? `${pendingJobCount} pending AI review` : "All jobs approved"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Intake Candidates</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {candidates.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {applications.length} submitted job applications
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>AI Model Status</span>
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">
            {aiStatus.enabled && aiStatus.ok ? (
              <span className="text-emerald-700 font-extrabold">
                Live Gemini 2.5
              </span>
            ) : (
              <span className="text-slate-700">Built-In Deterministic</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {aiStatus.enabled && aiStatus.ok
              ? `Model: ${aiStatus.model} (${aiStatus.latencyMs}ms)`
              : "Zero key required (Fallback active)"}
          </p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "jobs"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Remote Jobs & AI Discovery</span>
          {pendingJobCount > 0 && (
            <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
              {pendingJobCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hubs")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "hubs"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Partner Hub Enlistment ({hubs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("candidates")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "candidates"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Registered Candidates ({candidates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("employers")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "employers"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Employer Leads ({employers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "ai"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>AI Engine & Background Setup</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JOBS & AI JOB DISCOVERY */}
      {/* ========================================================================= */}
      {activeTab === "jobs" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Verified Remote Jobs Directory & Approval Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Manage roles visible to candidates. Approved jobs appear in the
                Remote Jobs & CV Studio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDiscoverJobs}
                disabled={discoveringJobs}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
              >
                <Sparkles className={`h-3.5 w-3.5 ${discoveringJobs ? "animate-spin" : ""}`} />
                {discoveringJobs ? "AI Searching Remote Feeds..." : "Run AI Job Discovery"}
              </button>

              <button
                type="button"
                onClick={() => setShowJobForm(!showJobForm)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Job Manually or via Link
              </button>
            </div>
          </div>

          {/* Job Filter Pills */}
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setJobFilter("all")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                jobFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => setJobFilter("pending_review")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                jobFilter === "pending_review"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              Pending Review ({pendingJobCount})
            </button>
            <button
              type="button"
              onClick={() => setJobFilter("approved")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                jobFilter === "approved"
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Published & Approved ({jobs.filter((j) => j.status !== "pending_review" && j.status !== "archived").length})
            </button>
          </div>

          {/* New Job Form Drawer */}
          {showJobForm && (
            <form
              onSubmit={handleCreateJob}
              className="rounded-2xl border-2 border-emerald-600/40 bg-white p-6 shadow-md space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Add New Remote Job (Manual or Link Ingestion)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Remote Python & Automation Associate"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hiring Company *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Data Labs"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={jobForm.category}
                    onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Compensation (Monthly USD)
                  </label>
                  <input
                    type="text"
                    value={jobForm.compensationUsdMonthly}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, compensationUsdMonthly: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application / Job Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={jobForm.applicationUrl}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        applicationUrl: e.target.value,
                        sourceUrl: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supported Payment Rails (comma separated)
                  </label>
                  <input
                    type="text"
                    value={jobForm.supportedPaymentRails}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, supportedPaymentRails: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Python, SQL, Fast Communication"
                    value={jobForm.requiredSkills}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, requiredSkills: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description & Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of responsibilities, timezone overlap, and why Zimbabwean talent fits this role..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingJob}
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {savingJob ? "Saving Job..." : "Publish Job to Platform"}
                </button>
              </div>
            </form>
          )}

          {/* Jobs Listing */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
                No jobs match the current filter.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isPending = job.status === "pending_review";
                return (
                  <div
                    key={job.id}
                    className={`rounded-2xl border p-5 shadow-xs transition bg-white ${
                      isPending
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {isPending && (
                            <span className="rounded-full bg-amber-200 text-amber-900 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
                              AI Discovered — Needs Approval
                            </span>
                          )}
                          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {job.category}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-700">
                            {job.compensationUsdMonthly}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">
                          {job.title} —{" "}
                          <span className="text-slate-600 font-semibold">
                            {job.company}
                          </span>
                        </h3>

                        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.supportedPaymentRails.map((rail) => (
                            <span
                              key={rail}
                              className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-800"
                            >
                              {rail}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateJobStatus(job.id, "approved")}
                              className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                            >
                              ✓ Approve & Publish
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateJobStatus(job.id, "archived")}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Archive
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Published
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete job"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {job.applicationUrl && job.applicationUrl.startsWith("http") && (
                          <a
                            href={job.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                          >
                            <span>Original Link</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PARTNER HUB ENLISTMENT */}
      {/* ========================================================================= */}
      {activeTab === "hubs" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Partner Innovation Hub Network Management
              </h2>
              <p className="text-xs text-slate-500">
                Enlist physical hubs across Zimbabwe providing verified solar power,
                Starlink broadband, and PC loan inventory.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHubForm(!showHubForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Enlist New Partner Hub
            </button>
          </div>

          {/* New Hub Form Drawer */}
          {showHubForm && (
            <form
              onSubmit={handleCreateHub}
              className="rounded-2xl border-2 border-emerald-600/40 bg-white p-6 shadow-md space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Enlist a New Partner Innovation Hub
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHubForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hub Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Masvingo Tech Foundry — Utare Hub"
                    value={hubForm.name}
                    onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <ZimbabweCitySelect
                    value={hubForm.city}
                    onChange={(city) =>
                      setHubForm({ ...hubForm, city })
                    }
                    label="City / Town / Growth Point in Zimbabwe *"
                    allowAbroad={false}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stand 45 Robert Mugabe Way, City Centre"
                  value={hubForm.address}
                  onChange={(e) => setHubForm({ ...hubForm, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internet Provider & Connectivity
                  </label>
                  <input
                    type="text"
                    value={hubForm.internetProvider}
                    onChange={(e) =>
                      setHubForm({ ...hubForm, internetProvider: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Avg Speed (Mbps)
                  </label>
                  <input
                    type="number"
                    value={hubForm.avgSpeedMbps}
                    onChange={(e) =>
                      setHubForm({ ...hubForm, avgSpeedMbps: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Workstations
                  </label>
                  <input
                    type="number"
                    value={hubForm.availableWorkstations}
                    onChange={(e) =>
                      setHubForm({
                        ...hubForm,
                        availableWorkstations: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={hubForm.hasSolarBackup}
                      onChange={(e) =>
                        setHubForm({ ...hubForm, hasSolarBackup: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>100% Solar Power Inverter Backup Guarantee</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={hubForm.laptopLoanAvailable}
                      onChange={(e) =>
                        setHubForm({ ...hubForm, laptopLoanAvailable: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>Laptop / PC Hardware Loan Pool on Site</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={hubForm.operatingHours}
                    onChange={(e) =>
                      setHubForm({ ...hubForm, operatingHours: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHubForm(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingHub}
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {savingHub ? "Enlisting Hub..." : "Save & Enlist Hub"}
                </button>
              </div>
            </form>
          )}

          {/* Hubs Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {hub.city}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {hub.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteHub(hub.id, hub.name)}
                    className="text-slate-300 hover:text-rose-600 p-1"
                    title="Unlist hub"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">{hub.address}</p>

                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-600" />
                    <span>
                      {hub.hasSolarBackup
                        ? "100% Solar Backup Inverter"
                        : "Grid Power Only"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      {hub.internetProvider} ({hub.avgSpeedMbps} Mbps)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5 text-purple-600" />
                    <span>
                      {hub.availableWorkstations} Desks •{" "}
                      {hub.laptopLoanAvailable ? "PC Loans Available" : "Bring Own Device"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{hub.operatingHours}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-800">
                    {hub.dailyPassUsd === 0
                      ? "100% Utare Subsidized (Free)"
                      : `$${hub.dailyPassUsd} / day`}
                  </span>
                  <Link
                    href={`/hubs?city=${hub.city}`}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    View in Directory →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REGISTERED CANDIDATES */}
      {/* ========================================================================= */}
      {activeTab === "candidates" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Registered Candidates & Intake Cohort
              </h2>
              <p className="text-xs text-slate-500">
                View all candidate profiles, assessment diagnostic scores, hardware deficits,
                and matched coaching pathways.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {candidates.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
                No candidate intakes recorded yet. Candidates can complete the{" "}
                <Link href="/assessment" className="text-emerald-700 underline font-semibold">
                  Intake Diagnostic
                </Link>{" "}
                to register.
              </div>
            ) : (
              candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-xs font-bold">
                          {cand.profile.city}
                        </span>
                        <span className="rounded bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-0.5 text-xs font-semibold">
                          {cand.assessment?.readinessTier || "Bridge-Ready"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Registered: {new Date(cand.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {cand.profile.fullName} —{" "}
                        <span className="text-slate-600 font-normal">
                          {cand.profile.highestQualification} in {cand.profile.fieldOfStudy}
                        </span>
                      </h3>

                      <p className="text-xs text-slate-500">
                        Email: {cand.profile.email} • Phone: {cand.profile.phone} • Status:{" "}
                        <strong>{cand.profile.employmentStatus}</strong> • Goal:{" "}
                        <strong>{cand.profile.primaryGoal}</strong>
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs">
                      <span className="font-semibold text-slate-700">
                        Hardware Index: {cand.assessment?.infrastructureIndexScore ?? 60}/100
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        Overall Score: {cand.assessment?.overallScore ?? 75}/100
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Device: {cand.profile.primaryDevice}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Internet: {cand.profile.internetAccessType}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Power: {cand.profile.powerReliabilityHours} hrs/day
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href="/pathway"
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        View AI Pathway →
                      </Link>
                    </div>
                  </div>

                  {applications.filter(
                    (a) =>
                      a.candidateId === cand.id ||
                      a.candidateName.toLowerCase() ===
                        cand.profile.fullName.toLowerCase()
                  ).length > 0 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                        Submitted Applications (
                        {
                          applications.filter(
                            (a) =>
                              a.candidateId === cand.id ||
                              a.candidateName.toLowerCase() ===
                                cand.profile.fullName.toLowerCase()
                          ).length
                        }
                        ):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {applications
                          .filter(
                            (a) =>
                              a.candidateId === cand.id ||
                              a.candidateName.toLowerCase() ===
                                cand.profile.fullName.toLowerCase()
                          )
                          .map((app) => (
                            <span
                              key={app.id}
                              className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 shadow-xs"
                            >
                              <strong>{app.jobTitle}</strong> at {app.company}{" "}
                              <span className="text-slate-400">
                                ({new Date(app.appliedAt).toLocaleDateString()})
                              </span>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EMPLOYER LEADS */}
      {/* ========================================================================= */}
      {activeTab === "employers" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Employer Hiring Inquiries & Leads ({employers.length})
              </h2>
              <p className="text-xs text-slate-500">
                Companies seeking to hire verified, remote-ready Zimbabwean graduates.
              </p>
            </div>
            <Link
              href="/employers"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
            >
              <span>Open Employer Registration Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {employers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
                No employer hiring registrations recorded yet. Inquiries submitted on the{" "}
                <Link href="/employers" className="text-emerald-700 underline font-semibold">
                  For Employers
                </Link>{" "}
                page will appear here in real time.
              </div>
            ) : (
              employers.map((emp) => (
                <div
                  key={emp.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-xs font-bold">
                          {emp.industry}
                        </span>
                        <span className="rounded bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-0.5 text-xs font-semibold">
                          {emp.hiringModel}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(emp.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {emp.companyName} —{" "}
                        <span className="text-slate-600 font-medium">{emp.contactPerson}</span>
                      </h3>

                      <p className="text-xs text-slate-600">
                        Email: <strong>{emp.email}</strong>
                        {emp.website && ` • Website: ${emp.website}`} • Seeking:{" "}
                        <strong>{emp.estimatedHires} hires</strong>
                      </p>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {emp.timezoneOverlapNeeded}
                    </span>
                  </div>

                  {emp.rolesInterested && emp.rolesInterested.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs border-t border-slate-100 pt-3">
                      <span className="font-semibold text-slate-700">Roles Interested:</span>
                      {emp.rolesInterested.map((r) => (
                        <span key={r} className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 text-[11px]">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {emp.additionalNotes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      &quot;{emp.additionalNotes}&quot;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AI ENGINE & BACKGROUND SETUP */}
      {/* ========================================================================= */}
      {activeTab === "ai" && (
        <section className="space-y-6">
          <div className="rounded-2xl border-2 border-emerald-600/30 bg-white p-6 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                Live Google Gemini AI Engine Configuration
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Background API Key & Live Model Connection
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Configure your Google Gemini API key once in the background. Once set,
                all candidate career pathways, skill translation diagnostics, and ATS CV
                optimizations run seamlessly through live Gemini 2.5.
              </p>
            </div>

            {/* Background Setup Guide */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900 text-sm">
                How to set up your Gemini API Key in the background:
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>
                  Open your local environment file:{" "}
                  <code className="bg-white border rounded px-1.5 py-0.5 text-slate-900">
                    .env.local
                  </code>
                </li>
                <li>
                  Add or edit your key:{" "}
                  <code className="bg-white border rounded px-1.5 py-0.5 text-slate-900">
                    GEMINI_API_KEY=&quot;AIzaSy...&quot;
                  </code>
                </li>
                <li>
                  Save the file. Next.js picks it up automatically!
                </li>
              </ol>
            </div>

            {/* Quick Runtime Key Form */}
            <form onSubmit={handleTestAi} className="space-y-4 border-t border-slate-100 pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Gemini API Key (`GEMINI_API_KEY`)
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy... (persisted to .env.local)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model Selection (`GEMINI_MODEL`)
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

              <div className="flex items-center justify-between pt-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    aiStatus.enabled && aiStatus.ok
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {aiStatus.enabled && aiStatus.ok
                    ? `✓ Live Connected (${aiStatus.model}${
                        aiStatus.latencyMs ? ` · ${aiStatus.latencyMs}ms` : ""
                      })`
                    : "Deterministic Fallback Engine Active"}
                </span>

                <button
                  type="submit"
                  disabled={testingAi}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingAi ? "animate-spin" : ""}`} />
                  {testingAi ? "Testing Connection..." : "Save & Test Live Gemini Key"}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
