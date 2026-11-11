import Link from "next/link";
import {
  Compass,
  Building2,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { SURVEY_BENCHMARKS, SEED_INNOVATION_HUBS, SEED_COACHES } from "@/lib/mock-data";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Hero */}
      <section className="rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-300">
            About UTARE ZISEDU AI
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Bridging Zimbabwe&apos;s{" "}
            <span className="text-emerald-400">Credential-to-Livelihood Paradox.</span>
          </h1>
          <p className="text-base text-slate-300 sm:text-lg leading-relaxed">
            We are dedicated to helping Zimbabwean talent access career pathways, develop
            practical skills, overcome local power/broadband bottlenecks, and connect
            to global opportunities beyond geographical boundaries.
          </p>
        </div>
      </section>

      {/* The Core Mission */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Target className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">1. Concrete Value Proposition</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Not just a job board. We solve the triple bottleneck: last-mile power/broadband
            infrastructure, practical competency verification, and cross-border payment setup.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">2. Partner Hub Network</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {SEED_INNOVATION_HUBS.length} physical partner hubs in Harare, Bulawayo, Mutare, Gweru,
            and Masvingo providing 100% solar power, Starlink broadband, and PC hardware loans.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">3. Human Coaching Bridge</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {SEED_COACHES.length} verified industry mentors from the Zimbabwean diaspora and local
            tech ecosystem providing 1-on-1 career guidance and mock interviews.
          </p>
        </div>
      </section>

      {/* Survey Benchmarks Grounding */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Empirical Research Grounding (UTARE Survey N=23)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SURVEY_BENCHMARKS.map((b) => (
            <div key={b.label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl font-extrabold text-emerald-700">{b.metric}</div>
              <div className="text-xs font-bold text-slate-900 mt-1">{b.label}</div>
              <p className="text-[11px] text-slate-500 mt-1">{b.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
