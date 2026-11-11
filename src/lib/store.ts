// =============================================================================
// UTARE ZISEDU AI — Unified Persistent Data Store (Local JSON + Supabase Sync)
// =============================================================================
// Provides an out-of-the-box end-to-end stateful backend for all 5 MVP modules.
// - Automatically persists to `.data/utare-store.json` so data survives page
//   navigation and server restarts inside the Docker container.
// - Syncs with Supabase PostgreSQL tables when credentials are provided.
// =============================================================================

import fs from "fs";
import path from "path";
import {
  AICareerPathway,
  CandidateProfile,
  CoachProfile,
  ContactMessage,
  EmployerRegistration,
  InnovationHub,
  RemoteJob,
  SkillsAssessmentResult,
  SkillsCourse,
} from "@/types";
import {
  SEED_COACHES,
  SEED_INNOVATION_HUBS,
  SEED_REMOTE_JOBS,
  SEED_SKILLS_COURSES,
} from "@/lib/mock-data";
import { query } from "@/lib/db";

export interface StoredCandidateRecord {
  id: string;
  profile: CandidateProfile;
  assessment: SkillsAssessmentResult;
  pathway: AICareerPathway;
  completedMilestones: string[];
  coachingStatus: "Pending Booking" | "Session Confirmed";
  coachingPreferredDate?: string;
  bookedHubDesk?: {
    hubId: string;
    hubName: string;
    bookedAt: string;
  };
  createdAt: string;
}

export interface JobApplicationRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  tailoredResumePitch: string;
  appliedAt: string;
}

