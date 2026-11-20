"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useViewMode } from "@/lib/view-mode-context";
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
  Briefcase,
} from "lucide-react";

import { PRESET_PERSONAS } from "@/lib/mock-data";
import ZimbabweCitySelect from "@/components/ZimbabweCitySelect";

const DIAGNOSTIC_QUESTIONS = [
  { key: "clientComms", label: "1. English Proficiency & Professional Communication" },
  { key: "digitalTools", label: "2. Digital Literacy (Cloud Workspace, Spreadsheets, Slack)" },
  { key: "domainProblemSolving", label: "3. Applied Domain & Analytical Problem Solving" },
  { key: "asyncWorkflow", label: "4. Asynchronous Documentation & Task Organization" },
  { key: "internetAccess", label: "5. Internet Stability & Digital Navigation" },
  { key: "workExperience", label: "6. Previous Work, Gig, or Practical Hustle Experience" },
];

const EMPTY_CANDIDATE_PROFILE: CandidateProfile = {
  fullName: "",
  email: "",
  phone: "",
  city: "Harare",
  highestQualification: "Bachelors Degree",
  fieldOfStudy: "",
  yearsExperience: 0,
  canWorkRemotely: undefined,
  hubSupportNeed: "Hybrid Hub Backup (Need Power/Wi-Fi Backup During Outages)",
  hasDedicatedLaptop: false,
  primaryDevice: "Smartphone Only",
  internetAccessType: "Mobile Data Bundles Only",
  powerReliabilityHours: 6,
  hasGlobalPaymentRail: false,
  primaryGoal: "International Remote Work",
  currentSkills: [],
};

