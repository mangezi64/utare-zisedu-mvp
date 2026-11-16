import Link from "next/link";
import {
  Compass,
  Sparkles,
  Building2,
  Briefcase,
  ArrowRight,
} from "lucide-react";

const STAGES = [
  {
    n: "01",
    icon: Compass,
    title: "Intake & Diagnostic",
    explanation:
      "Share your qualifications, experience, interests, skills and current infrastructure barriers (device ownership, electricity hours, broadband access) in a guided 6-factor intake.",
    detail:
      "Scores readiness into three clear tiers: Market-Ready (Direct Placement), Upskill Bridge Needed, or Infrastructure & Hub Priority.",
    href: "/assessment",
    cta: "Launch Diagnostic",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "AI Pathway & Human Coach",
    explanation:
      "Synthesize a custom 90-day career roadmap powered by Google Gemini 2.5 and discuss next steps with a matched 1-on-1 Zimbabwean industry coach.",
    detail:
      "Combines interactive milestone tracking with direct mentor session booking and competency verification.",
    href: "/pathway",
    cta: "Open AI Pathway",
  },
  {
    n: "03",
    icon: Building2,
    title: "Partner Innovation Hubs",
    explanation:
      "Connect with partner innovation hubs across Harare, Bulawayo, Mutare, Gweru, and Masvingo offering 100% solar power, Starlink broadband, and workstation loan pools.",
    detail:
      "Eliminates load-shedding and data costs for candidates operating without home broadband or a dedicated laptop.",
    href: "/hubs",
    cta: "Explore Partner Hubs",
  },
  {
    n: "04",
    icon: Briefcase,
    title: "Remote Jobs & Grounded ATS CV Studio",
    explanation:
      "Generate grounded, anti-AI-slop ATS CVs and formal Zimbabwean application letters with 1-click Word (.docx) export, and apply to verified remote and local roles.",
    detail:
      "All curated opportunities support verified international payment rails (Deel, Payoneer, Wise, and USD Nostro).",
    href: "/opportunities",
    cta: "Explore Opportunities",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <span className="eyebrow">HOW IT WORKS</span>
        <h1>A guided path from skills to opportunity.</h1>
        <p>
          UTARE connects four stages to help candidates understand their
          starting point, build practical readiness, overcome infrastructure
          barriers, and access verified earning pathways.
        </p>
      </section>

      {/* 4 Journey Rows */}
      <section className="content-section journey-detail">
        {STAGES.map((s) => {
          const Icon = s.icon;
          return (
            <article key={s.n} className="journey-row">
              <div className="journey-row-icon">
                <span className="icon-tile">
                  <Icon className="h-5 w-5" />
                </span>
                <span>{s.n}</span>
              </div>

              <div>
                <span className="eyebrow">STAGE {s.n} · LIVE MODULE</span>
                <h2>{s.title}</h2>
                <p>{s.explanation}</p>
                <p className="muted">{s.detail}</p>
              </div>

              <Link href={s.href} className="text-link">
                {s.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </section>

      {/* Operational Notice Band */}
      <section className="notice-band">
        <Sparkles className="h-5 w-5" />
        <div>
          <b>Fully Connected End-to-End Platform</b>
          <p>
            Every stage above is live and connected to our PostgreSQL database
            and background Gemini AI engine. Candidates can complete the
            diagnostic, track 90-day milestones, book a hub workstation, and
            export tailored Word (`.docx`) CVs &amp; cover letters.
          </p>
        </div>
      </section>

      {/* Compact CTA */}
      <section className="content-section compact-cta">
        <div>
          <div className="section-heading" style={{ marginBottom: 0 }}>
            <span className="eyebrow">START WHERE YOU ARE</span>
            <h2>Take the first step when you&apos;re ready</h2>
            <p>
              A short diagnostic helps organize your academic credentials,
              practical skills, and infrastructure needs.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/assessment" className="button button-green">
            Start Candidate Bridge <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/jobs" className="button">
            Open CV &amp; Cover Letter Studio
          </Link>
        </div>
      </section>
    </div>
  );
}