export const SEED_DEMO_CANDIDATE: StoredCandidateRecord = {
  id: "cand-tatenda-01",
  profile: {
    fullName: "Tatenda Moyo",
    email: "demo@utaresizedu.ai",
    phone: "+263 77 210 9876",
    city: "Harare",
    highestQualification: "Bachelors Degree",
    fieldOfStudy: "BSc Computer Science",
    yearsExperience: 2,
    employmentStatus: "Survival Gig (Misaligned)",
    monthlyIncomeBracket: "$1 - $150 / mo",
    hasDedicatedLaptop: true,
    primaryDevice: "Dedicated Laptop / PC",
    internetAccessType: "Mobile Data Bundles Only",
    powerReliabilityHours: 6,
    hasGlobalPaymentRail: false,
    primaryGoal: "International Remote Work",
    currentSkills: [
      "Python",
      "SQL",
      "Data Analysis",
      "Async Communication",
      "Git",
      "Technical Documentation",
    ],
  },
  assessment: {
    domainCompetencyScore: 88,
    digitalReadinessScore: 82,
    remoteWorkLiteracyScore: 85,
    infrastructureIndexScore: 54,
    overallScore: 77,
    readinessTier: "Market-Ready (Direct Placement)",
    strengths: [
      "BSc in Computer Science provides strong computational & data analysis foundation",
      "High software architecture and asynchronous problem-solving literacy",
      "Direct hands-on experience with Python, SQL, and database modeling",
    ],
    criticalGaps: [
      "Power Reliability Bottleneck: 6 hours/day ZESA grid availability interrupts international client sprints",
      "Payment Rail Lockout: Unbanked for global USD direct deposit (needs Deel & Payoneer USD Nostro bridge)",
      "International Portfolio Repackaging: Academic degree projects need conversion into verified GitHub case studies",
    ],
  },
  pathway: {
    recommendedTrack: "Global Technical Operations, AI QA & Automation Engineering Track",
    executiveDiagnosis: "Tatenda Moyo holds a Bachelors Degree in BSc Computer Science (Domain Score: 88/100), yet is currently engaged in misaligned informal work earning under $150/month. With dedicated workstation continuity and cross-border payment rails, Tatenda is primed for international remote technical operations roles earning $950–$1,600/month.",
    infrastructureBridgePlan: "Priority Hardware & Power Bridge: Enrolled at Impact Hub Harare — Utare Node (142 Kwame Nkrumah Ave, Avenues, Harare) for 100% solar power backup during load-shedding and 185 Mbps Starlink business connectivity.",
    recommendedHub: SEED_INNOVATION_HUBS[0],
    assignedCoach: SEED_COACHES[0],
    coachingAgenda: [
      "Session 1 (Week 1) with Tariro Moyo: Audit BSc Computer Science degree projects and convert them into 2 production-ready asynchronous GitHub case studies.",
      "Session 2 (Week 3): Set up compliant cross-border payment rails (Deel + Payoneer + local USD Nostro account) and verify international tax compliance.",
      "Session 3 (Week 6): Conduct mock technical interview for EMEA-based distributed teams and deliver warm referrals to verified hiring partners.",
    ],
    upskillingMilestones: [
      {
        phase: "Phase 1 (Weeks 1–2)",
        durationWeeks: 2,
        title: "Async Remote Workflows & Production GitHub Portfolio",
        objective: "Master international remote communication norms, Notion/Linear documentation, and clean GitHub repository standards.",
        deliverable: "Published GitHub Portfolio with Live Architecture Case Studies",
        resources: [
          "GitLab Remote Handbook (Offline PDF Bundle)",
          "Utare Async Operations Lab (Hub Workstation Module)",
        ],
        lowBandwidthFriendly: true,
      },
      {
        phase: "Phase 2 (Weeks 3–5)",
        durationWeeks: 3,
        title: "Applied AI Automation, Data Pipelines & Technical Support",
        objective: "Bridge computer science theory into modern asynchronous cloud tooling, Gemini API integration, and automated CI/CD workflows.",
        deliverable: "End-to-End Automated Data Synthesis Pipeline & Verification Suite",
        resources: [
          "Utare Competency Sandbox (Hosted at Local Partner Hub)",
          "Gemini Prompt Engineering & Verification Curriculum",
        ],
        lowBandwidthFriendly: true,
      },
      {
        phase: "Phase 3 (Weeks 6–8)",
        durationWeeks: 3,
        title: "Global Payment Onboarding & Direct Market Placement",
        objective: "Eliminate the 86.4% payment rail lockout and submit tailored applications to vetted international remote hiring partners.",
        deliverable: "Active Deel/Payoneer Contractor Profile + 5 Tailored Remote Applications",
        resources: [
          "1-on-1 Coaching Review with Tariro Moyo",
          "Utare Verified Remote Employer Fast-Track Feed",
        ],
        lowBandwidthFriendly: false,
      },
    ],
    targetRemoteRoles: [
      {
        role: "Global Technical Operations & Automation Associate",
        estimatedMonthlyUsd: "$1,100 – $1,650 / mo",
        matchReason: "Direct match for Zimbabwe's GMT+2 timezone with UK/EU engineering teams seeking degreed technical operators.",
      },
      {
        role: "AI Data QA & Technical Annotation Specialist",
        estimatedMonthlyUsd: "$950 – $1,400 / mo",
        matchReason: "High-volume demand for degreed computer science graduates to evaluate LLM technical outputs asynchronously.",
      },
    ],
    paymentRailGuidance: "Step 1: Open a zero-balance USD Individual Nostro account using national ID and Utare proof of enrollment. Step 2: Register on Deel and Payoneer using valid ID/passport to receive direct USD ACH/wire deposits from UK/US remote clients.",
    tailoredResumeSummary: "Execution-oriented Bachelors Degree graduate in BSc Computer Science based in Harare, Zimbabwe (GMT+2 / EMEA overlap). Proven ability to build Python/SQL automation pipelines, write clear technical documentation, and collaborate asynchronously. Backed by Utare ZISEDU AI Partner Hub infrastructure with solar power and Starlink connectivity for zero-downtime remote delivery.",
    generatedBy: "utare-deterministic-engine",
  },
  completedMilestones: ["Phase 1 (Weeks 1–2)"],
  coachingStatus: "Session Confirmed",
  coachingPreferredDate: "Upcoming Tuesday · 10:00 CAT (GMT+2)",
  bookedHubDesk: {
    hubId: "hub-hre-01",
    hubName: "Impact Hub Harare — Utare Node",
    bookedAt: "2026-11-10T12:00:00.000Z",
  },
  createdAt: "2026-11-10T12:00:00.000Z",
};

