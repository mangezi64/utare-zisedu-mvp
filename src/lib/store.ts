// =============================================================================
// UTARE ZEM AI — Unified Persistent Data Store (PostgreSQL + Supabase + Local)
// =============================================================================
// Provides an end-to-end stateful backend for all modules (Auth, Candidate
// Intake/Pathway, Partner Hubs, Curated Jobs, Applications, and Employer Portal).
// =============================================================================

import fs from "fs";
import path from "path";
import {
  AICareerPathway,
  ApplicationStatus,
  CandidateProfile,
  CoachProfile,
  ContactMessage,
  EmployerApplicantView,
  EmployerRegistration,
  EmployerVerificationStatus,
  GeneratedCoverLetter,
  GeneratedCv,
  InnovationHub,
  RemoteJob,
  SkillsAssessmentResult,
  SkillsCourse,
  UserRole,
} from "@/types";
import {
  SEED_COACHES,
  SEED_INNOVATION_HUBS,
  SEED_REMOTE_JOBS,
  SEED_SKILLS_COURSES,
} from "@/lib/mock-data";
import { query } from "@/lib/db";

export interface StoredAuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  emailConfirmed: boolean;
  confirmationToken?: string;
  resetToken?: string;
  employerId?: string;
  /** Reserved for future multi-seat employer organization scoping ('org_admin' | 'org_member') */
  orgRole?: "org_admin" | "org_member";
  companyName?: string;
  city?: string;
  qualification?: string;
  fieldOfStudy?: string;
  createdAt: string;
}

export interface StoredCandidateRecord {
  id: string;
  userId?: string;
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
  candidateEmail?: string;
  candidateCity?: string;
  candidateQualification?: string;
  candidateFieldOfStudy?: string;
  candidateSkills?: string[];
  candidateReadinessTier?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  employerId?: string;
  tailoredResumePitch: string;
  generatedCv?: GeneratedCv;
  generatedCoverLetter?: GeneratedCoverLetter;
  status?: ApplicationStatus;
  appliedAt: string;
}

