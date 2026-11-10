"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AICareerPathway,
  CandidateProfile,
  SkillsAssessmentResult,
} from "@/types";
import {
  Sparkles,
  Laptop,
  Wifi,
  Zap,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";

const PRESET_PERSONAS: { label: string; profile: CandidateProfile }[] = [
  {
    label: "Chipo (BSc Economics, Unemployed, Harare)",
    profile: {
      fullName: "Chipo Nyamande",
      email: "chipo.nyamande@example.co.zw",
      phone: "+263 77 210 9876",
      city: "Harare",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "BSc Honours in Economics & Statistics",
      yearsExperience: 1,
      employmentStatus: "Unemployed",
      monthlyIncomeBracket: "$0 (Zero Income)",
      hasDedicatedLaptop: false,
      primaryDevice: "Smartphone Only",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 5,
      hasGlobalPaymentRail: false,
      primaryGoal: "International Remote Work",
      currentSkills: [
        "Statistical Analysis",
        "Academic Research",
        "Excel",
        "Report Writing",
      ],
    },
  },
  {
    label: "Tinashe (BEng Computer Science, Survival Gig, Bulawayo)",
    profile: {
      fullName: "Tinashe Dube",
      email: "tinashe.dube@example.co.zw",
      phone: "+263 71 455 3210",
      city: "Bulawayo",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "BSc Computer Science & Software Engineering",
      yearsExperience: 2,
      employmentStatus: "Survival Gig (Misaligned)",
      monthlyIncomeBracket: "$1 - $150 / mo",
      hasDedicatedLaptop: true,
      primaryDevice: "Dedicated Laptop / PC",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 6,
      hasGlobalPaymentRail: false,
      primaryGoal: "International Remote Work",
      currentSkills: ["Python", "JavaScript", "SQL", "Data Entry", "Git"],
    },
  },
  {
    label: "Nyasha (HND Agribusiness, SME Founder, Mutare)",
    profile: {
      fullName: "Nyasha Mutekede",
      email: "nyasha.mutekede@example.co.zw",
      phone: "+263 78 301 4490",
      city: "Mutare",
      highestQualification: "HND / Higher National Diploma",
      fieldOfStudy: "Agribusiness & Horticulture Value Chain",
      yearsExperience: 3,
      employmentStatus: "Self-Employed / Grassroots SME",
      monthlyIncomeBracket: "$151 - $300 / mo",
      hasDedicatedLaptop: false,
      primaryDevice: "Smartphone Only",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 4,
      hasGlobalPaymentRail: false,
      primaryGoal: "Agribusiness & Farm Commercialization",
      currentSkills: [
        "Produce Sourcing",
        "WhatsApp Sales",
        "Basic Bookkeeping",
      ],
    },
  },
  {
    label: "Simba (TVET Solar & Electrical Artisan, Masvingo)",
    profile: {
      fullName: "Simbarashe Chitepo",
      email: "simba.solar@example.co.zw",
      phone: "+263 77 412 8899",
      city: "Masvingo",
      highestQualification:
        "Vocational Trade Certificate (Artisan / Apprenticeship)",
      fieldOfStudy: "Electrical Power Engineering & Solar PV Installation",
      yearsExperience: 3,
      employmentStatus: "Independent Artisan / Tradesperson",
      monthlyIncomeBracket: "$151 - $300 / mo",
      hasDedicatedLaptop: false,
      primaryDevice: "Smartphone Only",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 6,
      hasGlobalPaymentRail: false,
      primaryGoal: "Vocational & Clean Energy Trades",
      currentSkills: [
        "Solar PV Inverter Wiring",
        "Single-Phase Circuits",
        "System Sizing",
        "Battery Maintenance",
      ],
    },
  },
  {
    label: "Kudzai (O-Level School Leaver, Micro-Work, Chinhoyi)",
    profile: {
      fullName: "Kudzai Marufu",
      email: "kudzai.marufu@example.co.zw",
      phone: "+263 71 882 1144",
      city: "Chinhoyi",
      highestQualification: "O-Level / Secondary Leaver",
      fieldOfStudy: "General Secondary Sciences & English (O-Levels)",
      yearsExperience: 0,
      employmentStatus: "Unemployed",
      monthlyIncomeBracket: "$0 (Zero Income)",
      hasDedicatedLaptop: false,
      primaryDevice: "Smartphone Only",
      internetAccessType: "WhatsApp Bundles Only",
      powerReliabilityHours: 4,
      hasGlobalPaymentRail: false,
      primaryGoal: "Foundational Digital Skills & Micro-Tasking",
      currentSkills: [
        "Fast Smartphone Typing",
        "Audio Transcription",
        "Shona/English Translation",
      ],
    },
  },
  {
    label: "Vongai (Self-Taught Motion Graphics & UI, Gweru)",
    profile: {
      fullName: "Vongai Mupandawana",
      email: "vongai.design@example.co.zw",
      phone: "+263 78 555 7711",
      city: "Gweru",
      highestQualification: "Self-Taught / Practical Experience",
      fieldOfStudy: "Digital Media, Motion Graphics & Visual Branding",
      yearsExperience: 2,
      employmentStatus: "Survival Gig (Misaligned)",
      monthlyIncomeBracket: "$1 - $150 / mo",
      hasDedicatedLaptop: true,
      primaryDevice: "Dedicated Laptop / PC",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 5,
      hasGlobalPaymentRail: false,
      primaryGoal: "Creative, Media & Freelance Services",
      currentSkills: [
        "Adobe Photoshop",
        "CapCut & Premiere Pro",
        "Figma UI Basics",
        "Social Media Ads",
      ],
    },
  },
];

export default function AssessmentAndPathwayPage() {
  const [profile, setProfile] = useState<CandidateProfile>(
    PRESET_PERSONAS[0].profile
  );
  const [skillInput, setSkillInput] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({
    domainProblemSolving: 85,
    digitalTools: 70,
    asyncWorkflow: 75,
    clientComms: 80,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    assessment: SkillsAssessmentResult;
    pathway: AICareerPathway;
  } | null>(null);
  const [coachSessionBooked, setCoachSessionBooked] = useState(false);

  async function handleGeneratePathway(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCoachSessionBooked(false);
    try {
      const res = await fetch("/api/pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, quizAnswers }),
      });
      const data = await res.json();
      if (data.assessment && data.pathway) {
        setResult(data);
      }
    } catch (err) {
      console.error("Failed to generate pathway:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddSkill() {
    if (!skillInput.trim()) return;
    if (!profile.currentSkills.includes(skillInput.trim())) {
      setProfile({
        ...profile,
        currentSkills: [...profile.currentSkills, skillInput.trim()],
      });
    }
    setSkillInput("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Tasks #1, #2 & #3 — Candidate Intake, Diagnostic & Gemini AI Coach Bridge
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Smart Candidate Intake, Readiness Diagnostic & AI Career Bridge
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Test our end-to-end economic mobility flow. Load a realistic Zimbabwe
          survey persona below or enter custom details, complete the readiness
          diagnostic, and generate a personalized{" "}
          <strong>Gemini AI Upskilling Roadmap</strong> paired with a{" "}
          <strong>Local Partner Hub</strong> and{" "}
          <strong>Human Industry Coach</strong>.
        </p>
      </div>

      {/* Persona Quick-Load Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick-Load Survey Persona (UTARE N=23 Archetypes):
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_PERSONAS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setProfile(p.profile);
                setResult(null);
              }}
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                profile.fullName === p.profile.fullName
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intake & Diagnostic Form */}
      <form
        onSubmit={handleGeneratePathway}
        className="grid gap-8 lg:grid-cols-12"
      >
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Academic & Livelihood Profile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              1. Candidate Credentials & Current Livelihood
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Location in Zimbabwe
                </label>
                <select
                  value={profile.city}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      city: e.target.value as CandidateProfile["city"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Harare">Harare</option>
                  <option value="Bulawayo">Bulawayo</option>
                  <option value="Mutare">Mutare</option>
                  <option value="Gweru">Gweru</option>
                  <option value="Masvingo">Masvingo</option>
                  <option value="Chinhoyi">Chinhoyi</option>
                  <option value="Bindura">Bindura</option>
                  <option value="Marondera">Marondera</option>
                  <option value="Kwekwe">Kwekwe</option>
                  <option value="Victoria Falls">Victoria Falls</option>
                  <option value="Zvishavane">Zvishavane</option>
                  <option value="Growth Point / Rural District">
                    Growth Point / Rural District
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Highest Qualification / Education
                </label>
                <select
                  value={profile.highestQualification}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      highestQualification: e.target
                        .value as CandidateProfile["highestQualification"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Bachelors Degree">Bachelors Degree</option>
                  <option value="Masters Degree">Masters Degree / Postgrad</option>
                  <option value="HND / Higher National Diploma">
                    HND / Higher National Diploma
                  </option>
                  <option value="National Diploma (ND) / TVET / Polytech">
                    National Diploma (ND) / TVET / Polytech
                  </option>
                  <option value="Vocational Trade Certificate (Artisan / Apprenticeship)">
                    Vocational Trade Certificate (Artisan / Apprenticeship)
                  </option>
                  <option value="A-Level / High School Leaver">
                    A-Level / High School Leaver
                  </option>
                  <option value="O-Level / Secondary Leaver">
                    O-Level / Secondary Leaver
                  </option>
                  <option value="Self-Taught / Practical Experience">
                    Self-Taught / Practical Experience
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trained Field of Study
                </label>
                <input
                  type="text"
                  required
                  value={profile.fieldOfStudy}
                  onChange={(e) =>
                    setProfile({ ...profile, fieldOfStudy: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Work Alignment Status
                </label>
                <select
                  value={profile.employmentStatus}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      employmentStatus: e.target
                        .value as CandidateProfile["employmentStatus"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Unemployed">Unemployed (43.5% cohort)</option>
                  <option value="Survival Gig (Misaligned)">
                    Survival Gig — Completely Misaligned (38.5% cohort)
                  </option>
                  <option value="Partially Aligned Role">
                    Partially Aligned Role (46.2% cohort)
                  </option>
                  <option value="Aligned Discipline Role">
                    Aligned Discipline Role (15.4% cohort)
                  </option>
                  <option value="Self-Employed / Grassroots SME">
                    Self-Employed / Grassroots SME
                  </option>
                  <option value="Informal Trader / Vendor">
                    Informal Trader / Vendor
                  </option>
                  <option value="Independent Artisan / Tradesperson">
                    Independent Artisan / Tradesperson
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Monthly Income (USD)
                </label>
                <select
                  value={profile.monthlyIncomeBracket}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      monthlyIncomeBracket: e.target
                        .value as CandidateProfile["monthlyIncomeBracket"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="$0 (Zero Income)">$0 (Zero Income)</option>
                  <option value="$1 - $150 / mo">$1 - $150 / mo</option>
                  <option value="$151 - $300 / mo">$151 - $300 / mo</option>
                  <option value="$300+ / mo">$300+ / mo</option>
                </select>
              </div>
            </div>

            {/* Skills tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verified & Self-Reported Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a skill (e.g. Python, Financial Modeling, Copywriting)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.currentSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          currentSkills: profile.currentSkills.filter(
                            (s) => s !== skill
                          ),
                        })
                      }
                      className="ml-1 text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Infrastructure Constraints */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Last-Mile Infrastructure & Payment Constraints
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Computing Device
                </label>
                <select
                  value={profile.primaryDevice}
                  onChange={(e) => {
                    const val = e.target
                      .value as CandidateProfile["primaryDevice"];
                    setProfile({
                      ...profile,
                      primaryDevice: val,
                      hasDedicatedLaptop: val === "Dedicated Laptop / PC",
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Smartphone Only">
                    Smartphone Only (Needs Hub Workstation)
                  </option>
                  <option value="Feature Phone / Shared Community Phone">
                    Feature Phone / Shared Community Phone
                  </option>
                  <option value="Shared / Borrowed PC">
                    Shared / Borrowed PC
                  </option>
                  <option value="Dedicated Laptop / PC">
                    Dedicated Laptop / PC
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Internet Access
                </label>
                <select
                  value={profile.internetAccessType}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      internetAccessType: e.target
                        .value as CandidateProfile["internetAccessType"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="WhatsApp Bundles Only">
                    WhatsApp Bundles Only (Lowest Data)
                  </option>
                  <option value="Mobile Data Bundles Only">
                    Mobile Data Bundles Only
                  </option>
                  <option value="Intermittent / Cafe Only">
                    Intermittent / Internet Cafe
                  </option>
                  <option value="Home Fiber / Wi-Fi">Home Fiber / Wi-Fi</option>
                  <option value="Starlink">Starlink</option>
                  <option value="No Internet Access at Home">
                    No Internet Access at Home
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reliable Electricity Hours / Day ({profile.powerReliabilityHours}h)
                </label>
                <input
                  type="range"
                  min={2}
                  max={24}
                  value={profile.powerReliabilityHours}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      powerReliabilityHours: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Mobility Objective
                </label>
                <select
                  value={profile.primaryGoal}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      primaryGoal: e.target
                        .value as CandidateProfile["primaryGoal"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="International Remote Work">
                    International Remote Work (USD Global Contracts)
                  </option>
                  <option value="Local Formal Career">
                    Local Formal Discipline Career
                  </option>
                  <option value="Scale Grassroots Venture">
                    Scale Grassroots SME Venture
                  </option>
                  <option value="Vocational & Clean Energy Trades">
                    Vocational & Clean Energy Trades (Solar, Electrical)
                  </option>
                  <option value="Creative, Media & Freelance Services">
                    Creative, Media & Freelance Services (Design, Video)
                  </option>
                  <option value="Agribusiness & Farm Commercialization">
                    Agribusiness & Farm Commercialization
                  </option>
                  <option value="Foundational Digital Skills & Micro-Tasking">
                    Foundational Digital Skills & Micro-Tasking
                  </option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                id="payment-rail"
                type="checkbox"
                checked={profile.hasGlobalPaymentRail}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    hasGlobalPaymentRail: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <label
                htmlFor="payment-rail"
                className="text-xs font-medium text-slate-700"
              >
                Candidate already has a verified international payment rail
                (Deel, Payoneer, Wise, or USD Nostro)
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Competency Diagnostic Sliders + Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">
              3. Readiness & Competency Diagnostic (Task #2)
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates practical problem-solving, digital workspace fluency,
              and asynchronous communication readiness.
            </p>

            {[
              {
                key: "domainProblemSolving",
                label: "Applied Domain & Analytical Problem Solving",
              },
              {
                key: "digitalTools",
                label: "Cloud Workspace & AI Productivity Tools",
              },
              {
                key: "asyncWorkflow",
                label: "Asynchronous Documentation & Self-Management",
              },
              {
                key: "clientComms",
                label: "Professional Written & Executive Communication",
              },
            ].map((q) => (
              <div key={q.key} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{q.label}</span>
                  <span className="text-emerald-700">
                    {quizAnswers[q.key]} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={quizAnswers[q.key]}
                  onChange={(e) =>
                    setQuizAnswers({
                      ...quizAnswers,
                      [q.key]: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-600"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {loading
                ? "Analyzing Profile & Generating AI Pathway..."
                : "Generate AI Career Pathway & Coach Pairing"}
            </button>
          </div>
        </div>
      </form>

      {/* GENERATED OUTPUT: Diagnostic Scores + AI Pathway + Hub + Human Coach */}
      {result && (
        <section className="space-y-8 pt-6 border-t border-slate-200">
          {/* Score Cards */}
          <div className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Diagnostic Complete • {result.pathway.generatedBy === "gemini-live" ? "Live Gemini AI Model" : "Utare Mobility Engine"}
                </span>
                <h2 className="text-2xl font-extrabold mt-1">
                  {result.pathway.recommendedTrack}
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-4 py-1.5 text-xs font-bold text-emerald-300">
                Readiness Tier: {result.assessment.readinessTier}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 p-4">
              <div className="text-xs text-emerald-200">
                ✓ Profile, Assessment, AI Pathway, Coach Pairing & Hub Match
                saved to your connected workspace!
              </div>
              <Link
                href="/pathway"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                Open Interactive Pathway & Coaching Tracker{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {result.pathway.executiveDiagnosis}
            </p>

            <div className="grid gap-4 sm:grid-cols-4">
              {[
                {
                  label: "Domain Competency",
                  score: result.assessment.domainCompetencyScore,
                },
                {
                  label: "Digital Readiness",
                  score: result.assessment.digitalReadinessScore,
                },
                {
                  label: "Remote Literacy",
                  score: result.assessment.remoteWorkLiteracyScore,
                },
                {
                  label: "Infrastructure Index",
                  score: result.assessment.infrastructureIndexScore,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl bg-slate-800/90 border border-slate-700 p-4"
                >
                  <div className="text-xs text-slate-400">{s.label}</div>
                  <div className="mt-1 text-2xl font-extrabold text-emerald-400">
                    {s.score}
                    <span className="text-xs font-normal text-slate-400">
                      /100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Human Coach Pairing + Local Partner Hub Match */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Human Coach Pairing Card (Task #3 Core Requirement) */}
            <div className="rounded-2xl border-2 border-emerald-600/30 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <UserCheck className="h-4 w-4" /> Paired Human Industry Coach
                </span>
                <span className="text-xs text-slate-500">
                  {result.pathway.assignedCoach.city} •{" "}
                  {result.pathway.assignedCoach.availableSlotsWeekly} weekly
                  slots
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {result.pathway.assignedCoach.fullName}
                </h3>
                <p className="text-xs font-semibold text-emerald-700">
                  {result.pathway.assignedCoach.title} —{" "}
                  {result.pathway.assignedCoach.organization}
                </p>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {result.pathway.assignedCoach.bio}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Structured 1-on-1 Coaching Touchpoints:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {result.pathway.coachingAgenda.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {coachSessionBooked ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  1-on-1 Onboarding Session requested with{" "}
                  {result.pathway.assignedCoach.fullName}! Your AI roadmap has
                  been shared with your coach.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCoachSessionBooked(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Calendar className="h-4 w-4" />
                  Confirm 1-on-1 Coaching Pairing with{" "}
                  {result.pathway.assignedCoach.fullName}
                </button>
              )}
            </div>

            {/* Infrastructure Bridge + Hub Assignment Card (Task #4 Integration) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                  <Building2 className="h-4 w-4" /> Last-Mile Infrastructure
                  Bridge
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  Utare Subsidized Partner Pass
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {result.pathway.recommendedHub.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {result.pathway.recommendedHub.address} •{" "}
                  {result.pathway.recommendedHub.operatingHours}
                </p>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5">
                {result.pathway.infrastructureBridgePlan}
              </p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-xs font-bold text-slate-900">
                    {result.pathway.recommendedHub.avgSpeedMbps} Mbps
                  </div>
                  <div className="text-[11px] text-slate-500">Starlink/Fiber</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-xs font-bold text-slate-900">
                    100% Solar
                  </div>
                  <div className="text-[11px] text-slate-500">ZESA Backup</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-xs font-bold text-slate-900">
                    {result.pathway.recommendedHub.availableWorkstations} Desks
                  </div>
                  <div className="text-[11px] text-slate-500">PC Access</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 space-y-1">
                <div className="text-xs font-bold text-slate-800">
                  Cross-Border Payment Rail Prescription:
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {result.pathway.paymentRailGuidance}
                </p>
              </div>
            </div>
          </div>

          {/* 3-Phase AI Upskilling Roadmap */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-900">
              Personalized 8-Week Upskilling & Competency Verification Roadmap
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {result.pathway.upskillingMilestones.map((m) => (
                <div
                  key={m.phase}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700">
                      {m.phase}
                    </span>
                    {m.lowBandwidthFriendly && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Offline / Low-Data Ready
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.objective}
                  </p>
                  <div className="pt-1 border-t border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800">
                      Verified Deliverable:{" "}
                    </span>
                    <span className="text-slate-600">{m.deliverable}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target Roles & AI-Tailored Remote Resume Summary */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Matched International Remote Roles
              </h3>
              <div className="space-y-3">
                {result.pathway.targetRemoteRoles.map((role) => (
                  <div
                    key={role.role}
                    className="rounded-xl border border-slate-200 p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {role.role}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {role.estimatedMonthlyUsd}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{role.matchReason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">
                  AI-Tailored International Remote Resume Profile
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Optimized for global remote ATS filters, highlighting GMT+2
                timezone overlap and verified Partner Hub power/internet
                reliability:
              </p>
              <div className="rounded-xl bg-slate-900 p-4 text-xs text-slate-200 leading-relaxed font-mono">
                {result.pathway.tailoredResumeSummary}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
