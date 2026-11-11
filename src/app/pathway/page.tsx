"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoredCandidateRecord } from "@/lib/store";
import { useViewMode } from "@/lib/view-mode-context";
import {
  CheckCircle2,
  Circle,
  UserCheck,
  Building2,
  Calendar,
  FileText,
  ArrowRight,
  Sparkles,
  Laptop,
  User,
  Globe,
} from "lucide-react";

export default function PathwayStudioPage() {
  const { user, isAuthenticated, loginAsCandidate } = useViewMode();
  const [record, setRecord] = useState<StoredCandidateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const url = user?.email
      ? `/api/pathway?email=${encodeURIComponent(user.email)}`
      : "/api/pathway";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.activeCandidate) {
          setRecord(data.activeCandidate);
        } else {
          setRecord(null);
        }
      })
      .finally(() => setLoading(false));
  }, [user, isAuthenticated]);

  async function handleToggleMilestone(phase: string) {
    if (!record) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/pathway", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: record.id,
          toggleMilestonePhase: phase,
        }),
      });
      const data = await res.json();
      if (data.record) setRecord(data.record);
    } finally {
      setUpdating(false);
    }
  }

  async function handleConfirmCoaching() {
    if (!record) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/pathway", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: record.id,
          confirmCoaching: true,
          coachingPreferredDate: "Upcoming Tuesday • 10:00 CAT (GMT+2)",
        }),
      });
      const data = await res.json();
      if (data.record) setRecord(data.record);
    } finally {
      setUpdating(false);
    }
  }

  async function handleBookHubPass() {
    if (!record) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/pathway", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: record.id,
          bookHubId: record.pathway.recommendedHub.id,
        }),
      });
      const data = await res.json();
      if (data.record) setRecord(data.record);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">
        Loading active candidate AI pathway & coaching state...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign In to Access Your AI Pathway</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your personalized career pathway, paired industry coach, and partner hub reservations are tied to your candidate account. Sign in to view your milestones or take the diagnostic assessment to create one.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/login?redirect=/pathway"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            Candidate Sign In / Register
          </Link>
          <button
            onClick={() => {
              loginAsCandidate({
                name: "Tatenda Moyo",
                email: "demo@utaresizedu.ai",
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
            href="/assessment"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            ← Or take the 6-Factor Skills Diagnostic first
          </Link>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          No Active Candidate Pathway Yet
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Complete the 60-second Candidate Intake & Readiness Diagnostic first
          so our Gemini AI engine can generate your personalized upskilling
          roadmap, match your nearest Partner Innovation Hub, and pair your
          Human Coach.
        </p>
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
        >
          Go to Step 1: Candidate Intake & Diagnostic{" "}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const totalMilestones = record.pathway.upskillingMilestones.length;
  const completedCount = record.completedMilestones.length;
  const progressPct = Math.round((completedCount / totalMilestones) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Candidate Header Banner */}
      <div className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Active Candidate Workspace • {record.profile.fullName} (
              {record.profile.city})
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
              {record.pathway.recommendedTrack}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {record.profile.highestQualification} in{" "}
              {record.profile.fieldOfStudy} • Readiness Tier:{" "}
              <strong className="text-emerald-300">
                {record.assessment.readinessTier}
              </strong>
            </p>
          </div>
          <div className="rounded-2xl bg-slate-800 border border-slate-700 px-5 py-3 text-right">
            <div className="text-xs text-slate-400">Pathway Completion</div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {progressPct}% ({completedCount}/{totalMilestones} Phases)
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {record.pathway.executiveDiagnosis}
        </p>
      </div>

      {/* Interactive 8-Week Upskilling Milestones */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Interactive Upskilling & Competency Verification Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Click any milestone below to mark your deliverable complete. State
              persists across the platform.
            </p>
          </div>
          <div className="w-full sm:w-48 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {record.pathway.upskillingMilestones.map((m) => {
            const isDone = record.completedMilestones.includes(m.phase);
            return (
              <div
                key={m.phase}
                onClick={() => !updating && handleToggleMilestone(m.phase)}
                className={`cursor-pointer rounded-2xl border p-5 transition space-y-3 ${
                  isDone
                    ? "border-emerald-600 bg-emerald-50/40"
                    : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">
                    {m.phase}
                  </span>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Done
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Circle className="h-3.5 w-3.5" /> Mark Complete
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {m.objective}
                </p>

                <div className="pt-2 border-t border-slate-200/80 text-xs">
                  <span className="font-semibold text-slate-800">
                    Deliverable:{" "}
                  </span>
                  <span className="text-slate-600">{m.deliverable}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paired Human Coach + Partner Hub Pass */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Human Coach Pairing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
              <UserCheck className="h-4 w-4" /> Paired Human Industry Coach
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Status: {record.coachingStatus}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {record.pathway.assignedCoach.fullName}
            </h3>
            <p className="text-xs font-semibold text-emerald-700">
              {record.pathway.assignedCoach.title} •{" "}
              {record.pathway.assignedCoach.organization}
            </p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {record.pathway.assignedCoach.bio}
            </p>
          </div>

          <ul className="space-y-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
            {record.pathway.coachingAgenda.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {record.coachingStatus === "Session Confirmed" ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                1-on-1 Coaching Session Confirmed with{" "}
                {record.pathway.assignedCoach.fullName} (
                {record.coachingPreferredDate})
              </span>
            </div>
          ) : (
            <button
              type="button"
              disabled={updating}
              onClick={handleConfirmCoaching}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Calendar className="h-4 w-4" />
              Confirm 1-on-1 Coaching Session with{" "}
              {record.pathway.assignedCoach.fullName}
            </button>
          )}
        </div>

        {/* Partner Innovation Hub Pass or Diaspora Track */}
        {record.profile.city.toLowerCase().includes("abroad") ||
        record.profile.city.toLowerCase().includes("diaspora") ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-900">
                <Globe className="h-4 w-4" /> Diaspora Remote Track ({record.profile.city})
              </span>
              <span className="text-xs font-semibold text-blue-700">
                Cloud Access
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                International Workstation Mode
              </h3>
              <p className="text-xs text-slate-500">
                Operating remotely from {record.profile.city}
              </p>
            </div>

            <p className="rounded-xl bg-white border border-blue-200 p-3.5 text-xs text-blue-900 leading-relaxed">
              {record.pathway.infrastructureBridgePlan}
            </p>

            <div className="rounded-xl bg-blue-100/80 border border-blue-200 p-3.5 text-xs font-medium text-blue-900">
              💡 Physical innovation hubs ({record.pathway.recommendedHub.name} in Harare, plus Bulawayo, Mutare, Gweru, Masvingo) remain accessible to you whenever visiting Zimbabwe.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                <Building2 className="h-4 w-4" /> Last-Mile Hardware & Power Hub
              </span>
              <Link
                href="/hubs"
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                View All Hubs →
              </Link>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {record.pathway.recommendedHub.name}
              </h3>
              <p className="text-xs text-slate-500">
                {record.pathway.recommendedHub.address}
              </p>
            </div>

            <p className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 text-xs text-slate-700 leading-relaxed">
              {record.pathway.infrastructureBridgePlan}
            </p>

            {record.bookedHubDesk ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Subsidized Workstation Desk Reserved at{" "}
                  {record.bookedHubDesk.hubName}!
                </span>
              </div>
            ) : (
              <button
                type="button"
                disabled={updating}
                onClick={handleBookHubPass}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <Laptop className="h-4 w-4" />
                Reserve Subsidized Workstation Pass at{" "}
                {record.pathway.recommendedHub.name}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Next Step Callout to Jobs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Ready to Apply to Verified International Remote Roles?
          </h3>
          <p className="text-xs text-slate-600">
            Your AI-tailored resume summary and Deel/Payoneer payment guidance
            are pre-loaded in the Remote Jobs Studio.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 shrink-0"
        >
          Open Matched Remote Jobs & AI Resume Studio{" "}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
