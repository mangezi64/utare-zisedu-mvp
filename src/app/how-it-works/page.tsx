import Link from "next/link";
import {
  Compass,
  Cpu,
  Building2,
  Briefcase,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const STAGES = [
  {
    step: "01",
    title: "Intake & Diagnostic",
    icon: Compass,
    color: "emerald",
    desc: "Map your academic credentials, practical experience, career goals, and last-mile hardware barriers (device, electricity hours, mobile data).",
    href: "/assessment",
    cta: "Take Diagnostic",
  },
  {
    step: "02",
    title: "AI Pathway & Human Coach",
    icon: Cpu,
    color: "blue",
    desc: "Synthesize a personalized 90-day upskilling roadmap matched with a 1-on-1 industry mentor from the Zimbabwean diaspora.",
    href: "/pathway",
    cta: "View Pathway",
  },
  {
    step: "03",
    title: "Partner Innovation Hubs",
    icon: Building2,
    color: "purple",
    desc: "Eliminate load-shedding and data costs with subsidized daily passes to solar-powered, Starlink-backed local innovation hubs with PC loan pools.",
    href: "/hubs",
    cta: "Explore Hubs",
  },
  {
    step: "04",
    title: "Remote Jobs, ATS CV & Verification",
    icon: Briefcase,
    color: "amber",
    desc: "Generate anti-AI-slop, humanized CVs and application letters grounded strictly in your facts, and apply for verified international roles with Deel/Payoneer rails.",
    href: "/opportunities",
    cta: "Browse Roles",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
          The 4-Stage Mobility Journey
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          How UTARE ZISEDU AI Works
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          From dormant academic credential to productive global or local earner.
          Here is our end-to-end framework built for the realities of Zimbabwe.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-200">{s.step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>

              <Link
                href={s.href}
                className="inline-flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition border border-slate-200"
              >
                <span>{s.cta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
