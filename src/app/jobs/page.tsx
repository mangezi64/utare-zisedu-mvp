"use client";

import { useEffect, useState } from "react";
import { SEED_REMOTE_JOBS } from "@/lib/mock-data";
import { RemoteJob } from "@/types";
import { JobApplicationRecord, StoredCandidateRecord } from "@/lib/store";
import {
  Globe,
  CheckCircle2,
  FileText,
  Sparkles,
  Send,
} from "lucide-react";

export default function RemoteJobsPage() {
  const [jobs, setJobs] = useState<RemoteJob[]>(SEED_REMOTE_JOBS);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [activeCandidate, setActiveCandidate] =
    useState<StoredCandidateRecord | null>(null);
  const [selectedRail, setSelectedRail] = useState<string>("All");
  const [activeJobForResume, setActiveJobForResume] =
    useState<RemoteJob | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs);
        if (data.applications) setApplications(data.applications);
        if (data.activeCandidate) setActiveCandidate(data.activeCandidate);
      })
      .catch(() => {});
  }, []);

  const rails = ["All", "Deel", "Payoneer", "Wise", "USD Wire (Nostro)"];

  const filteredJobs =
    selectedRail === "All"
      ? jobs
      : jobs.filter((job) =>
          job.supportedPaymentRails.some((r) =>
            r.toLowerCase().includes(selectedRail.toLowerCase())
          )
        );

  function buildTailoredResumePitch(job: RemoteJob): string {
    if (activeCandidate) {
      const p = activeCandidate.profile;
      const hub = activeCandidate.pathway.recommendedHub;
      return `${p.fullName} — ${p.highestQualification} in ${
        p.fieldOfStudy
      } (${p.city}, Zimbabwe | GMT+2 EMEA overlap). Applying for ${
        job.title
      } at ${job.company}. Verified competencies in ${Array.from(
        new Set([...p.currentSkills.slice(0, 3), ...job.requiredSkills])
      ).join(", ")}. Backed by ${
        hub.name
      } with 100% solar backup, ${
        hub.avgSpeedMbps
      } Mbps Starlink connectivity, and ready for ${job.supportedPaymentRails.join(
        " / "
      )} settlement.`;
    }
    return `Results-driven Zimbabwean university graduate aligned with ${
      job.company
    }'s ${job.category} team. Verified competency in ${job.requiredSkills.join(
      ", "
    )}. Operating from an Utare ZISEDU Partner Innovation Hub with 100% solar power redundancy, 150+ Mbps Starlink connectivity, and pre-verified ${job.supportedPaymentRails.join(
      " / "
    )} cross-border contractor billing in GMT+2 (EMEA overlap).`;
  }

  async function handleSubmitApplication(job: RemoteJob) {
    setSubmitting(true);
    try {
      const pitch = buildTailoredResumePitch(job);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          tailoredResumePitch: pitch,
        }),
      });
      const data = await res.json();
      if (data.application) {
        setApplications([data.application, ...applications]);
        setActiveJobForResume(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
          Task #5 — Curated Remote Job Feed & AI Resume Tailoring
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Verified Zimbabwe-Accessible Remote Opportunities
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Nearly half (<strong>47.8%</strong>) of surveyed Zimbabwean graduates
          actively pursue international remote work, yet{" "}
          <strong>86.4%</strong> are locked out of global payment rails. Every
          role listed here is verified for Zimbabwean residency and supports
          compliant cross-border payout rails.
        </p>
      </div>

      {/* Active Candidate Context Banner */}
      {activeCandidate && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-emerald-900">
              AI Resume Tailoring Connected to:{" "}
            </span>
            <span>
              {activeCandidate.profile.fullName} (
              {activeCandidate.profile.highestQualification} in{" "}
              {activeCandidate.profile.fieldOfStudy}) • Hub:{" "}
              {activeCandidate.pathway.recommendedHub.name}
            </span>
          </div>
          <span className="font-bold text-emerald-800">
            Applications Submitted: {applications.length}
          </span>
        </div>
      )}

      {/* Payment Rail Filter */}
      <div className="flex flex-wrap items-center gap-2">
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

      {/* AI Resume Tailoring & Application Submission Modal */}
      {activeJobForResume && (
        <div className="rounded-2xl border-2 border-emerald-500 bg-slate-900 p-6 text-white space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold">
                AI-Tailored Resume Pitch for: {activeJobForResume.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveJobForResume(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Generated using your active candidate profile & Partner Hub
            credentials for <strong>{activeJobForResume.company}</strong>:
          </p>
          <div className="rounded-xl bg-slate-800 p-4 font-mono text-xs text-emerald-200 leading-relaxed">
            {buildTailoredResumePitch(activeJobForResume)}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitApplication(activeJobForResume)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
            >
              <Send className="h-4 w-4" />
              {submitting
                ? "Submitting Application..."
                : "Submit Verified Application with AI Pitch"}
            </button>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
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
                  <div className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Application Submitted with AI-Tailored Resume
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveJobForResume(job)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Tailor Resume & Apply (AI Studio)
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
