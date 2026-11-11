"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  SlidersHorizontal,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { RemoteJob } from "@/types";
import { SEED_REMOTE_JOBS } from "@/lib/mock-data";

export default function OpportunitiesPage() {
  const [jobs, setJobs] = useState<RemoteJob[]>(SEED_REMOTE_JOBS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedArrangement, setSelectedArrangement] = useState("All");

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      })
      .catch(() => {});
  }, []);

  const categories = ["All", "Data", "Operations", "Marketing", "Finance", "Customer Support", "Software"];
  const industries = ["All", "Technology", "Research", "Media", "Professional Services"];
  const levels = ["All", "Entry", "Mid-level", "Experienced"];
  const arrangements = ["All", "Remote", "Hybrid", "On-site"];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      search === "" ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" ||
      job.category.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesIndustry =
      selectedIndustry === "All" ||
      (job.industry && job.industry.toLowerCase().includes(selectedIndustry.toLowerCase()));

    const matchesLevel =
      selectedLevel === "All" ||
      (job.level && job.level.toLowerCase() === selectedLevel.toLowerCase());

    const matchesArrangement =
      selectedArrangement === "All" ||
      (job.arrangement && job.arrangement.toLowerCase() === selectedArrangement.toLowerCase());

    return matchesSearch && matchesCategory && matchesIndustry && matchesLevel && matchesArrangement;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
          <Briefcase className="h-3.5 w-3.5 text-blue-700" />
          Verified Local & Global Work Opportunities
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Explore Career Pathways & Verified Roles
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 leading-relaxed">
          Filter pre-screened remote, hybrid, and local opportunities designed for
          Zimbabwean tertiary talent with guaranteed payment rails (Deel, Payoneer,
          Nostro) and partner hub workstation support.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles, required skills, or companies (e.g. Data, Python, Operations)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white"
            >
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Experience Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white"
            >
              {levels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Work Arrangement</label>
            <select
              value={selectedArrangement}
              onChange={(e) => setSelectedArrangement(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white"
            >
              {arrangements.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Results Summary */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Showing <strong>{filteredJobs.length}</strong> matching opportunities</span>
          {(search || selectedCategory !== "All" || selectedIndustry !== "All" || selectedLevel !== "All" || selectedArrangement !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setSelectedIndustry("All");
                setSelectedLevel("All");
                setSelectedArrangement("All");
              }}
              className="text-emerald-700 font-bold hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">No opportunities match your current filters.</p>
            <p className="text-xs text-slate-500">Try broadening your category or resetting the search filters.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-emerald-100 text-emerald-900 px-2.5 py-0.5 font-bold">
                      {job.category}
                    </span>
                    {job.industry && (
                      <span className="rounded-md bg-slate-100 text-slate-700 px-2.5 py-0.5 font-medium">
                        {job.industry}
                      </span>
                    )}
                    {job.arrangement && (
                      <span className="rounded-md bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-0.5 font-medium">
                        {job.arrangement}
                      </span>
                    )}
                    {job.level && (
                      <span className="rounded-md bg-purple-50 text-purple-800 px-2 py-0.5 font-medium">
                        {job.level}
                      </span>
                    )}
                    <span className="text-emerald-700 font-extrabold ml-1">
                      {job.compensationUsdMonthly}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    {job.title} — <span className="text-slate-600 font-medium">{job.company}</span>
                  </h2>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <Link
                    href={`/jobs`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                  >
                    <span>Tailor CV & Apply</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Required Skills:</span>
                  {job.requiredSkills.map((sk) => (
                    <span key={sk} className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 text-[11px]">
                      {sk}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <span>Payment:</span>
                  {job.supportedPaymentRails.map((rail) => (
                    <span key={rail} className="text-blue-700 font-semibold text-[11px]">
                      {rail}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
