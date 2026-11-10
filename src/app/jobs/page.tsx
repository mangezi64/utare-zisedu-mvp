"use client";

import { useState } from "react";
import { SEED_REMOTE_JOBS } from "@/lib/mock-data";
import { RemoteJob } from "@/types";
import {
  Briefcase,
  Globe,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";

export default function RemoteJobsPage() {
  const [selectedRail, setSelectedRail] = useState<string>("All");
  const [activeJobForResume, setActiveJobForResume] =
    useState<RemoteJob | null>(null);

  const rails = ["All", "Deel", "Payoneer", "Wise", "USD Wire (Nostro)"];

  const filteredJobs =
    selectedRail === "All"
      ? SEED_REMOTE_JOBS
      : SEED_REMOTE_JOBS.filter((job) =>
          job.supportedPaymentRails.some((r) =>
            r.toLowerCase().includes(selectedRail.toLowerCase())
          )
        );

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

      {/* Jobs Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredJobs.map((job) => (
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

              <button
                type="button"
                onClick={() => setActiveJobForResume(job)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Tailor My Resume for This Role (AI Studio)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Resume Tailoring Preview Modal */}
      {activeJobForResume && (
        <div className="rounded-2xl border-2 border-emerald-600 bg-slate-900 p-6 text-white space-y-4">
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
            Copy this ATS-optimized summary into your international remote CV
            when applying to <strong>{activeJobForResume.company}</strong>:
          </p>
          <div className="rounded-xl bg-slate-800 p-4 font-mono text-xs text-emerald-200 leading-relaxed">
            {`Results-driven Zimbabwean university graduate aligned with ${activeJobForResume.company}'s ${activeJobForResume.category} team. Verified competency in ${activeJobForResume.requiredSkills.join(
              ", "
            )}. Operating from an Utare ZIMEDU Partner Innovation Hub with 100% solar power redundancy, 150+ Mbps Starlink connectivity, and pre-verified ${activeJobForResume.supportedPaymentRails.join(
              " / "
            )} cross-border contractor billing in GMT+2 (EMEA overlap).`}
          </div>
        </div>
      )}
    </div>
  );
}
