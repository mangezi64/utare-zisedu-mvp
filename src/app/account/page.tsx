"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { CandidateProfile, ZimbabweanCity } from "@/types";
import { JobApplicationRecord, StoredCandidateRecord } from "@/lib/store";
import { useViewMode } from "@/lib/view-mode-context";

const ZIMBABWE_CITIES: ZimbabweanCity[] = [
  "Harare",
  "Bulawayo",
  "Mutare",
  "Gweru",
  "Masvingo",
  "Chinhoyi",
  "Bindura",
  "Marondera",
  "Kwekwe",
  "Victoria Falls",
  "Zvishavane",
  "Growth Point / Rural District",
  "Other",
];

const DEFAULT_PROFILE: CandidateProfile = {
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
  currentSkills: ["Statistical Analysis", "Academic Research", "Excel", "Report Writing"],
};

export default function CandidateAccountPage() {
  const { user, isAuthenticated, loginAsCandidate } = useViewMode();
  const [candidate, setCandidate] = useState<StoredCandidateRecord | null>(null);
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.applications) {
          if (user?.email) {
            const userApps = data.applications.filter(
              (a: JobApplicationRecord) =>
                (user.name && a.candidateName.toLowerCase() === user.name.toLowerCase()) ||
                (user.id && a.candidateId === user.id)
            );
            setApplications(userApps);
          } else {
            setApplications([]);
          }
        }
      })
      .catch(() => {});
  }, [user, isAuthenticated]);

  if (!isAuthenticated) {
    return (
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
          <button
            onClick={() => {
              loginAsCandidate({
                name: "Tatenda Moyo",
                email: "tatenda.moyo@example.co.zw",
                qualification: "Bachelors Degree",
                city: "Harare",
                fieldOfStudy: "BSc Computer Science",
              });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Quick Demo: Tatenda Moyo
          </button>
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

  const assignedHub = candidate?.pathway.recommendedHub;
  const assignedCoach = candidate?.pathway.assignedCoach;
  const milestones = candidate?.pathway.upskillingMilestones || [];
  const completedMilestones = candidate?.completedMilestones || [];

  return (
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white font-extrabold text-2xl shadow-sm">
            {profile.fullName.charAt(0)}
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
        </div>
      </div>

      {/* Main Grid: Left is Profile & Info, Right is Pathway, Hub & Applications */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column (5 cols): Profile Info / Edit Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <select
                      value={profile.city}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          city: e.target.value as ZimbabweanCity,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    >
                      {ZIMBABWE_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
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
                    <span className="text-slate-400 block text-[11px]">Employment:</span>
                    <span className="font-semibold text-slate-800">
                      {profile.employmentStatus}
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
        </div>

        {/* Right Column (7 cols): Hub Assignment, Milestone Progress & Job Applications */}
        <div className="lg:col-span-7 space-y-6">
          {/* Matched Hub Card */}
          {assignedHub && (
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
          )}

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

          {/* Job Applications Submitted */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
                    className="rounded-xl border border-slate-200 p-4 text-xs space-y-2 bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {app.jobTitle}
                        </span>
                        <div className="text-slate-600">{app.company}</div>
                      </div>
                      <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[11px] font-bold">
                        Submitted
                      </span>
                    </div>

                    <p className="text-slate-600 line-clamp-2 italic bg-white p-2 rounded border border-slate-100">
                      &quot;{app.tailoredResumePitch}&quot;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      <span className="text-emerald-700 font-semibold">
                        Grounded CV Attached
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