export default function AssessmentAndPathwayPage() {
  const { user, isAdmin, isEmployer, isHub } = useViewMode();
  const [profile, setProfile] = useState<CandidateProfile>(
    EMPTY_CANDIDATE_PROFILE
  );

  useEffect(() => {
    if (user && user.role === "candidate") {
      setProfile((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        city: (user.city as any) || prev.city,
        highestQualification:
          (user.qualification as any) || prev.highestQualification,
        fieldOfStudy: user.fieldOfStudy || prev.fieldOfStudy,
      }));
      fetch("/api/auth/profile", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data.candidate?.profile) {
            setProfile(data.candidate.profile);
          }
        })
        .catch(() => {});
    }
  }, [user]);
  const [skillInput, setSkillInput] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({
    clientComms: 0,
    digitalTools: 0,
    domainProblemSolving: 0,
    asyncWorkflow: 0,
    internetAccess: 0,
    workExperience: 0,
  });
  // Tracks which diagnostic sliders the candidate has actually rated,
  // so a deliberate 0 is distinguishable from "not answered yet".
  const [ratedKeys, setRatedKeys] = useState<Set<string>>(new Set());
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [formError, setFormError] = useState("");

  // Restore locally saved draft on mount (resilient to power/data cuts)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("utare_assessment_draft_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.profile) {
          setProfile((prev) => ({ ...prev, ...parsed.profile }));
        }
        if (parsed.quizAnswers) {
          setQuizAnswers((prev) => ({ ...prev, ...parsed.quizAnswers }));
        }
        if (Array.isArray(parsed.ratedKeys)) {
          setRatedKeys(new Set(parsed.ratedKeys));
        }
        setDraftSaved(true);
      }
    } catch {}
    setDraftHydrated(true);
  }, []);

  // Auto-save draft locally whenever form inputs change
  useEffect(() => {
    if (!draftHydrated) return;
    try {
      localStorage.setItem(
        "utare_assessment_draft_v1",
        JSON.stringify({
          profile,
          quizAnswers,
          ratedKeys: Array.from(ratedKeys),
          savedAt: new Date().toISOString(),
        })
      );
      setDraftSaved(true);
    } catch {}
  }, [profile, quizAnswers, ratedKeys, draftHydrated]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    assessment: SkillsAssessmentResult;
    pathway: AICareerPathway;
  } | null>(null);
  const [coachSessionBooked, setCoachSessionBooked] = useState(false);

  async function handleGeneratePathway(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const unrated = DIAGNOSTIC_QUESTIONS.filter((q) => !ratedKeys.has(q.key));
    if (unrated.length > 0) {
      setFormError(
        `Please rate all ${DIAGNOSTIC_QUESTIONS.length} readiness questions in section 3 (${unrated.length} remaining).`
      );
      return;
    }

    setLoading(true);
    setCoachSessionBooked(false);
    try {
      const res = await fetch("/api/pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, quizAnswers }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.assessment && data.pathway) {
        setResult(data);
      } else {
        setFormError(data.error || "We couldn't generate your pathway. Please try again.");
      }
    } catch (err) {
      console.error("Failed to generate pathway:", err);
      setFormError("Network error — please check your connection and try again.");
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

  if (isEmployer || isHub) {
    const portalHref = isEmployer ? "/employer" : "/hub-portal";
    const portalLabel = isEmployer ? "Go to Employer Portal" : "Go to Hub Portal";
    return (
      <div className="w-full min-h-screen">
        <PageBreadcrumb current="Diagnostic" />
        <div className="mx-auto max-w-lg py-20 px-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 shadow-sm">
            {isEmployer ? (
              <Briefcase className="h-8 w-8 text-blue-700" />
            ) : (
              <Building2 className="h-8 w-8 text-teal-700" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEmployer
              ? "Employer Account — Candidate Diagnostic"
              : "Partner Hub Account — Candidate Diagnostic"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isEmployer
              ? "The 6-Factor Skills Diagnostic is for candidates onboarding onto UTARE. Manage your open roles and review verified candidates in the Employer Portal."
              : "The 6-Factor Skills Diagnostic is for candidates onboarding onto UTARE. Manage your hub workstations and team in the Hub Portal."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href={portalHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#08785f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#06634e] transition"
            >
              {portalLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <PageBreadcrumb current="Diagnostic" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {isAdmin
            ? "Facilitator Console — Intake, Diagnostic & AI Pathway Synthesis"
            : "Candidate Intake & Skills Diagnostic"}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAdmin
            ? "Candidate Intake & Diagnostic — Facilitator Console"
            : "Candidate Intake, Readiness Diagnostic & Career Bridge"}
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">
          {isAdmin ? (
            <>
              Evaluate the end-to-end economic mobility pipeline. Select a
              Zimbabwean survey archetype below to test different candidate
              backgrounds and generate a personalized AI upskilling roadmap.
            </>
          ) : (
            <>
              Complete your profile and readiness diagnostic to generate your
              personalized <strong>AI Career Pathway</strong> paired with a{" "}
              <strong>Local Partner Innovation Hub</strong> and a dedicated{" "}
              <strong>Human Industry Coach</strong>.
            </>
          )}
        </p>
      </div>

      {/* Persona Quick-Load Bar (Admin / Facilitator Console only) */}
      {isAdmin && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              🛠️ Facilitator Console: Quick-Load Demographic Archetypes:
            </span>
            <span className="text-[0.78rem] font-medium text-amber-800">
              Hidden from candidate view
            </span>
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
                    ? "border-emerald-600 bg-emerald-700 text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Intake & Diagnostic Form */}
      <form
        onSubmit={handleGeneratePathway}
        className="grid gap-8 lg:grid-cols-12"
      >
        <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Academic & Practical Skills Profile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                1. Candidate Credentials &amp; Skills
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {draftSaved && (
                  <span className="text-[0.78rem] font-medium text-sky-800 bg-sky-50 border border-sky-200 rounded-full px-2.5 py-0.5">
                    Draft Saved on Device
                  </span>
                )}
                <span className="text-[0.78rem] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  Minimal Data Only
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              We only ask what is needed to match your skills and check whether you can work remotely on your own or need a Partner Hub.
            </p>

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

              <ZimbabweCitySelect
                value={profile.city}
                onChange={(city) =>
                  setProfile({
                    ...profile,
                    city,
                  })
                }
                label="City / Location in Zimbabwe"
              />

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
                  Trained Field / Practical Area
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

          {/* Card 2: Remote Capability & Hub Independence */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Remote Work Capability &amp; Hub Independence
            </h2>
            <p className="text-xs text-slate-500">
              Helps determine whether you can work remotely independently or need full/backup access to a solar-powered Partner Innovation Hub.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Can you do remote work from where you are today?
                </label>
                <select
                  value={
                    profile.canWorkRemotely === true
                      ? "yes"
                      : profile.canWorkRemotely === false
                      ? "no"
                      : "partial"
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setProfile({
                      ...profile,
                      canWorkRemotely: v === "yes" ? true : v === "no" ? false : undefined,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="yes">Yes — I can work remotely on my own</option>
                  <option value="partial">Partially — I need occasional backup power/Wi-Fi</option>
                  <option value="no">No — I need a Partner Hub workstation &amp; internet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Do you need a Partner Hub or are you fine by yourself?
                </label>
                <select
                  value={
                    profile.hubSupportNeed ||
                    "Hybrid Hub Backup (Need Power/Wi-Fi Backup During Outages)"
                  }
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      hubSupportNeed: e.target
                        .value as CandidateProfile["hubSupportNeed"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Fully Independent (Have Reliable Device, Power & Internet)">
                    Fine by myself (Fully independent setup)
                  </option>
                  <option value="Hybrid Hub Backup (Need Power/Wi-Fi Backup During Outages)">
                    Backup only (Hub needed during outages)
                  </option>
                  <option value="Full Hub Access Needed (Need Workstation, Solar Power & Internet)">
                    Fully need a Hub (Workstation, power &amp; internet)
                  </option>
                </select>
              </div>
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

            <p className="text-[0.78rem] text-slate-500">
              Rate yourself from 0 (no experience) to 100 (expert). Rated{" "}
              <strong>{ratedKeys.size}</strong> of {DIAGNOSTIC_QUESTIONS.length}.
            </p>

            {DIAGNOSTIC_QUESTIONS.map((q) => {
              const rated = ratedKeys.has(q.key);
              const markRated = () =>
                setRatedKeys((prev) => (prev.has(q.key) ? prev : new Set(prev).add(q.key)));
              return (
                <div key={q.key} className="space-y-1">
                  <div className="flex justify-between gap-3 text-xs font-semibold text-slate-700">
                    <label htmlFor={`diag-${q.key}`}>{q.label}</label>
                    <span className={`shrink-0 ${rated ? "text-emerald-700" : "text-slate-400"}`}>
                      {rated ? `${quizAnswers[q.key]} / 100` : "Not rated"}
                    </span>
                  </div>
                  <input
                    id={`diag-${q.key}`}
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={quizAnswers[q.key]}
                    onChange={(e) => {
                      markRated();
                      setQuizAnswers((prev) => ({
                        ...prev,
                        [q.key]: Number(e.target.value),
                      }));
                    }}
                    onPointerUp={markRated}
                    onKeyUp={markRated}
                    className="w-full accent-emerald-600"
                  />
                </div>
              );
            })}

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

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

          {/* Clear AI Qualification Breakdown (Baraza) */}
          {result.assessment.qualificationBreakdown && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Qualification Decision: Why You Qualify or Don&apos;t Yet Qualify
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transparent breakdown of your current tier ({result.assessment.readinessTier}) and overall score ({result.assessment.overallScore}/100).
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Request Human Coach Review →
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <div className="text-xs font-bold text-emerald-900">
                    ✓ What You Currently Qualify For
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-emerald-950">
                    {result.assessment.qualificationBreakdown.qualifiedFor.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <div className="text-xs font-bold text-amber-950">
                    {result.assessment.qualificationBreakdown.notQualifiedYetFor.length > 0
                      ? `Why You Do Not Yet Qualify For: ${result.assessment.qualificationBreakdown.notQualifiedYetFor.join(", ")}`
                      : "Qualification Threshold Status"}
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-amber-950">
                    {result.assessment.qualificationBreakdown.reasonsNotQualified.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  {result.assessment.qualificationBreakdown.howToQualify.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/70">
                      <div className="text-[0.78rem] font-bold text-amber-900 mb-1">
                        How to Qualify:
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[0.78rem] text-amber-900">
                        {result.assessment.qualificationBreakdown.howToQualify.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[0.78rem] text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-200">
                {result.assessment.qualificationBreakdown.aiRoleNotice}
              </p>
            </div>
          )}

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
                  <div className="text-[0.78rem] text-slate-500">Starlink/Fiber</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-xs font-bold text-slate-900">
                    100% Solar
                  </div>
                  <div className="text-[0.78rem] text-slate-500">ZESA Backup</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-xs font-bold text-slate-900">
                    {result.pathway.recommendedHub.availableWorkstations} Desks
                  </div>
                  <div className="text-[0.78rem] text-slate-500">PC Access</div>
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
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[0.72rem] font-semibold text-emerald-800">
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

          {/* Next Steps in Candidate Workflow */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Ready to Apply with Your Grounded Profile?
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Your diagnostic results and hub voucher are saved to your workspace. Explore verified remote roles and generate a tailored ATS CV now.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
              >
                My Workspace →
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-sm"
              >
                <Briefcase className="h-4 w-4" />
                Browse Remote Roles & Tailor CV →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
    </div>
  );
}