export interface UtareDatabaseState {
  activeCandidateId: string | null;
  candidates: StoredCandidateRecord[];
  hubs: InnovationHub[];
  coaches: CoachProfile[];
  jobs: RemoteJob[];
  applications: JobApplicationRecord[];
  employerRegistrations: EmployerRegistration[];
  skillsCourses: SkillsCourse[];
  contactMessages: ContactMessage[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "utare-store.json");

function createInitialState(): UtareDatabaseState {
  return {
    activeCandidateId: null,
    candidates: [SEED_DEMO_CANDIDATE],
    hubs: [...SEED_INNOVATION_HUBS],
    coaches: [...SEED_COACHES],
    jobs: [...SEED_REMOTE_JOBS],
    applications: [],
    employerRegistrations: [],
    skillsCourses: [...SEED_SKILLS_COURSES],
    contactMessages: [],
  };
}

let inMemoryStore: UtareDatabaseState | null = null;

export function readStore(): UtareDatabaseState {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8").trim();
      if (raw.length > 0) {
        const parsed = JSON.parse(raw) as UtareDatabaseState;
        const merged: UtareDatabaseState = {
          ...createInitialState(),
          ...parsed,
        };
        const hasDemo = merged.candidates.some(
          (c) =>
            c.profile.email.trim().toLowerCase() === "demo@utaresizedu.ai" ||
            c.profile.email.trim().toLowerCase() === "tatenda.moyo@example.co.zw"
        );
        if (!hasDemo) {
          merged.candidates.unshift(SEED_DEMO_CANDIDATE);
        }
        inMemoryStore = merged;
        return merged;
      }
    }
  } catch (err) {
    if (inMemoryStore) {
      return inMemoryStore;
    }
    console.warn("[Utare Store] Failed to read store file, using seed:", err);
  }
  const initial = inMemoryStore || createInitialState();
  inMemoryStore = initial;
  return initial;
}

export function findCandidateByEmail(email?: string | null): StoredCandidateRecord | null {
  if (!email) return null;
  const state = readStore();
  const normalized = email.trim().toLowerCase();
  if (normalized === "demo@utaresizedu.ai" || normalized === "tatenda.moyo@example.co.zw") {
    const found = state.candidates.find(
      (c) =>
        c.profile.email.trim().toLowerCase() === "demo@utaresizedu.ai" ||
        c.profile.email.trim().toLowerCase() === "tatenda.moyo@example.co.zw"
    );
    return found || SEED_DEMO_CANDIDATE;
  }
  return state.candidates.find((c) => c.profile.email.trim().toLowerCase() === normalized) || null;
}

export function writeStore(state: UtareDatabaseState): UtareDatabaseState {
  inMemoryStore = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized = JSON.stringify(state, null, 2);
    const tmpFile = `${STORE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, serialized, "utf-8");
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.warn("[Utare Store] Non-fatal write warning:", err);
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch {
      // Ignore fallback error
    }
  }
  return state;
}

// =============================================================================
// PostgreSQL Asynchronous Sync Helpers
// =============================================================================

function syncCandidateToPostgres(profile: CandidateProfile) {
  const fullName = profile.fullName || (profile as unknown as { name?: string }).name || "Candidate";
  const email = (profile.email || "").trim().toLowerCase();
  if (!email) return;

  const phone = profile.phone || "";
  const city = profile.city || "Harare";
  const qual = profile.highestQualification || "Bachelors Degree";
  const field = profile.fieldOfStudy || "Tertiary Graduate";
  const exp = profile.yearsExperience || 0;
  const empStatus = profile.employmentStatus || "Seeking Remote Employment";
  const income = profile.monthlyIncomeBracket || "$0 - No Income";
  const hasLaptop = Boolean(profile.hasDedicatedLaptop);
  const device =
    profile.primaryDevice || (hasLaptop ? "Dedicated Laptop / PC" : "Smartphone Only");
  const internet = profile.internetAccessType || "Mobile Data Bundles";
  const power = profile.powerReliabilityHours || 6;
  const paymentRail = Boolean(profile.hasGlobalPaymentRail);
  const goal = profile.primaryGoal || "International Remote Work";

  query(
    `INSERT INTO public.candidate_profiles (
       full_name, email, phone, city,
       highest_qualification, field_of_study, years_experience,
       employment_status, monthly_income_bracket,
       has_dedicated_laptop, primary_device, internet_access_type,
       power_reliability_hours, has_global_payment_rail, primary_goal,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
     ON CONFLICT (email) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       city = EXCLUDED.city,
       highest_qualification = EXCLUDED.highest_qualification,
       field_of_study = EXCLUDED.field_of_study,
       years_experience = EXCLUDED.years_experience,
       employment_status = EXCLUDED.employment_status,
       monthly_income_bracket = EXCLUDED.monthly_income_bracket,
       has_dedicated_laptop = EXCLUDED.has_dedicated_laptop,
       primary_device = EXCLUDED.primary_device,
       internet_access_type = EXCLUDED.internet_access_type,
       power_reliability_hours = EXCLUDED.power_reliability_hours,
       has_global_payment_rail = EXCLUDED.has_global_payment_rail,
       primary_goal = EXCLUDED.primary_goal,
       updated_at = NOW();`,
    [
      fullName,
      email,
      phone,
      city,
      qual,
      field,
      exp,
      empStatus,
      income,
      hasLaptop,
      device,
      internet,
      power,
      paymentRail,
      goal,
    ]
  ).catch((err: any) => {
    console.warn("[PostgreSQL Candidate Sync Warning]:", err?.message);
  });
}

function syncJobApplicationToPostgres(app: JobApplicationRecord) {
  query(
    `INSERT INTO public.job_applications (id, candidate_id, candidate_name, job_id, job_title, company, tailored_resume_pitch, applied_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      app.id,
      app.candidateId,
      app.candidateName,
      app.jobId,
      app.jobTitle,
      app.company,
      app.tailoredResumePitch,
      app.appliedAt,
    ]
  ).catch((err: any) => {
    console.warn("[PostgreSQL Application Sync Warning]:", err?.message);
  });
}