export interface UtareDatabaseState {
  activeCandidateId: string | null;
  users: StoredAuthUser[];
  candidates: StoredCandidateRecord[];
  hubs: InnovationHub[];
  coaches: CoachProfile[];
  jobs: RemoteJob[];
  applications: JobApplicationRecord[];
  employerRegistrations: EmployerRegistration[];
  skillsCourses: SkillsCourse[];
  contactMessages: ContactMessage[];
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const DATA_DIR = IS_SERVERLESS
  ? path.join("/tmp", ".data")
  : path.join(process.cwd(), ".data");
const BUNDLED_STORE_FILE = path.join(process.cwd(), ".data", "utare-store.json");
const STORE_FILE = path.join(DATA_DIR, "utare-store.json");

function createInitialState(): UtareDatabaseState {
  return {
    activeCandidateId: null,
    users: [],
    candidates: [],
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
    const targetFile = fs.existsSync(STORE_FILE)
      ? STORE_FILE
      : fs.existsSync(BUNDLED_STORE_FILE)
      ? BUNDLED_STORE_FILE
      : null;

    if (targetFile) {
      const raw = fs.readFileSync(targetFile, "utf-8").trim();
      if (raw.length > 0) {
        const parsed = JSON.parse(raw) as Partial<UtareDatabaseState>;
        const merged: UtareDatabaseState = {
          ...createInitialState(),
          ...parsed,
          users: parsed.users || [],
          candidates: (parsed.candidates || []).filter(
            (c) =>
              c.profile?.email?.toLowerCase() !== "demo@utarezem.ai" &&
              c.profile?.email?.toLowerCase() !== "demo@utaresizedu.ai"
          ),
        };
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
  return (
    state.candidates.find((c) => c.profile.email.trim().toLowerCase() === normalized) ||
    null
  );
}

export function findCandidateById(id?: string | null): StoredCandidateRecord | null {
  if (!id) return null;
  const state = readStore();
  return state.candidates.find((c) => c.id === id || c.userId === id) || null;
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
// Auth Users Management (Backend-Enforced Roles)
// =============================================================================

function syncAuthUserToPostgres(user: StoredAuthUser) {
  query(
    `INSERT INTO public.auth_users (
       id, email, name, role, password_hash, email_confirmed,
       confirmation_token, employer_id, org_role, company_name, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       password_hash = EXCLUDED.password_hash,
       email_confirmed = EXCLUDED.email_confirmed,
       confirmation_token = EXCLUDED.confirmation_token,
       employer_id = EXCLUDED.employer_id,
       org_role = EXCLUDED.org_role,
       company_name = EXCLUDED.company_name;`,
    [
      user.id,
      user.email.toLowerCase(),
      user.name,
      user.role,
      user.passwordHash,
      user.emailConfirmed,
      user.confirmationToken || null,
      user.employerId || null,
      user.orgRole || null,
      user.companyName || null,
      user.createdAt,
    ]
  ).catch(() => {});
}

export function findAuthUserByEmail(email?: string | null): StoredAuthUser | null {
  if (!email) return null;
  const state = readStore();
  const normalized = email.trim().toLowerCase();
  return state.users.find((u) => u.email.trim().toLowerCase() === normalized) || null;
}

export function findAuthUserById(id?: string | null): StoredAuthUser | null {
  if (!id) return null;
  const state = readStore();
  return state.users.find((u) => u.id === id) || null;
}

export function createAuthUser(params: {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  emailConfirmed?: boolean;
  confirmationToken?: string;
  employerId?: string;
  orgRole?: "org_admin" | "org_member";
  companyName?: string;
  city?: string;
  qualification?: string;
  fieldOfStudy?: string;
}): StoredAuthUser {
  const state = readStore();
  const normalizedEmail = params.email.trim().toLowerCase();
  const existingIdx = state.users.findIndex(
    (u) => u.email.trim().toLowerCase() === normalizedEmail
  );

  const userRecord: StoredAuthUser = {
    id:
      params.id ||
      (existingIdx >= 0 ? state.users[existingIdx].id : `usr-${Date.now()}`),
    email: normalizedEmail,
    name: params.name.trim(),
    role: params.role,
    passwordHash: params.passwordHash,
    emailConfirmed: params.emailConfirmed ?? false,
    confirmationToken: params.confirmationToken,
    employerId: params.employerId,
    orgRole: params.orgRole,
    companyName: params.companyName,
    city: params.city,
    qualification: params.qualification,
    fieldOfStudy: params.fieldOfStudy,
    createdAt:
      existingIdx >= 0
        ? state.users[existingIdx].createdAt
        : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    state.users[existingIdx] = userRecord;
  } else {
    state.users.unshift(userRecord);
  }

  writeStore(state);
  syncAuthUserToPostgres(userRecord);
  return userRecord;
}

export function verifyUserEmailByToken(token: string): StoredAuthUser | null {
  if (!token) return null;
  const state = readStore();
  const user = state.users.find((u) => u.confirmationToken === token);
  if (!user) return null;
  user.emailConfirmed = true;
  user.confirmationToken = undefined;
  writeStore(state);
  syncAuthUserToPostgres(user);
  return user;
}

export function confirmUserEmailByAddress(email: string): StoredAuthUser | null {
  const state = readStore();
  const normalized = email.trim().toLowerCase();
  const user = state.users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) return null;
  user.emailConfirmed = true;
  user.confirmationToken = undefined;
  writeStore(state);
  syncAuthUserToPostgres(user);
  return user;
}

export function updateUserRole(emailOrId: string, role: UserRole): StoredAuthUser | null {
  const state = readStore();
  const key = emailOrId.trim().toLowerCase();
  const user = state.users.find(
    (u) => u.id === emailOrId || u.email.toLowerCase() === key
  );
  if (!user) return null;
  user.role = role;
  writeStore(state);
  syncAuthUserToPostgres(user);
  return user;
}

export function updateUserPassword(emailOrId: string, passwordHash: string): StoredAuthUser | null {
  const state = readStore();
  const key = emailOrId.trim().toLowerCase();
  const user = state.users.find(
    (u) => u.id === emailOrId || u.email.toLowerCase() === key
  );
  if (!user) return null;
  user.passwordHash = passwordHash;
  user.resetToken = undefined;
  writeStore(state);
  syncAuthUserToPostgres(user);
  return user;
}

export function listAuthUsers(): Omit<StoredAuthUser, "passwordHash" | "confirmationToken" | "resetToken">[] {
  const state = readStore();
  return state.users.map(({ passwordHash: _p, confirmationToken: _c, resetToken: _r, ...rest }) => rest);
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
  const empStatus = profile.employmentStatus || "Unemployed";
  const income = profile.monthlyIncomeBracket || "$0 (Zero Income)";
  const hasLaptop = Boolean(profile.hasDedicatedLaptop);
  const device =
    profile.primaryDevice || (hasLaptop ? "Dedicated Laptop / PC" : "Smartphone Only");
  const internet = profile.internetAccessType || "Mobile Data Bundles Only";
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
    `INSERT INTO public.job_applications (
       id, candidate_id, candidate_name, candidate_email, candidate_city,
       candidate_qualification, candidate_field_of_study, candidate_skills,
       candidate_readiness_tier, job_id, job_title, company, employer_id,
       tailored_resume_pitch, generated_cv, generated_cover_letter, status, applied_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       tailored_resume_pitch = EXCLUDED.tailored_resume_pitch`,
    [
      app.id,
      app.candidateId,
      app.candidateName,
      app.candidateEmail || null,
      app.candidateCity || null,
      app.candidateQualification || null,
      app.candidateFieldOfStudy || null,
      app.candidateSkills || [],
      app.candidateReadinessTier || null,
      app.jobId,
      app.jobTitle,
      app.company,
      app.employerId || null,
      app.tailoredResumePitch,
      app.generatedCv ? JSON.stringify(app.generatedCv) : null,
      app.generatedCoverLetter ? JSON.stringify(app.generatedCoverLetter) : null,
      app.status || "submitted",
      app.appliedAt,
    ]
  ).catch(() => {
    // Fallback for original 8-column schema if migration hasn't run yet
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
    ).catch(() => {});
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

  const record = state.candidates.find(
    (c) =>
      c.id === targetId ||
      c.userId === targetId ||
      c.profile.email.toLowerCase() === targetId.toLowerCase()
  );
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
  const existing = state.candidates.find(
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
  candidateEmail?: string;
  generatedCv?: GeneratedCv;
  generatedCoverLetter?: GeneratedCoverLetter;
}): JobApplicationRecord | null {
  const state = readStore();
  const job = state.jobs.find((j) => j.id === params.jobId);
  if (!job) return null;

  const targetId = params.candidateId || params.candidateEmail || state.activeCandidateId;
  const activeCandidate = targetId
    ? state.candidates.find(
        (c) =>
          c.id === targetId ||
          c.userId === targetId ||
          c.profile.email.trim().toLowerCase() === targetId.trim().toLowerCase()
      )
    : state.candidates[0] || null;

  const appRecord: JobApplicationRecord = {
    id: `app-${Date.now()}`,
    candidateId: activeCandidate?.id || targetId || "candidate",
    candidateName:
      params.candidateName || activeCandidate?.profile.fullName || "Utare Candidate",
    candidateEmail:
      params.candidateEmail || activeCandidate?.profile.email || undefined,
    candidateCity: activeCandidate?.profile.city || "Harare",
    candidateQualification:
      activeCandidate?.profile.highestQualification || "Bachelors Degree",
    candidateFieldOfStudy:
      activeCandidate?.profile.fieldOfStudy || "Tertiary Graduate",
    candidateSkills: activeCandidate?.profile.currentSkills || [],
    candidateReadinessTier:
      activeCandidate?.assessment.readinessTier || "Bridge-Ready (Hub + Rapid Upskilling)",
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    employerId: job.employerId,
    tailoredResumePitch: params.tailoredResumePitch,
    generatedCv: params.generatedCv,
    generatedCoverLetter: params.generatedCoverLetter,
    status: "submitted",
    appliedAt: new Date().toISOString(),
  };

  state.applications.unshift(appRecord);
  writeStore(state);
  syncJobApplicationToPostgres(appRecord);
  return appRecord;
}

// =============================================================================
// Employer Portal & Strict Server-Side Applicant Data Minimization
// =============================================================================

/**
 * Converts an internal `JobApplicationRecord` + optional `StoredCandidateRecord`
 * into the strictly scoped `EmployerApplicantView` DTO.
 *
 * SECURITY / PRIVACY GUARANTEE:
 * Only explicit application-related fields are copied onto the returned object.
 * Phone numbers, income brackets, employment status, device/internet/power
 * constraints, payment-rail status, diagnostic slider sub-scores, coaching
 * notes, hub bookings, and other applications are NEVER included.
 */
export function toEmployerApplicantView(
  app: JobApplicationRecord,
  candidate?: StoredCandidateRecord | null
): EmployerApplicantView {
  return {
    id: app.id,
    jobId: app.jobId,
    jobTitle: app.jobTitle,
    company: app.company,
    appliedAt: app.appliedAt,
    status: app.status || "submitted",
    candidateName: app.candidateName || candidate?.profile.fullName || "Candidate",
    candidateEmail: app.candidateEmail || candidate?.profile.email || "",
    candidateCity: app.candidateCity || candidate?.profile.city || "Zimbabwe",
    candidateQualification:
      app.candidateQualification ||
      candidate?.profile.highestQualification ||
      "Tertiary Qualification",
    candidateFieldOfStudy:
      app.candidateFieldOfStudy || candidate?.profile.fieldOfStudy || "",
    skills:
      (app.candidateSkills && app.candidateSkills.length > 0
        ? app.candidateSkills
        : candidate?.profile.currentSkills) || [],
    readinessTier:
      app.candidateReadinessTier ||
      candidate?.assessment.readinessTier ||
      "Bridge-Ready (Hub + Rapid Upskilling)",
    tailoredResumePitch: app.tailoredResumePitch,
    ...(app.generatedCv ? { generatedCv: app.generatedCv } : {}),
    ...(app.generatedCoverLetter
      ? { generatedCoverLetter: app.generatedCoverLetter }
      : {}),
  };
}

export function findEmployerByEmail(email?: string | null): EmployerRegistration | null {
  if (!email) return null;
  const state = readStore();
  const normalized = email.trim().toLowerCase();
  return (
    (state.employerRegistrations || []).find(
      (e) => e.email.trim().toLowerCase() === normalized
    ) || null
  );
}

export function findEmployerById(id?: string | null): EmployerRegistration | null {
  if (!id) return null;
  const state = readStore();
  return (
    (state.employerRegistrations || []).find(
      (e) => e.id === id || e.userId === id
    ) || null
  );
}

export function saveEmployerRegistration(
  reg: Omit<EmployerRegistration, "id" | "createdAt"> & { id?: string }
): EmployerRegistration {
  const state = readStore();
  if (!state.employerRegistrations) state.employerRegistrations = [];

  const normalizedEmail = reg.email.trim().toLowerCase();
  const existingIdx = state.employerRegistrations.findIndex(
    (e) => e.email.trim().toLowerCase() === normalizedEmail
  );

  const record: EmployerRegistration = {
    ...reg,
    email: normalizedEmail,
    id:
      reg.id ||
      (existingIdx >= 0
        ? state.employerRegistrations[existingIdx].id
        : `emp-${Date.now()}`),
    verificationStatus:
      reg.verificationStatus ||
      (existingIdx >= 0
        ? state.employerRegistrations[existingIdx].verificationStatus
        : "pending") ||
      "pending",
    createdAt:
      existingIdx >= 0
        ? state.employerRegistrations[existingIdx].createdAt
        : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    state.employerRegistrations[existingIdx] = record;
  } else {
    state.employerRegistrations.unshift(record);
  }
  writeStore(state);

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

export function updateEmployerVerificationStatus(
  employerIdOrEmail: string,
  status: EmployerVerificationStatus
): EmployerRegistration | null {
  const state = readStore();
  if (!state.employerRegistrations) return null;
  const key = employerIdOrEmail.trim().toLowerCase();
  const emp = state.employerRegistrations.find(
    (e) => e.id === employerIdOrEmail || e.email.toLowerCase() === key
  );
  if (!emp) return null;

  emp.verificationStatus = status;
  if (status === "verified") {
    emp.verifiedAt = new Date().toISOString();
    // Auto-approve any pending jobs posted by this employer now that they're verified
    for (const job of state.jobs) {
      if (
        (job.employerId === emp.id ||
          (job.employerEmail && job.employerEmail.toLowerCase() === emp.email.toLowerCase())) &&
        job.status === "pending_review"
      ) {
        job.status = "approved";
      }
    }
  }
  writeStore(state);
  return emp;
}

export function getEmployerJobs(employer: {
  id?: string;
  email?: string;
  companyName?: string;
}): RemoteJob[] {
  const state = readStore();
  const emailLower = employer.email?.trim().toLowerCase();
  const companyLower = employer.companyName?.trim().toLowerCase();

  return state.jobs.filter((j) => {
    if (employer.id && j.employerId === employer.id) return true;
    if (emailLower && j.employerEmail?.toLowerCase() === emailLower) return true;
    if (
      companyLower &&
      j.discoveredBy === "employer-posted" &&
      j.company.trim().toLowerCase() === companyLower
    ) {
      return true;
    }
    return false;
  });
}

export function getEmployerApplicants(employer: {
  id?: string;
  email?: string;
  companyName?: string;
}): EmployerApplicantView[] {
  const state = readStore();
  const ownedJobs = getEmployerJobs(employer);
  const ownedJobIds = new Set(ownedJobs.map((j) => j.id));

  const matchingApps = state.applications.filter(
    (app) =>
      ownedJobIds.has(app.jobId) ||
      (employer.id && app.employerId === employer.id)
  );

  return matchingApps.map((app) => {
    const cand = state.candidates.find(
      (c) =>
        c.id === app.candidateId ||
        (app.candidateEmail &&
          c.profile.email.toLowerCase() === app.candidateEmail.toLowerCase())
    );
    return toEmployerApplicantView(app, cand);
  });
}

export function updateApplicationStatus(params: {
  applicationId: string;
  status: ApplicationStatus;
  employer?: { id?: string; email?: string; companyName?: string };
  isAdmin?: boolean;
}): EmployerApplicantView | null {
  const state = readStore();
  const app = state.applications.find((a) => a.id === params.applicationId);
  if (!app) return null;

  if (!params.isAdmin && params.employer) {
    const ownedJobs = getEmployerJobs(params.employer);
    const ownsJob = ownedJobs.some((j) => j.id === app.jobId);
    if (!ownsJob) return null;
  }

  app.status = params.status;
  writeStore(state);
  syncJobApplicationToPostgres(app);

  const cand = state.candidates.find((c) => c.id === app.candidateId);
  return toEmployerApplicantView(app, cand);
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
