"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  Briefcase,
  Search,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { RemoteJob } from "@/types";
import { SEED_REMOTE_JOBS } from "@/lib/mock-data";
import { useViewMode } from "@/lib/view-mode-context";

export default function OpportunitiesPage() {
  const { user, isAuthenticated } = useViewMode();
  const [jobs, setJobs] = useState<RemoteJob[]>(SEED_REMOTE_JOBS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedArrangement, setSelectedArrangement] = useState("All");
  const [activeDetailJob, setActiveDetailJob] = useState<RemoteJob | null>(
    null
  );

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

  const categories = [
    "All",
    "Data",
    "Operations",
    "Marketing",
    "Finance",
    "Customer Support",
    "Software",
  ];
  const industries = [
    "All",
    "Technology",
    "Research",
    "Media",
    "Professional Services",
  ];
  const levels = ["All", "Entry", "Mid-level", "Experienced"];
  const arrangements = ["All", "Remote", "Hybrid", "On-site"];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      search === "" ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.requiredSkills.some((s) =>
        s.toLowerCase().includes(search.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All" ||
      job.category.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesIndustry =
      selectedIndustry === "All" ||
      (job.industry &&
        job.industry.toLowerCase().includes(selectedIndustry.toLowerCase()));

    const matchesLevel =
      selectedLevel === "All" ||
      (job.level && job.level.toLowerCase() === selectedLevel.toLowerCase());

    const matchesArrangement =
      selectedArrangement === "All" ||
      (job.arrangement &&
        job.arrangement.toLowerCase() === selectedArrangement.toLowerCase());

    return (
      matchesSearch &&
      matchesCategory &&
      matchesIndustry &&
      matchesLevel &&
      matchesArrangement
    );
  });

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedIndustry("All");
    setSelectedLevel("All");
    setSelectedArrangement("All");
  };

  return (
    <div className="w-full min-h-screen">
      <PageBreadcrumb current="Opportunities" />
      {/* Faith & Amanda's Page Hero */}
      <section className="page-hero">
        <span className="eyebrow">OPPORTUNITIES</span>
        <h1>Explore pathways that fit your skills.</h1>
        <p>
          Browse verified remote, hybrid, and local opportunity pathways and
          filter by category, industry, experience level, and work arrangement.
          All roles support transparent payout rails (Deel, Payoneer, USD
          Nostro) and partner hub workstation access.
        </p>

        <div className="mt-5 max-w-3xl">
          {isAuthenticated && user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white/90 border border-[#c2e2d4] px-4 py-2.5 text-xs text-[#101a33]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#08785f] shrink-0" />
                <span>
                  Signed in as <strong>{user.name}</strong> ({user.email}).
                  Applications you submit link directly to your workspace.
                </span>
              </div>
              <Link href="/account" className="text-link shrink-0">
                My Workspace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white/90 border border-[#e1e7ec] px-4 py-2.5 text-xs text-[#202b3c]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#08785f] shrink-0" />
                <span>
                  Browsing opportunities as a public visitor. Sign in or create
                  an account to generate tailored ATS CVs and track your
                  applications.
                </span>
              </div>
              <Link href="/login" className="text-link shrink-0">
                Sign In / Register <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Opportunity Explorer Directory */}
      <section className="content-section">
        <div className="directory-top">
          <div className="section-heading" style={{ marginBottom: 0 }}>
            <span className="eyebrow">OPPORTUNITY EXPLORER</span>
            <h2>Verified opportunity listings ({filteredJobs.length})</h2>
          </div>

          <label className="search-box">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="search"
              placeholder="Search roles, skills or company..."
              aria-label="Search opportunities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        {/* 4-Way Filter Bar */}
        <div className="filter-bar">
          <label>
            Category
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All categories" : c}
                </option>
              ))}
            </select>
          </label>

          <label>
            Industry
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
            >
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i === "All" ? "All industries" : i}
                </option>
              ))}
            </select>
          </label>

          <label>
            Experience level
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l === "All" ? "Any level" : l}
                </option>
              ))}
            </select>
          </label>

          <label>
            Work arrangement
            <select
              value={selectedArrangement}
              onChange={(e) => setSelectedArrangement(e.target.value)}
            >
              {arrangements.map((a) => (
                <option key={a} value={a}>
                  {a === "All" ? "Any arrangement" : a}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={clearFilters} className="text-button">
            Clear filters
          </button>
        </div>

        {/* Opportunity Cards Grid */}
        {filteredJobs.length === 0 ? (
          <div className="empty-message">
            No opportunities match those filters. Try clearing or broadening
            your search criteria.
          </div>
        ) : (
          <div className="opportunity-grid">
            {filteredJobs.map((job) => (
              <article key={job.id} className="opportunity-card">
                <div>
                  <div className="opportunity-top">
                    <span className="opportunity-icon">
                      <Briefcase className="h-4 w-4" />
                    </span>
                    <span className="demo-pill">
                      {job.compensationUsdMonthly}
                    </span>
                  </div>

                  <span className="eyebrow">
                    {(job.arrangement || "REMOTE").toUpperCase()} ·{" "}
                    {job.category.toUpperCase()}
                  </span>
                  <h3>{job.title}</h3>
                  <p className="org-name">{job.company}</p>

                  <div className="job-meta">
                    <span>
                      {job.industry || "Technology"} ·{" "}
                      {job.level || "Entry / Mid-level"}
                    </span>
                    <span>
                      Skills: {job.requiredSkills.slice(0, 3).join(" · ")}
                    </span>
                    <span>
                      Payout: {job.supportedPaymentRails.join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveDetailJob(job)}
                    className="text-link"
                  >
                    View details <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <Link
                    href="/jobs"
                    className="button button-green"
                    style={{
                      minHeight: "34px",
                      padding: "0 12px",
                      fontSize: "11px",
                    }}
                  >
                    Tailor CV &amp; Apply
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="content-disclaimer">
          Every listing shows verified skill requirements and supported payout
          rails. Use the ATS CV &amp; Application Letter Studio to tailor your
          application grounded strictly in your verified profile.
        </p>
      </section>

      {/* Role Detail Modal (Faith & Amanda's Modal Design) */}
      {activeDetailJob && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDetailJob(null);
          }}
        >
          <div className="simple-modal detail-modal">
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={() => setActiveDetailJob(null)}
            >
              ×
            </button>
            <span className="eyebrow">
              {(activeDetailJob.arrangement || "REMOTE").toUpperCase()} ·{" "}
              {activeDetailJob.category.toUpperCase()}
            </span>
            <h2>{activeDetailJob.title}</h2>
            <p className="font-semibold text-[#202b3c] mb-2">
              {activeDetailJob.company} —{" "}
              <span className="text-[#08785f]">
                {activeDetailJob.compensationUsdMonthly}
              </span>
            </p>
            <p>{activeDetailJob.description}</p>

            <dl className="detail-list">
              <div>
                <dt>Category</dt>
                <dd>{activeDetailJob.category}</dd>
              </div>
              <div>
                <dt>Industry</dt>
                <dd>{activeDetailJob.industry || "Technology"}</dd>
              </div>
              <div>
                <dt>Experience level</dt>
                <dd>{activeDetailJob.level || "Entry / Mid-level"}</dd>
              </div>
              <div>
                <dt>Work arrangement</dt>
                <dd>{activeDetailJob.arrangement || "Remote"}</dd>
              </div>
              <div>
                <dt>Key skills</dt>
                <dd>{activeDetailJob.requiredSkills.join(" · ")}</dd>
              </div>
              <div>
                <dt>Payment rails</dt>
                <dd>{activeDetailJob.supportedPaymentRails.join(", ")}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2.5 mt-4">
              <Link
                href="/jobs"
                className="button button-green"
                style={{ flex: 1 }}
              >
                Tailor ATS CV &amp; Apply <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="button"
                onClick={() => setActiveDetailJob(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Closing CTA */}
      <section className="closing-cta">
        <div>
          <span className="eyebrow eyebrow-light">
            PREPARE FOR WHAT&apos;S NEXT
          </span>
          <h2>Build your readiness alongside your search.</h2>
          <p>
            Explore modular skills development and AI career direction as you
            apply for opportunities.
          </p>
        </div>
        <div className="closing-actions">
          <Link href="/skills" className="button button-green">
            Explore Skills <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/how-it-works" className="button button-ghost">
            How UTARE works
          </Link>
        </div>
      </section>
    </div>
  );
}