function syncHubToPostgres(hub: InnovationHub) {
  query(
    `INSERT INTO public.innovation_hubs (name, city, address, has_solar_backup, internet_provider, avg_speed_mbps, available_workstations, laptop_loan_available, daily_pass_usd, utare_partner_subsidized, contact_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT DO NOTHING`,
    [
      hub.name,
      hub.city,
      hub.address,
      hub.hasSolarBackup,
      hub.internetProvider,
      hub.avgSpeedMbps,
      hub.availableWorkstations,
      hub.laptopLoanAvailable,
      hub.dailyPassUsd,
      hub.utarePartnerSubsidized,
      hub.contactEmail,
    ]
  ).catch((err: any) => {
    console.warn("[PostgreSQL Hub Sync Warning]:", err?.message);
  });
}

function syncJobToPostgres(job: RemoteJob) {
  query(
    `INSERT INTO public.remote_jobs (title, company, category, compensation_usd_monthly, supported_payment_rails, required_skills, min_readiness_tier, is_async_friendly, description, application_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT DO NOTHING`,
    [
      job.title,
      job.company,
      job.category,
      job.compensationUsdMonthly,
      job.supportedPaymentRails,
      job.requiredSkills,
      job.minReadinessTier,
      job.isAsyncFriendly,
      job.description,
      job.applicationUrl,
    ]
  ).catch((err: any) => {
    console.warn("[PostgreSQL Job Sync Warning]:", err?.message);
  });
}

export function saveCandidateEndToEnd(
  profile: CandidateProfile,
  assessment: SkillsAssessmentResult,
  pathway: AICareerPathway
): StoredCandidateRecord {
  const state = readStore();
  const existingIdx = state.candidates.findIndex(
    (c) => c.profile.email.toLowerCase() === profile.email.toLowerCase()
  );

  const record: StoredCandidateRecord = {
    id:
      existingIdx >= 0
        ? state.candidates[existingIdx].id
        : `cand-${Date.now()}`,
    profile,
    assessment,
    pathway,
    completedMilestones:
      existingIdx >= 0 ? state.candidates[existingIdx].completedMilestones : [],
    coachingStatus:
      existingIdx >= 0
        ? state.candidates[existingIdx].coachingStatus
        : "Pending Booking",
    bookedHubDesk:
      existingIdx >= 0 ? state.candidates[existingIdx].bookedHubDesk : undefined,
    createdAt:
      existingIdx >= 0
        ? state.candidates[existingIdx].createdAt
        : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    state.candidates[existingIdx] = record;
  } else {
    state.candidates.unshift(record);
  }

  state.activeCandidateId = record.id;
  writeStore(state);
  syncCandidateToPostgres(record.profile);
  return record;
}

export function updateCandidateProgress(params: {
  candidateId?: string;
  toggleMilestonePhase?: string;
  confirmCoaching?: boolean;
  coachingPreferredDate?: string;
  bookHubId?: string;
}): StoredCandidateRecord | null {
  const state = readStore();
  const targetId = params.candidateId || state.activeCandidateId;
  if (!targetId) return null;

  const record = state.candidates.find((c) => c.id === targetId);
  if (!record) return null;

  if (params.toggleMilestonePhase) {
    const phase = params.toggleMilestonePhase;
    if (record.completedMilestones.includes(phase)) {
      record.completedMilestones = record.completedMilestones.filter(
        (p) => p !== phase
      );
    } else {
      record.completedMilestones.push(phase);
    }
  }

  if (params.confirmCoaching) {
    record.coachingStatus = "Session Confirmed";
    record.coachingPreferredDate =
      params.coachingPreferredDate || "Next Available Mentor Slot";
  }

  if (params.bookHubId) {
    const hub = state.hubs.find((h) => h.id === params.bookHubId);
    if (hub) {
      record.bookedHubDesk = {
        hubId: hub.id,
        hubName: hub.name,
        bookedAt: new Date().toISOString(),
      };
    }
  }

  writeStore(state);
  return record;
}

