import Link from "next/link";
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
} from "lucide-react";

const STAGES = [
  {
    n: "01",
    icon: Compass,
    title: "Intake & Diagnostic",
    text: "Map your qualifications, experience, interests and last-mile infrastructure barriers across a 6-factor readiness diagnostic.",
    href: "/assessment",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "AI Pathway & Coach",
    text: "Explore tailored 90-day career directions powered by Gemini AI and paired with a 1-on-1 Zimbabwean industry mentor.",
    href: "/pathway",
  },
  {
    n: "03",
    icon: Building2,
    title: "Partner Hubs",
    text: "Access solar-powered, Starlink-connected workspaces, equipment loan pools, and community support across Zimbabwe.",
    href: "/hubs",
  },
  {
    n: "04",
    icon: Briefcase,
    title: "Remote Jobs & CV",
    text: "Generate grounded, ATS-ready CVs and application letters and explore verified local and global work opportunities.",
    href: "/jobs",
  },
];

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

export default function HomePage() {
  return (
    <div>
      {/* Faith & Amanda's Split Hero Panel with Animated Zimbabwe Radar Visual */}
      <section className="hero-wrap">
        <div className="hero-panel">
          <div className="hero-text">
            <span className="eyebrow eyebrow-light">
              UTARE ZEM AI · ECONOMIC MOBILITY ECOSYSTEM
            </span>
            <h1>
              Bridging Zimbabwe&apos;s{" "}
              <em>Credential-to-Livelihood Paradox</em>
            </h1>
            <p>
              Zimbabwe has talented graduates and skilled individuals—with{" "}
              <strong>82.6%</strong> of surveyed talent holding university
              degrees—yet <strong>43.5%</strong> remain unemployed and{" "}
              <strong>84.6%</strong> of workers are trapped in misaligned
              survival gigs. UTARE bridges this gap through AI career guidance,
              human coaching, solar-powered partner hubs, and access to local
              and international earning opportunities.
            </p>
            <div className="hero-actions">
              <Link href="/assessment" className="button button-green">
                Start Candidate Bridge
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/hubs" className="button button-ghost">
                Explore Partner Innovation Hubs
              </Link>
              <Link href="/opportunities" className="button button-ghost">
                Browse Opportunities
              </Link>
            </div>
            <div className="hero-note">
              <Check className="h-4 w-4" />
              <span>
                Practical readiness, verified competency, and infrastructure
                access connecting Zimbabwean talent to global &amp; local work.
              </span>
            </div>
          </div>

          {/* Zimbabwe ("ZW") Radial Global Reach Illustration */}
          <div
            className="hero-visual"
            aria-label="Illustration of Zimbabwe connected to global opportunities"
          >
            <div className="visual-grid" />
            <div className="map-ring ring-1" />
            <div className="map-ring ring-2" />
            <div className="map-center">
              <span>ZW</span>
              <small>ZIMBABWE</small>
            </div>
            <span className="map-point point-1">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="map-point point-2">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="map-point point-3">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="map-line line-1" />
            <span className="map-line line-2" />
            <span className="map-line line-3" />
            <div className="map-label">
              Connected pathways
              <br />
              <b>Local roots · Global reach</b>
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
          <span className="eyebrow">A CLEAR NEXT STEP</span>
          <h2>Your Pathway to Economic Mobility</h2>
          <p>
            A guided 4-stage experience that helps candidates make informed
            decisions and overcome practical barriers at every step.
          </p>
        </div>

        <div className="journey-grid">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.n} className="journey-card">
                <span className="icon-tile">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="step-number">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <Link href={s.href} className="text-link">
                  Explore this stage <ArrowRight className="h-4 w-4" />
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
          <span className="eyebrow eyebrow-light">
            YOUR NEXT STEP STARTS HERE
          </span>
          <h2>Your Qualifications Should Open Doors to Opportunity.</h2>
          <p>
            Build your skills, explore career pathways, and connect to verified
            economic opportunities.
          </p>
        </div>
        <div className="closing-actions">
          <Link href="/assessment" className="button button-green">
            Start Candidate Bridge <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/opportunities" className="button button-ghost">
            Explore Remote Opportunities
          </Link>
        </div>
      </section>
    </div>
  );
}
