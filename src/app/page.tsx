import Link from "next/link";
import {
  SURVEY_BENCHMARKS,
  SEED_INNOVATION_HUBS,
  SEED_COACHES,
  SEED_REMOTE_JOBS,
} from "@/lib/mock-data";
import {
  ArrowRight,
  Cpu,
  Building2,
  Users,
  Briefcase,
  ShieldCheck,
  Wifi,
  Laptop,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-14">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-300">
            <span>UTARE ZISEDU AI — Economic Mobility Ecosystem</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Bridging Zimbabwe’s{" "}
            <span className="text-emerald-400">
              Credential-to-Livelihood Paradox
            </span>
          </h1>
          <p className="text-base text-slate-300 sm:text-lg leading-relaxed">
            While <strong>82.6%</strong> of surveyed Zimbabwean talent hold
            university degrees, <strong>43.5%</strong> remain unemployed and{" "}
            <strong>84.6%</strong> of workers are trapped in misaligned survival
            gigs. Utare ZISEDU AI converts dormant tertiary credentials into
            global and local earning power through AI career pathways, human
            coaching, and solar-powered local innovation hubs.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-emerald-400"
            >
              Start Candidate Diagnostic & Roadmap
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse Verified Opportunities
            </Link>
            <Link
              href="/employers"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-5 py-3.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-900/80"
            >
              Hire Zimbabwean Talent
            </Link>
            <Link
              href="/demo/index.html"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3.5 text-xs font-medium text-slate-300 transition hover:text-white"
            >
              Launch Static Demo (Walkthrough) ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Empirical Survey Benchmarks (N = 23) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Empirical Grounding: UTARE Mobility Survey ($N = 23$)
            </h2>
            <p className="text-sm text-slate-600">
              Why traditional job boards fail Zimbabwean graduates—and what our
              architecture solves directly.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Challenge Track: Future of Work & Grassroots Mobility
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SURVEY_BENCHMARKS.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-3xl font-extrabold text-emerald-700">
                {item.metric}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">
                {item.label}
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The Triple Bottleneck vs. Utare Solution Architecture */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Laptop className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            1. Last-Mile Hardware & Power Bridge
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>73.9%</strong> lack reliable broadband and{" "}
            <strong>100%</strong> of surveyed small business owners lack a
            dedicated laptop. Our intake flags hardware deficits and pairs
            candidates with solar-backed, Starlink-equipped local Innovation
            Hubs.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            2. Gemini AI Pathway + Human Coaching
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Bypasses opaque local hiring (47.8% cite rigid 1–3 year experience
            walls) by combining a dynamic <strong>Gemini AI</strong> upskilling
            roadmap with 1-on-1 Zimbabwean industry mentors ({SEED_COACHES.length}{" "}
            active coaches).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Globe className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            3. Global Payment Rails & Verified Jobs
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>86.4%</strong> of remote job seekers are locked out of
            international payment systems. We curate remote roles with verified
            Deel, Payoneer, and USD Nostro payout compatibility alongside AI
            resume tailoring.
          </p>
        </div>
      </section>

      {/* Interactive MVP Modules Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          MVP End-to-End Architecture & Team Workstreams
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white">
                  Tasks #1, #2 & #3
                </span>
                <Users className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Smart Intake, Assessment & AI Coach Pairing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Captures academic credentials & ZESA/laptop constraints, scores
                readiness across 4 dimensions, generates a personalized Gemini
                AI upskilling pathway, and pairs the candidate with a human
                coach.
              </p>
              <p className="text-xs font-medium text-slate-500">
                Leads: Stewart Mangezi & Munashe
              </p>
            </div>
            <Link
              href="/assessment"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:underline"
            >
              Open Intake & AI Pathway Studio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
                  Task #4
                </span>
                <Building2 className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Partner Innovation Hub Directory
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maps solar-powered, Starlink-connected hubs in Harare, Bulawayo,
                Mutare, and Gweru where candidates without home broadband or
                laptops can train and execute remote work.
              </p>
              <p className="text-xs font-medium text-slate-500">
                Leads: Munashe & Amanda
              </p>
            </div>
            <Link
              href="/hubs"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:underline"
            >
              Browse & Enlist Partner Hubs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
                  Task #5
                </span>
                <Briefcase className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Curated Remote Job Feed & AI Resume Builder
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verified remote roles accessible to Zimbabwean talent ({SEED_REMOTE_JOBS.length}{" "}
                active pipelines) with transparent Deel/Payoneer payout rails
                and instant AI resume tailoring.
              </p>
              <p className="text-xs font-medium text-slate-500">
                Leads: Kudakwashe, Amanda & Dev Team
              </p>
            </div>
            <Link
              href="/jobs"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:underline"
            >
              View Verified Remote Jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