export function addHubToStore(hub: InnovationHub): InnovationHub {
  const state = readStore();
  const existingIdx = state.hubs.findIndex((h) => h.id === hub.id);
  if (existingIdx >= 0) {
    state.hubs[existingIdx] = hub;
  } else {
    state.hubs.unshift(hub);
  }
  writeStore(state);
  syncHubToPostgres(hub);
  return hub;
}

export function deleteHubFromStore(hubId: string): boolean {
  const state = readStore();
  const beforeLen = state.hubs.length;
  state.hubs = state.hubs.filter((h) => h.id !== hubId);
  if (state.hubs.length !== beforeLen) {
    writeStore(state);
    return true;
  }
  return false;
}

export function addJobToStore(job: RemoteJob): RemoteJob {
  const state = readStore();
  const existingIdx = state.jobs.findIndex((j) => j.id === job.id);
  if (existingIdx >= 0) {
    state.jobs[existingIdx] = job;
  } else {
    state.jobs.unshift(job);
  }
  writeStore(state);
  syncJobToPostgres(job);
  return job;
}

export function updateJobStatus(
  jobId: string,
  status: "approved" | "pending_review" | "archived"
): RemoteJob | null {
  const state = readStore();
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.status = status;
  writeStore(state);
  return job;
}

export function deleteJobFromStore(jobId: string): boolean {
  const state = readStore();
  const beforeLen = state.jobs.length;
  state.jobs = state.jobs.filter((j) => j.id !== jobId);
  if (state.jobs.length !== beforeLen) {
    writeStore(state);
    return true;
  }
  return false;
}

export function registerOrUpdateCandidate(profile: CandidateProfile): StoredCandidateRecord {
  const state = readStore();
  const emailLower = (profile.email || "").trim().toLowerCase();
  let existing = state.candidates.find(
    (c) => c.profile.email.trim().toLowerCase() === emailLower
  );

  if (existing) {
    existing.profile = { ...existing.profile, ...profile };
    state.activeCandidateId = existing.id;
    writeStore(state);
    syncCandidateToPostgres(existing.profile);
    return existing;
  }

  // Create a fresh candidate record
  const newRec: StoredCandidateRecord = {
    id: `cand-${Date.now()}`,
    profile,
    assessment: {
      domainCompetencyScore: 78,
      digitalReadinessScore: 72,
      remoteWorkLiteracyScore: 75,
      infrastructureIndexScore: profile.hasDedicatedLaptop ? 80 : 45,
      overallScore: 72,
      readinessTier: profile.hasDedicatedLaptop
        ? "Market-Ready (Direct Placement)"
        : "Bridge-Ready (Hub + Rapid Upskilling)",
      strengths: [
        "Strong foundational tertiary education",
        "High motivation for economic mobility & remote work",
      ],
      criticalGaps: [
        ...(profile.hasDedicatedLaptop ? [] : ["Requires Partner Hub solar workstation"]),
        ...(profile.hasGlobalPaymentRail ? [] : ["Needs USD payment rail setup (Deel / Payoneer)"]),
      ],
    },
    pathway: {
      recommendedTrack: profile.primaryGoal,
      executiveDiagnosis: `${profile.fullName} holds ${profile.highestQualification} in ${profile.fieldOfStudy}. Ready for targeted economic bridge with localized hardware support.`,
      infrastructureBridgePlan: `Pairing with solar & Starlink hub to eliminate daily power & connectivity constraints.`,
      recommendedHub: state.hubs[0] || SEED_INNOVATION_HUBS[0],
      assignedCoach: state.coaches[0] || SEED_COACHES[0],
      coachingAgenda: [
        "1. Remote Workflow & International Payment Setup",
        "2. Portfolio & Verified Competency Review",
        "3. Live Interview & Technical Practice",
      ],
      upskillingMilestones: [
        {
          phase: "Phase 1: Hardware & Baseline",
          durationWeeks: 2,
          title: "Hardware Access & Payment Rail Setup",
          objective: "Secure reliable workstation at partner hub and configure Payoneer/Deel.",
          deliverable: "Active Deel account + verified Hub workstation booking",
          resources: ["Hub Onboarding Guide", "Global Payment Rails Primer"],
          lowBandwidthFriendly: true,
        },
        {
          phase: "Phase 2: Competency Verification",
          durationWeeks: 4,
          title: "Portfolio Development & Technical Proof",
          objective: "Complete capstone project solving real-world domain problem.",
          deliverable: "Public GitHub/Portfolio project + verified case study",
          resources: ["Domain Practice Datasets", "Async Collab Templates"],
          lowBandwidthFriendly: false,
        },
      ],
      targetRemoteRoles: [
        {
          role: "Remote Associate",
          estimatedMonthlyUsd: "$800 - $1,400 / mo",
          matchReason: "Strong fit for candidate's educational background and analytical skills.",
        },
      ],
      paymentRailGuidance: "Configure Deel or Payoneer for direct USD transfers.",
      tailoredResumeSummary: `Dedicated ${profile.fieldOfStudy} specialist prepared for high-impact remote delivery.`,
      generatedBy: "utare-deterministic-engine",
    },
    completedMilestones: [],
    coachingStatus: "Pending Booking",
    createdAt: new Date().toISOString(),
  };

  state.candidates.unshift(newRec);
  state.activeCandidateId = newRec.id;
  writeStore(state);
  syncCandidateToPostgres(newRec.profile);
  return newRec;
}

