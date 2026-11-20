"use client";

import Link from "next/link";
import WatchDemoButton from "@/components/WatchDemoButton";
import ZimbabweRadarVisual from "@/components/ZimbabweRadarVisual";
import { useLanguage } from "@/lib/language-context";
import {
  SURVEY_BENCHMARKS,
  SEED_INNOVATION_HUBS,
  SEED_COACHES,
  SEED_REMOTE_JOBS,
} from "@/lib/mock-data";
import {
  ArrowRight,
  Compass,
  Sparkles,
  Building2,
  Briefcase,
  BookOpen,
  Users,
  Check,
  Smartphone,
  ShieldCheck,
  Accessibility,
} from "lucide-react";

const STAGE_ICONS = [Compass, Sparkles, Building2, Briefcase];

const CHALLENGES = [
  {
    text: "Limited local employment opportunities & opaque hiring walls",
    icon: Briefcase,
  },
  {
    text: "Access to international remote work & global employers",
    icon: Building2,
  },
  {
    text: "Mismatch between qualifications and income opportunities (84.6%)",
    icon: Compass,
  },
  {
    text: "Relevant digital, AI, and remote collaboration skills",
    icon: Sparkles,
  },
  {
    text: "Connectivity, laptop equipment and power infrastructure (73.9%)",
    icon: Users,
  },
  {
    text: "Cross-border work and international payment rails (86.4%)",
    icon: ArrowRight,
  },
];

