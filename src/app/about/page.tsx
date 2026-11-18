import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SURVEY_BENCHMARKS } from "@/lib/mock-data";

const CHALLENGES = [
  {
    index: "01",
    title: "Limited openings",
    text: "Local employment opportunities can be limited, with 47.8% citing rigid 1–3 year experience walls and opaque hiring.",
  },
  {
    index: "02",
    title: "Access gaps",
    text: "Connectivity, laptop equipment, reliable electricity (73.9%), and professional networks can be difficult to reach.",
  },
  {
    index: "03",
    title: "Skills mismatch",
    text: "Available academic qualifications often do not map clearly to immediate local or global income pathways (84.6% misalignment).",
  },
  {
    index: "04",
    title: "Cross-border friction",
    text: "Remote work brings international payment rail barriers (86.4%), timezone coordination, and compliance challenges.",
  },
];

const TEAM_MEMBERS = [
  {
    num: "01",
    role: "PLATFORM ARCHITECTURE & AI ENGINE",
    name: "Stewart Mangezi",
    bio: "Leads candidate account workflows, 6-factor readiness diagnostics, Gemini AI career pathway synthesis, human coach pairing, and containerized infrastructure.",
  },
  {
    num: "02",
    role: "FRONTEND EXPERIENCE, UI & USER TESTING",
    name: "Future Wenzira",
    bio: "Co-designed the UTARE visual identity, typography, interactive candidate journey walkthrough, opportunities explorer, accessibility feedback, and responsive interface architecture.",
  },
  {
    num: "03",
    role: "FRONTEND ARCHITECTURE & DATABASE",
    name: "Amanda",
    bio: "Co-leads frontend UI design, user experience polish, partner hub directory layouts, and PostgreSQL / Supabase schema structure.",
  },
  {
    num: "04",
    role: "CANDIDATE INTAKE & PARTNER HUBS",
    name: "Munashe",
    bio: "Leads candidate diagnostic intake workflows and partner innovation hub mapping across Harare, Bulawayo, Mutare, Gweru, and Masvingo.",
  },
  {
    num: "05",
    role: "MARKET VALIDATION & REMOTE JOBS",
    name: "Kudakwashe",
    bio: "Leads competitor analysis, market validation, and curation criteria for verified remote work opportunities and payment rails.",
  },
  {
    num: "06",
    role: "STORYTELLING, STRATEGY & PARTNERSHIPS",
    name: "Bheki",
    bio: "Leads strategic ecosystem partnerships, sustainable business model design, empirical user journey storytelling, and employer and mentor outreach across Zimbabwe.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <span className="eyebrow">ABOUT UTARE ZEM AI</span>
        <h1>Zimbabwean potential deserves more pathways.</h1>
        <p>
          UTARE is a student-led initiative exploring how talent can connect
          qualifications and skills to sustainable earning possibilities in
          Zimbabwe and across global remote markets.
        </p>
      </section>

      {/* Our Story */}
      <section className="content-section two-col">
        <div>
          <div className="section-heading">
            <span className="eyebrow">OUR STORY</span>
            <h2>Six young people, one shared challenge</h2>
            <p>
              Five Mastercard Foundation Scholars and one USAP alumnus came
              together through an educational challenge encouraging young people
              to identify real community problems and develop practical
              solutions.
            </p>
          </div>
        </div>

        <div className="prose">
          <p>
            Our team chose to focus on the gap between education, qualifications
            and sustainable income opportunities in Zimbabwe. Many capable
            people face infrastructure, mentorship, and market-access barriers
            that make it difficult to translate what they know into stable
            livelihoods.
          </p>
          <p>
            UTARE is our response: a connected platform for career direction,
            human coaching, partner hub access, practical skills development,
            and verified employment pathways.
          </p>
          <div className="callout">
            <Sparkles className="h-5 w-5" />
            <span>
              <b>A student-led initiative.</b> Mention of Mastercard Foundation
              Scholars and a USAP alumnus describes team backgrounds only; it
              does not imply institutional endorsement or sponsorship.
            </span>
          </div>
        </div>
      </section>

      {/* Values Band */}
      <section className="values-band">
        <article>
          <span>OUR MISSION</span>
          <h3>Connect learning to livelihood pathways</h3>
          <p>
            Help Zimbabwean talent explore practical steps from qualifications
            and skills toward sustainable income opportunities.
          </p>
        </article>
        <article>
          <span>OUR VISION</span>
          <h3>More accessible economic mobility</h3>
          <p>
            A future where geography and infrastructure barriers place fewer
            limits on a person&apos;s ability to develop and contribute.
          </p>
        </article>
        <article>
          <span>OUR PROPOSAL</span>
          <h3>Bring support into one journey</h3>
          <p>
            Connect candidate insight, AI &amp; human pathway guidance, partner
            hub support, and opportunity readiness in one ecosystem.
          </p>
        </article>
      </section>

      {/* The Challenge & Empirical Survey Benchmarks */}
      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">THE CHALLENGE</span>
          <h2>The credential-to-livelihood paradox</h2>
          <p>
            Qualifications and skills matter, yet they do not always translate
            into sustainable income when opportunity and infrastructure barriers
            remain.
          </p>
        </div>

        <div className="feature-grid about-challenges">
          {CHALLENGES.map((c) => (
            <article key={c.index} className="feature-card">
              <span className="challenge-index">{c.index}</span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </article>
          ))}
        </div>

        {/* Empirical Survey Metrics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SURVEY_BENCHMARKS.map((b) => (
            <div
              key={b.label}
              className="rounded-xl border border-[#e1e7ec] bg-white p-5 shadow-sm"
            >
              <div
                className="text-2xl font-extrabold"
                style={{ color: "var(--green)", fontFamily: "var(--heading)" }}
              >
                {b.metric}
              </div>
              <div
                className="text-xs font-bold mt-1"
                style={{ color: "var(--navy)" }}
              >
                {b.label}
              </div>
              <p className="text-[11.5px] text-[#667085] mt-1 leading-relaxed">
                {b.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="solution-banner">
          <div>
            <div className="section-heading" style={{ marginBottom: 0 }}>
              <span className="eyebrow">OUR SOLUTION ARCHITECTURE</span>
              <h2>A bridge of guidance, development and access</h2>
              <p>
                UTARE delivers a connected candidate journey combining AI
                diagnostics, human mentorship, and solar-backed partner hubs.
              </p>
            </div>
          </div>
          <Link href="/how-it-works" className="button button-green">
            See how it works <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="team-section-heading">
          <div className="section-heading">
            <span className="eyebrow">THE PEOPLE BEHIND THE INITIATIVE</span>
            <h2>Our six-person team</h2>
            <p>
              Collaborating across product design, AI engineering, database
              infrastructure, partner hub operations, and empirical market
              research.
            </p>
          </div>
        </div>

        <div className="team-grid">
          {TEAM_MEMBERS.map((member) => (
            <article key={member.num} className="team-card">
              <div className="team-avatar">{member.num}</div>
              <span className="eyebrow">{member.role}</span>
              <h3>{member.name}</h3>
              <p>{member.bio}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