export function submitJobApplicationToStore(params: {
  jobId: string;
  tailoredResumePitch: string;
  candidateId?: string;
  candidateName?: string;
}): JobApplicationRecord | null {
  const state = readStore();
  const job = state.jobs.find((j) => j.id === params.jobId);
  if (!job) return null;

  const targetId = params.candidateId || state.activeCandidateId;
  const activeCandidate = targetId
    ? state.candidates.find(
        (c) =>
          c.id === targetId ||
          c.profile.email.trim().toLowerCase() === targetId.trim().toLowerCase()
      )
    : state.candidates[0] || null;

  const appRecord: JobApplicationRecord = {
    id: `app-${Date.now()}`,
    candidateId: activeCandidate?.id || targetId || "guest-candidate",
    candidateName:
      params.candidateName || activeCandidate?.profile.fullName || "Utare Candidate",
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    tailoredResumePitch: params.tailoredResumePitch,
    appliedAt: new Date().toISOString(),
  };

  state.applications.unshift(appRecord);
  writeStore(state);
  syncJobApplicationToPostgres(appRecord);
  return appRecord;
}

export function saveEmployerRegistration(
  reg: Omit<EmployerRegistration, "id" | "createdAt">
): EmployerRegistration {
  const state = readStore();
  const record: EmployerRegistration = {
    ...reg,
    id: `emp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (!state.employerRegistrations) state.employerRegistrations = [];
  state.employerRegistrations.unshift(record);
  writeStore(state);

  // Async sync to containerized PostgreSQL
  query(
    `INSERT INTO public.employer_registrations (company_name, contact_person, email, website, industry, roles_interested, hiring_model, estimated_hires, timezone_overlap_needed, additional_notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      record.companyName,
      record.contactPerson,
      record.email,
      record.website || "",
      record.industry || "Technology",
      record.rolesInterested || [],
      record.hiringModel || "100% Remote Contract",
      record.estimatedHires || 1,
      record.timezoneOverlapNeeded || "CAT (GMT+2)",
      record.additionalNotes || "",
    ]
  ).catch(() => {});

  return record;
}

export function getEmployerRegistrations(): EmployerRegistration[] {
  const state = readStore();
  return state.employerRegistrations || [];
}

export function saveContactMessage(
  msg: Omit<ContactMessage, "id" | "createdAt">
): ContactMessage {
  const state = readStore();
  const record: ContactMessage = {
    ...msg,
    id: `msg-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (!state.contactMessages) state.contactMessages = [];
  state.contactMessages.unshift(record);
  writeStore(state);

  // Async sync to containerized PostgreSQL
  query(
    `INSERT INTO public.contact_messages (name, email, subject, message, inquiry_type)
     VALUES ($1, $2, $3, $4, $5)`,
    [record.name, record.email, record.subject, record.message, record.inquiryType || "General"]
  ).catch(() => {});

  return record;
}

export function getContactMessages(): ContactMessage[] {
  const state = readStore();
  return state.contactMessages || [];
}

export function getSkillsCourses(): SkillsCourse[] {
  const state = readStore();
  return state.skillsCourses || [...SEED_SKILLS_COURSES];
}