export default function HomePageContent() {
  const { t } = useLanguage();

  return (
    <div>
      {/* Split Hero Panel with Animated Zimbabwe Radar Visual */}
      <section className="hero-wrap">
        <div className="hero-panel">
          <div className="hero-text">
            <span className="eyebrow eyebrow-light">{t.hero.eyebrow}</span>
            <h1>
              {t.hero.titlePrefix}
              <em>{t.hero.titleEmphasis}</em>
            </h1>
            <p>{t.hero.subtitle}</p>
            <div className="hero-actions">
              <Link href="/assessment" className="button button-green">
                {t.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <WatchDemoButton />
              <Link href="/hubs" className="button button-ghost">
                {t.hero.ctaHubs}
              </Link>
              <Link href="/opportunities" className="button button-ghost">
                {t.hero.ctaOpportunities}
              </Link>
            </div>
            <div className="hero-note">
              <Check className="h-4 w-4" />
              <span>{t.hero.heroNote}</span>
            </div>
          </div>

          {/* Zimbabwe ("ZW") Radial Global Reach Illustration */}
          <ZimbabweRadarVisual />
        </div>

        {/* Up-Front Mobile, Low-Data, Offline Resilience & Accessibility Strip */}
        <div
          className="mx-auto mt-5 max-w-[1220px] rounded-2xl border border-emerald-500/25 bg-slate-900/95 p-4 sm:p-5 text-white shadow-lg"
          aria-label={t.hero.resilienceHeading}
        >
          <p className="mb-3 text-[0.75rem] font-bold tracking-wider uppercase text-emerald-300">
            {t.hero.resilienceHeading}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <Smartphone className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xs font-bold text-white">
                  {t.hero.mobileBadgeTitle}
                </h2>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-300">
                  {t.hero.mobileBadgeDesc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xs font-bold text-white">
                  {t.hero.offlineBadgeTitle}
                </h2>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-300">
                  {t.hero.offlineBadgeDesc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
                <Accessibility className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xs font-bold text-white">
                  {t.hero.inclusionBadgeTitle}
                </h2>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate-300">
                  {t.hero.inclusionBadgeDesc}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("utare-open-accessibility"))
                  }
                  className="mt-2 inline-flex items-center gap-1 text-[0.78rem] font-bold text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                >
                  Open Accessibility &amp; Language Panel →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Empirical Survey Grounding Section */}
      <section className="survey-section">
        <div className="survey-intro">
          <div className="section-heading">
            <span className="eyebrow">EVIDENCE WITH CONTEXT</span>
            <h2>Empirical Grounding: UTARE Mobility Survey</h2>
            <p>
              Why traditional job boards fail Zimbabwean graduates—and how our
              triple-bottleneck architecture directly addresses hardware,
              mentorship, and payment isolation.
            </p>
          </div>
          <div className="survey-placeholder mt-5">
            <span className="survey-mark">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <b>Verified Empirical Cohort Findings</b>
              <p>
                Grounded in the UTARE User Journey &amp; Economic Mobility
                Survey across tertiary graduates, TVET artisans, and early-career
                professionals in Zimbabwe.
              </p>
            </div>
            <span className="data-status">VERIFIED DATA</span>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {SURVEY_BENCHMARKS.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#e1e7ec] bg-white p-5 shadow-sm"
            >
              <div
                className="text-3xl font-extrabold"
                style={{ color: "var(--green)", fontFamily: "var(--heading)" }}
              >
                {item.metric}
              </div>
              <div
                className="mt-1 text-sm font-bold"
                style={{ color: "var(--navy)" }}
              >
                {item.label}
              </div>
              <p className="mt-1.5 text-xs text-[#667085] leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4-Stage Candidate Journey */}
      <section className="journey-section section-pad">
        <div className="section-heading">
          <span className="eyebrow">{t.journey.eyebrow}</span>
          <h2>{t.journey.heading}</h2>
          <p>{t.journey.subheading}</p>
        </div>

        <div className="journey-grid">
          {t.journey.stages.map((s, idx) => {
            const Icon = STAGE_ICONS[idx] || Compass;
            return (
              <article key={s.n} className="journey-card">
                <span className="icon-tile">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="step-number">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <Link href={s.href} className="text-link">
                  {t.journey.exploreStage} <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* Turning Qualifications into Economic Opportunity */}
      <section className="mobility-section">
        <div className="mobility-inner">
          <div className="mobility-copy">
            <div className="section-heading">
              <span className="eyebrow">WHY THIS BRIDGE MATTERS</span>
              <h2>Turning Qualifications into Economic Opportunity</h2>
              <p>
                The platform is designed around practical barriers faced by
                Zimbabwean talent. Progress takes collaboration across
                candidates, employers, mentors, and local hub partners.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/how-it-works" className="button button-green">
                Learn how it works <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/employers" className="button">
                For Employers &amp; Partners
              </Link>
            </div>
          </div>

          <ul className="challenge-list">
            {CHALLENGES.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.text}>
                  <span className="icon-tile icon-small">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{c.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Support for the Whole Journey */}
      <section className="features-section section-pad">
        <div className="section-heading">
          <span className="eyebrow">A CONNECTED SUPPORT SYSTEM</span>
          <h2>Support for the whole journey</h2>
          <p>
            Career guidance, human coaching, and practical infrastructure access
            work together to help candidates move forward.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span className="icon-tile">
              <Compass className="h-5 w-5" />
            </span>
            <h3>Career Pathway Guidance</h3>
            <p>
              Explore structured 90-day directions powered by Gemini AI that
              connect your academic background with high-demand opportunity
              areas.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <Users className="h-5 w-5" />
            </span>
            <h3>Human Coaching &amp; Professional Development</h3>
            <p>
              Build confidence and practical readiness with{" "}
              {SEED_COACHES.length} verified Zimbabwean mentors and free modular
              skills courses.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <Building2 className="h-5 w-5" />
            </span>
            <h3>Partner Innovation Hubs</h3>
            <p>
              Connect with {SEED_INNOVATION_HUBS.length} community spaces across
              Harare, Bulawayo, Mutare, Gweru, and Masvingo offering solar power,
              Starlink broadband, and PC loans.
            </p>
          </article>

          <article className="feature-card">
            <span className="icon-tile">
              <Briefcase className="h-5 w-5" />
            </span>
            <h3>Remote Employment &amp; CV Preparation</h3>
            <p>
              Prepare humanized ATS CVs and application letters and apply across{" "}
              {SEED_REMOTE_JOBS.length}+ verified roles with Deel, Payoneer, and
              USD Nostro rails.
            </p>
          </article>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="closing-cta">
        <div>
          <span className="eyebrow eyebrow-light">{t.closing.eyebrow}</span>
          <h2>{t.closing.heading}</h2>
          <p>{t.closing.subheading}</p>
        </div>
        <div className="closing-actions">
          <Link href="/assessment" className="button button-green">
            {t.closing.ctaPrimary} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/opportunities" className="button button-ghost">
            {t.closing.ctaSecondary}
          </Link>
        </div>
      </section>
    </div>
  );
}
