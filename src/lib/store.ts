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
  ApplicantAiEvaluation,
  ApplicationStatus,
  AuditLogEntry,
  CandidateCvArtifact,
  CandidateDocument,
  CandidateDocumentCategory,
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
  StatusHistoryEntry,
  UserRole,
} from "@/types";
import {
  SEED_COACHES,
  SEED_INNOVATION_HUBS,
  SEED_REMOTE_JOBS,
  SEED_SKILLS_COURSES,
} from "@/lib/mock-data";
import { query } from "@/lib/db";
import { getSupabaseServer } from "@/lib/supabase/client";

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
  attachedDocumentIds?: string[];
  status?: ApplicationStatus;
  appliedAt: string;
  updatedAt?: string;
  updatedBy?: string;
  statusHistory?: StatusHistoryEntry[];
  aiEvaluation?: ApplicantAiEvaluation;
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
  candidateDocuments?: CandidateDocument[];
  candidateCvArtifacts?: CandidateCvArtifact[];
  auditLogs?: AuditLogEntry[];
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
    candidateDocuments: [],
    candidateCvArtifacts: [],
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
          candidateDocuments: parsed.candidateDocuments || [],
          candidateCvArtifacts: parsed.candidateCvArtifacts || [],
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

export async function findCandidateByEmailAsync(
  email?: string | null
): Promise<StoredCandidateRecord | null> {
  if (!email) return null;
  const local = findCandidateByEmail(email);
  if (local) return local;

  const normalized = email.trim().toLowerCase();
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data: p, error } = await sb
        .from("candidate_profiles")
        .select("*")
        .ilike("email", normalized)
        .maybeSingle();

      if (!error && p) {
        return registerOrUpdateCandidate({
          fullName: p.full_name || "Candidate",
          email: p.email,
          phone: p.phone || "",
          city: p.city || "Harare",
          highestQualification: p.highest_qualification || "Bachelors Degree",
          fieldOfStudy: p.field_of_study || "Information Technology",
          yearsExperience: Number(p.years_experience) || 0,
          employmentStatus: p.employment_status || "Unemployed",
          monthlyIncomeBracket: p.monthly_income_bracket || "$0 (Zero Income)",
          hasDedicatedLaptop: Boolean(p.has_dedicated_laptop),
          primaryDevice: p.primary_device || "Smartphone Only",
          internetAccessType: p.internet_access_type || "Mobile Data Bundles Only",
          powerReliabilityHours: Number(p.power_reliability_hours) || 6,
          hasGlobalPaymentRail: Boolean(p.has_global_payment_rail),
          primaryGoal: p.primary_goal || "International Remote Work",
          currentSkills: p.field_of_study ? [p.field_of_study] : [],
          avatarDataUrl: p.avatar_data_url || undefined,
          includePhotoOnCv: Boolean(p.include_photo_on_cv),
        });
      }
    } catch {
      // Ignore non-fatal lookup warning
    }
  }
  return null;
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

  const sb = getSupabaseServer();
  if (sb) {
    sb.from("auth_users")
      .upsert(
        {
          id: user.id,
          email: user.email.toLowerCase(),
          name: user.name,
          role: user.role,
          password_hash: user.passwordHash,
          email_confirmed: user.emailConfirmed,
          confirmation_token: user.confirmationToken || null,
          employer_id: user.employerId || null,
          org_role: user.orgRole || null,
          company_name: user.companyName || null,
          created_at: user.createdAt,
        },
        { onConflict: "email" }
      )
      .then(
        () => {},
        () => {}
      );
  }
}

export function findAuthUserByEmail(email?: string | null): StoredAuthUser | null {
  if (!email) return null;
  const state = readStore();
  const normalized = email.trim().toLowerCase();
  return state.users.find((u) => u.email.trim().toLowerCase() === normalized) || null;
}

export async function findAuthUserByEmailFromDb(
  email?: string | null
): Promise<StoredAuthUser | null> {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  try {
    const res = await query<any>(
      `SELECT id, email, name, role, password_hash, email_confirmed,
              confirmation_token, employer_id, org_role, company_name, created_at
       FROM public.auth_users
       WHERE LOWER(email) = $1
       LIMIT 1;`,
      [normalized]
    );
    if (res && res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      const user: StoredAuthUser = {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        passwordHash: row.password_hash,
        emailConfirmed: Boolean(row.email_confirmed),
        confirmationToken: row.confirmation_token || undefined,
        employerId: row.employer_id || undefined,
        orgRole: row.org_role || undefined,
        companyName: row.company_name || undefined,
        createdAt: row.created_at
          ? new Date(row.created_at).toISOString()
          : new Date().toISOString(),
      };
      const state = readStore();
      const idx = state.users.findIndex(
        (u) => u.email.trim().toLowerCase() === normalized
      );
      if (idx >= 0) {
        state.users[idx] = { ...state.users[idx], ...user };
      } else {
        state.users.push(user);
      }
      writeStore(state);
      return user;
    }
  } catch (err) {
    console.warn("[PostgreSQL Auth Lookup Non-fatal Warning]:", err);
  }

  // Fallback to live Supabase Service-Role lookup
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data: row, error } = await sb
        .from("auth_users")
        .select("*")
        .ilike("email", normalized)
        .maybeSingle();

      if (!error && row) {
        const user: StoredAuthUser = {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          passwordHash: row.password_hash,
          emailConfirmed: Boolean(row.email_confirmed),
          confirmationToken: row.confirmation_token || undefined,
          employerId: row.employer_id || undefined,
          orgRole: row.org_role || undefined,
          companyName: row.company_name || undefined,
          createdAt: row.created_at
            ? new Date(row.created_at).toISOString()
            : new Date().toISOString(),
        };
        const state = readStore();
        const idx = state.users.findIndex(
          (u) => u.email.trim().toLowerCase() === normalized
        );
        if (idx >= 0) {
          state.users[idx] = { ...state.users[idx], ...user };
        } else {
          state.users.push(user);
        }
        writeStore(state);
        return user;
      }
    } catch {
      // Ignore fallback error
    }
  }
  return null;
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

  if (profile.avatarDataUrl !== undefined || profile.includePhotoOnCv !== undefined) {
    query(
      `UPDATE public.candidate_profiles
       SET avatar_data_url = COALESCE($2, avatar_data_url),
           include_photo_on_cv = COALESCE($3, include_photo_on_cv)
       WHERE LOWER(email) = $1`,
      [email, profile.avatarDataUrl || null, profile.includePhotoOnCv ?? false]
    ).catch(() => {});
  }

  const sb = getSupabaseServer();
  if (sb) {
    sb.from("candidate_profiles")
      .upsert(
        {
          full_name: fullName,
          email,
          phone,
          city,
          highest_qualification: qual,
          field_of_study: field,
          years_experience: exp,
          employment_status: empStatus,
          monthly_income_bracket: income,
          has_dedicated_laptop: hasLaptop,
          primary_device: device,
          internet_access_type: internet,
          power_reliability_hours: power,
          has_global_payment_rail: paymentRail,
          primary_goal: goal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .then(
        () => {},
        () => {}
      );
  }
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

export function evaluateApplicantFit(params: {
  app: JobApplicationRecord;
  job?: RemoteJob | null;
  candidate?: StoredCandidateRecord | null;
  documents?: CandidateDocument[];
}): ApplicantAiEvaluation {
  const { app, job, candidate, documents = [] } = params;
  const candSkills = (
    (app.candidateSkills && app.candidateSkills.length > 0
      ? app.candidateSkills
      : candidate?.profile.currentSkills) || []
  ).map((s) => s.trim());

  const cvSkills = app.generatedCv?.coreSkills || [];
  const allCandSkillsLower = new Set(
    [...candSkills, ...cvSkills].map((s) => s.toLowerCase())
  );
  const pitchLower = (app.tailoredResumePitch || "").toLowerCase();
  const fieldLower = (
    app.candidateFieldOfStudy ||
    candidate?.profile.fieldOfStudy ||
    ""
  ).toLowerCase();

  const reqSkills = job?.requiredSkills || [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of reqSkills) {
    const reqLower = req.toLowerCase();
    const tokenMatch = reqLower
      .split(/[\s/&,-]+/)
      .filter((t) => t.length > 2)
      .some(
        (tok) =>
          Array.from(allCandSkillsLower).some((cs) => cs.includes(tok)) ||
          pitchLower.includes(tok) ||
          fieldLower.includes(tok)
      );
    if (allCandSkillsLower.has(reqLower) || tokenMatch) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const skillRatio =
    reqSkills.length > 0
      ? matchedSkills.length / reqSkills.length
      : 0.8;

  const hasCv = Boolean(app.generatedCv);
  const hasCoverLetter = Boolean(app.generatedCoverLetter);
  const latestDocs = documents.filter((d) => d.isLatest);
  const docBonus = Math.min(12, latestDocs.length * 4);
  const artifactBonus = (hasCv ? 5 : 0) + (hasCoverLetter ? 3 : 0);

  const rawScore = Math.round(58 + skillRatio * 24 + docBonus + artifactBonus);
  const fitScore = Math.max(55, Math.min(98, rawScore));

  const fitTier: ApplicantAiEvaluation["fitTier"] =
    fitScore >= 82
      ? "Top Match (Recommended)"
      : fitScore >= 70
      ? "Strong Contender"
      : "Developing Fit";

  const qual =
    app.candidateQualification ||
    candidate?.profile.highestQualification ||
    "Tertiary Qualification";
  const field =
    app.candidateFieldOfStudy ||
    candidate?.profile.fieldOfStudy ||
    "their discipline";

  const credentialsSummary =
    latestDocs.length > 0
      ? `${latestDocs.length} verified attachment(s) on file: ${latestDocs
          .map((d) => `${d.title} (v${d.version})`)
          .join(", ")}.`
      : `Holds ${qual} in ${field}. No external certificate attachments uploaded yet.`;

  const recommendationSummary =
    fitTier === "Top Match (Recommended)"
      ? `${app.candidateName} is a high-confidence match (${fitScore}% fit) for ${app.jobTitle}, combining ${qual} in ${field} with strong alignment across ${
          matchedSkills.slice(0, 3).join(", ") || "core role competencies"
        }. Recommended for immediate shortlist interview.`
      : `${app.candidateName} demonstrates ${fitScore}% role alignment for ${app.jobTitle} (${qual} in ${field}). ${
          matchedSkills.length > 0
            ? `Verified strengths in ${matchedSkills.join(", ")}.`
            : "Solid foundational profile ready for structured onboarding."
        }`;

  const suggestedInterviewQuestions = [
    `Walk us through a practical project or workflow where you applied ${
      matchedSkills[0] || field
    } to deliver measurable results.`,
    `How do you structure asynchronous updates and handoffs when collaborating with remote teams across timezones?`,
    missingSkills[0]
      ? `How would you approach ramping up on ${missingSkills[0]} during your first 30 days in the ${app.jobTitle} role?`
      : `What quality checks do you run before submitting deliverables for ${app.company}?`,
  ];

  return {
    fitScore,
    fitTier,
    recommendationSummary,
    matchedSkills,
    missingSkills,
    credentialsSummary,
    suggestedInterviewQuestions,
    evaluatedBy:
      app.generatedCv?.generatedBy === "gemini-live"
        ? "gemini-live"
        : "utare-deterministic-engine",
    evaluatedAt: app.appliedAt || new Date().toISOString(),
  };
}

export function submitJobApplicationToStore(params: {
  jobId: string;
  tailoredResumePitch: string;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  generatedCv?: GeneratedCv;
  generatedCoverLetter?: GeneratedCoverLetter;
  attachedDocumentIds?: string[];
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

  const nowIso = new Date().toISOString();
  const candidateEmail =
    params.candidateEmail || activeCandidate?.profile.email || undefined;

  const appRecord: JobApplicationRecord = {
    id: `app-${Date.now()}`,
    candidateId: activeCandidate?.id || targetId || "candidate",
    candidateName:
      params.candidateName || activeCandidate?.profile.fullName || "Utare Candidate",
    candidateEmail,
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
    attachedDocumentIds: params.attachedDocumentIds || [],
    status: "submitted",
    appliedAt: nowIso,
    updatedAt: nowIso,
    updatedBy: candidateEmail || "candidate",
    statusHistory: [
      {
        status: "submitted",
        changedBy: candidateEmail || "candidate",
        changedAt: nowIso,
        note: "Initial application submitted via UTARE ZEM AI platform.",
      },
    ],
  };

  state.applications.unshift(appRecord);
  writeStore(state);
  syncJobApplicationToPostgres(appRecord);

  recordAuditLog({
    entityType: "application",
    entityId: appRecord.id,
    action: "application_submitted",
    actorEmail: candidateEmail || "candidate",
    actorRole: "candidate",
    newValue: "submitted",
    summary: `${appRecord.candidateName} applied for "${job.title}" at ${job.company}.`,
  });

  return appRecord;
}

// =============================================================================
// Employer Portal & Strict Server-Side Applicant Data Minimization
// =============================================================================

export function toEmployerApplicantView(
  app: JobApplicationRecord,
  candidate?: StoredCandidateRecord | null
): EmployerApplicantView {
  const state = readStore();
  const job = state.jobs.find((j) => j.id === app.jobId) || null;
  const candEmail = (
    app.candidateEmail ||
    candidate?.profile.email ||
    ""
  )
    .trim()
    .toLowerCase();

  const candidateDocs = (state.candidateDocuments || []).filter(
    (d) =>
      d.isLatest &&
      candEmail &&
      d.candidateEmail.trim().toLowerCase() === candEmail
  );

  const aiEvaluation =
    app.aiEvaluation ||
    evaluateApplicantFit({
      app,
      job,
      candidate,
      documents: candidateDocs,
    });

  return {
    id: app.id,
    jobId: app.jobId,
    jobTitle: app.jobTitle,
    company: app.company,
    appliedAt: app.appliedAt,
    status: app.status || "submitted",
    ...(app.updatedAt ? { updatedAt: app.updatedAt } : {}),
    ...(app.updatedBy ? { updatedBy: app.updatedBy } : {}),
    ...(app.statusHistory ? { statusHistory: app.statusHistory } : {}),
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
    ...(candidate?.profile.avatarDataUrl
      ? { avatarDataUrl: candidate.profile.avatarDataUrl }
      : {}),
    ...(candidateDocs.length > 0 ? { documents: candidateDocs } : {}),
    aiEvaluation,
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

export async function findEmployerByEmailAsync(
  email?: string | null
): Promise<EmployerRegistration | null> {
  if (!email) return null;
  const local = findEmployerByEmail(email);
  if (local) return local;

  const normalized = email.trim().toLowerCase();
  try {
    const res = await query<any>(
      `SELECT id, user_id, company_name, contact_person, email, website, industry,
              roles_interested, hiring_model, estimated_hires, timezone_overlap_needed,
              additional_notes, verification_status, created_at
       FROM public.employer_registrations
       WHERE LOWER(email) = $1
       LIMIT 1;`,
      [normalized]
    );
    if (res && res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      return saveEmployerRegistration({
        id: row.id,
        userId: row.user_id || undefined,
        companyName: row.company_name || "Partner Organization",
        contactPerson: row.contact_person || "Employer Partner",
        email: row.email,
        website: row.website || "",
        industry: row.industry || "Technology & SaaS",
        rolesInterested: Array.isArray(row.roles_interested)
          ? row.roles_interested
          : ["Remote Operations"],
        hiringModel: row.hiring_model || "100% Remote Contract",
        estimatedHires: Number(row.estimated_hires) || 1,
        timezoneOverlapNeeded:
          row.timezone_overlap_needed || "CAT (GMT+2) / UK-EU overlap",
        additionalNotes: row.additional_notes || "",
        verificationStatus:
          (row.verification_status as EmployerVerificationStatus) || "pending",
      });
    }
  } catch {
    // Non-fatal Postgres lookup fallback
  }

  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data: row, error } = await sb
        .from("employer_registrations")
        .select("*")
        .ilike("email", normalized)
        .maybeSingle();

      if (!error && row) {
        return saveEmployerRegistration({
          id: row.id,
          userId: row.user_id || undefined,
          companyName: row.company_name || "Partner Organization",
          contactPerson: row.contact_person || "Employer Partner",
          email: row.email,
          website: row.website || "",
          industry: row.industry || "Technology & SaaS",
          rolesInterested: Array.isArray(row.roles_interested)
            ? row.roles_interested
            : ["Remote Operations"],
          hiringModel: row.hiring_model || "100% Remote Contract",
          estimatedHires: Number(row.estimated_hires) || 1,
          timezoneOverlapNeeded:
            row.timezone_overlap_needed || "CAT (GMT+2) / UK-EU overlap",
          additionalNotes: row.additional_notes || "",
          verificationStatus:
            (row.verification_status as EmployerVerificationStatus) || "pending",
        });
      }
    } catch {
      // Ignore non-fatal lookup warning
    }
  }
  return null;
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

  return matchingApps
    .map((app) => {
      const cand = state.candidates.find(
        (c) =>
          c.id === app.candidateId ||
          (app.candidateEmail &&
            c.profile.email.toLowerCase() === app.candidateEmail.toLowerCase())
      );
      return toEmployerApplicantView(app, cand);
    })
    .sort(
      (a, b) =>
        (b.aiEvaluation?.fitScore || 0) - (a.aiEvaluation?.fitScore || 0)
    );
}

export function updateApplicationStatus(params: {
  applicationId: string;
  status: ApplicationStatus;
  employer?: { id?: string; email?: string; companyName?: string };
  isAdmin?: boolean;
  actorEmail?: string;
}): EmployerApplicantView | null {
  const state = readStore();
  const app = state.applications.find((a) => a.id === params.applicationId);
  if (!app) return null;

  if (!params.isAdmin && params.employer) {
    const ownedJobs = getEmployerJobs(params.employer);
    const ownsJob = ownedJobs.some((j) => j.id === app.jobId);
    if (!ownsJob) return null;
  }

  const prevStatus = app.status || "submitted";
  const actor =
    params.actorEmail ||
    params.employer?.email ||
    (params.isAdmin ? "admin" : "employer");
  const nowIso = new Date().toISOString();

  app.status = params.status;
  app.updatedAt = nowIso;
  app.updatedBy = actor;
  if (!app.statusHistory) app.statusHistory = [];
  app.statusHistory.push({
    status: params.status,
    changedBy: actor,
    changedAt: nowIso,
  });

  writeStore(state);
  syncJobApplicationToPostgres(app);

  recordAuditLog({
    entityType: "application",
    entityId: app.id,
    action: "status_change",
    actorEmail: actor,
    actorRole: params.isAdmin ? "admin" : "employer",
    previousValue: prevStatus,
    newValue: params.status,
    summary: `Application status for ${app.candidateName} (${app.jobTitle}) updated from "${prevStatus}" to "${params.status}" by ${actor}.`,
  });

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

// =============================================================================
// Versioned Candidate Documents (Degrees, Certificates, Transcripts)
// =============================================================================

export async function addCandidateDocument(params: {
  userId?: string;
  candidateId?: string;
  candidateEmail: string;
  category: CandidateDocumentCategory;
  title: string;
  issuer?: string;
  issueYear?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  dataUrl: string;
}): Promise<CandidateDocument> {
  const state = readStore();
  if (!state.candidateDocuments) state.candidateDocuments = [];
  const emailLower = params.candidateEmail.trim().toLowerCase();
  const titleLower = params.title.trim().toLowerCase();

  // Compute next version for this candidate + category + title
  const matching = state.candidateDocuments.filter(
    (d) =>
      d.candidateEmail.trim().toLowerCase() === emailLower &&
      d.category === params.category &&
      d.title.trim().toLowerCase() === titleLower
  );
  const maxVersion = matching.reduce((max, d) => Math.max(max, d.version || 1), 0);
  for (const prev of matching) {
    prev.isLatest = false;
  }

  const record: CandidateDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: params.userId,
    candidateId: params.candidateId,
    candidateEmail: emailLower,
    category: params.category,
    title: params.title.trim(),
    issuer: params.issuer?.trim() || undefined,
    issueYear: params.issueYear?.trim() || undefined,
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSizeBytes: params.fileSizeBytes,
    dataUrl: params.dataUrl,
    version: maxVersion + 1,
    isLatest: true,
    createdAt: new Date().toISOString(),
  };

  state.candidateDocuments.unshift(record);
  writeStore(state);

  // Sync to PostgreSQL
  query(
    `UPDATE public.candidate_documents
     SET is_latest = false
     WHERE LOWER(candidate_email) = $1 AND category = $2 AND LOWER(title) = $3`,
    [emailLower, record.category, titleLower]
  ).catch(() => {});

  query(
    `INSERT INTO public.candidate_documents (
       id, user_id, candidate_id, candidate_email, category, title, issuer,
       issue_year, file_name, mime_type, file_size_bytes, data_url, version, is_latest, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (id) DO NOTHING`,
    [
      record.id,
      record.userId || null,
      record.candidateId || null,
      record.candidateEmail,
      record.category,
      record.title,
      record.issuer || null,
      record.issueYear || null,
      record.fileName,
      record.mimeType,
      record.fileSizeBytes,
      record.dataUrl,
      record.version,
      record.isLatest,
      record.createdAt,
    ]
  ).catch(() => {});

  // Sync to Supabase
  const sb = getSupabaseServer();
  if (sb) {
    sb.from("candidate_documents")
      .upsert(
        {
          id: record.id,
          user_id: record.userId || null,
          candidate_id: record.candidateId || null,
          candidate_email: record.candidateEmail,
          category: record.category,
          title: record.title,
          issuer: record.issuer || null,
          issue_year: record.issueYear || null,
          file_name: record.fileName,
          mime_type: record.mimeType,
          file_size_bytes: record.fileSizeBytes,
          data_url: record.dataUrl,
          version: record.version,
          is_latest: record.isLatest,
          created_at: record.createdAt,
        },
        { onConflict: "id" }
      )
      .then(
        () => {},
        () => {}
      );
  }

  return record;
}

export async function listCandidateDocuments(
  email?: string | null
): Promise<CandidateDocument[]> {
  const state = readStore();
  const docs: CandidateDocument[] = [...(state.candidateDocuments || [])];
  const existingIds = new Set(docs.map((d) => d.id));
  const emailLower = email?.trim().toLowerCase();

  // Hydrate from PostgreSQL
  try {
    const res = emailLower
      ? await query<any>(
          `SELECT * FROM public.candidate_documents WHERE LOWER(candidate_email) = $1 ORDER BY created_at DESC`,
          [emailLower]
        )
      : await query<any>(
          `SELECT * FROM public.candidate_documents ORDER BY created_at DESC`
        );
    if (res && res.rows) {
      for (const r of res.rows) {
        if (r.id && !existingIds.has(r.id)) {
          existingIds.add(r.id);
          docs.push({
            id: r.id,
            userId: r.user_id || undefined,
            candidateId: r.candidate_id || undefined,
            candidateEmail: r.candidate_email,
            category: r.category,
            title: r.title,
            issuer: r.issuer || undefined,
            issueYear: r.issue_year || undefined,
            fileName: r.file_name,
            mimeType: r.mime_type,
            fileSizeBytes: Number(r.file_size_bytes) || 0,
            dataUrl: r.data_url,
            version: Number(r.version) || 1,
            isLatest: Boolean(r.is_latest ?? true),
            createdAt: r.created_at
              ? new Date(r.created_at).toISOString()
              : new Date().toISOString(),
          });
        }
      }
    }
  } catch {}

  // Hydrate from Supabase
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const q = sb
        .from("candidate_documents")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: sbDocs, error } = emailLower
        ? await q.ilike("candidate_email", emailLower)
        : await q;
      if (!error && sbDocs) {
        for (const r of sbDocs) {
          if (r.id && !existingIds.has(r.id)) {
            existingIds.add(r.id);
            docs.push({
              id: r.id,
              userId: r.user_id || undefined,
              candidateId: r.candidate_id || undefined,
              candidateEmail: r.candidate_email,
              category: r.category,
              title: r.title,
              issuer: r.issuer || undefined,
              issueYear: r.issue_year || undefined,
              fileName: r.file_name,
              mimeType: r.mime_type,
              fileSizeBytes: Number(r.file_size_bytes) || 0,
              dataUrl: r.data_url,
              version: Number(r.version) || 1,
              isLatest: Boolean(r.is_latest ?? true),
              createdAt: r.created_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {}
  }

  return emailLower
    ? docs.filter((d) => d.candidateEmail.trim().toLowerCase() === emailLower)
    : docs;
}

export async function deleteCandidateDocument(
  docId: string,
  requesterEmail?: string,
  isAdmin?: boolean
): Promise<boolean> {
  const state = readStore();
  if (!state.candidateDocuments) state.candidateDocuments = [];
  const idx = state.candidateDocuments.findIndex((d) => d.id === docId);
  if (idx >= 0) {
    const doc = state.candidateDocuments[idx];
    if (
      !isAdmin &&
      requesterEmail &&
      doc.candidateEmail.toLowerCase() !== requesterEmail.toLowerCase()
    ) {
      return false;
    }
    state.candidateDocuments.splice(idx, 1);
    writeStore(state);
  }

  query(`DELETE FROM public.candidate_documents WHERE id = $1`, [docId]).catch(
    () => {}
  );
  const sb = getSupabaseServer();
  if (sb) {
    sb.from("candidate_documents")
      .delete()
      .eq("id", docId)
      .then(
        () => {},
        () => {}
      );
  }
  return true;
}

// =============================================================================
// Versioned Tailored CV & Cover Letter Artifacts
// =============================================================================

export async function saveCandidateCvArtifact(params: {
  userId?: string;
  candidateId?: string;
  candidateEmail: string;
  jobId?: string;
  jobTitle: string;
  company: string;
  generatedCv: GeneratedCv;
  generatedCoverLetter: GeneratedCoverLetter;
  sourceDetails?: any;
  avatarDataUrl?: string;
  includePhoto?: boolean;
}): Promise<CandidateCvArtifact> {
  const state = readStore();
  if (!state.candidateCvArtifacts) state.candidateCvArtifacts = [];
  const emailLower = params.candidateEmail.trim().toLowerCase();
  const jobKey = (params.jobId || params.jobTitle).trim().toLowerCase();

  const matching = state.candidateCvArtifacts.filter(
    (a) =>
      a.candidateEmail.trim().toLowerCase() === emailLower &&
      (a.jobId || a.jobTitle).trim().toLowerCase() === jobKey
  );
  const maxVersion = matching.reduce((max, a) => Math.max(max, a.version || 1), 0);

  const artifact: CandidateCvArtifact = {
    id: `cvart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: params.userId,
    candidateId: params.candidateId,
    candidateEmail: emailLower,
    jobId: params.jobId,
    jobTitle: params.jobTitle,
    company: params.company,
    version: maxVersion + 1,
    generatedCv: params.generatedCv,
    generatedCoverLetter: params.generatedCoverLetter,
    sourceDetails: params.sourceDetails,
    avatarDataUrl: params.avatarDataUrl,
    includePhoto: Boolean(params.includePhoto),
    createdAt: new Date().toISOString(),
  };

  state.candidateCvArtifacts.unshift(artifact);
  writeStore(state);

  query(
    `INSERT INTO public.candidate_cv_artifacts (
       id, user_id, candidate_id, candidate_email, job_id, job_title, company,
       version, generated_cv, generated_cover_letter, source_details,
       avatar_data_url, include_photo, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (id) DO NOTHING`,
    [
      artifact.id,
      artifact.userId || null,
      artifact.candidateId || null,
      artifact.candidateEmail,
      artifact.jobId || null,
      artifact.jobTitle,
      artifact.company,
      artifact.version,
      JSON.stringify(artifact.generatedCv),
      JSON.stringify(artifact.generatedCoverLetter),
      artifact.sourceDetails ? JSON.stringify(artifact.sourceDetails) : null,
      artifact.avatarDataUrl || null,
      Boolean(artifact.includePhoto),
      artifact.createdAt,
    ]
  ).catch(() => {});

  const sb = getSupabaseServer();
  if (sb) {
    sb.from("candidate_cv_artifacts")
      .upsert(
        {
          id: artifact.id,
          user_id: artifact.userId || null,
          candidate_id: artifact.candidateId || null,
          candidate_email: artifact.candidateEmail,
          job_id: artifact.jobId || null,
          job_title: artifact.jobTitle,
          company: artifact.company,
          version: artifact.version,
          generated_cv: artifact.generatedCv,
          generated_cover_letter: artifact.generatedCoverLetter,
          source_details: artifact.sourceDetails || null,
          avatar_data_url: artifact.avatarDataUrl || null,
          include_photo: Boolean(artifact.includePhoto),
          created_at: artifact.createdAt,
        },
        { onConflict: "id" }
      )
      .then(
        () => {},
        () => {}
      );
  }

  return artifact;
}

export async function listCandidateCvArtifacts(
  email?: string | null
): Promise<CandidateCvArtifact[]> {
  const state = readStore();
  const artifacts: CandidateCvArtifact[] = [...(state.candidateCvArtifacts || [])];
  const existingIds = new Set(artifacts.map((a) => a.id));
  const emailLower = email?.trim().toLowerCase();

  try {
    const res = emailLower
      ? await query<any>(
          `SELECT * FROM public.candidate_cv_artifacts WHERE LOWER(candidate_email) = $1 ORDER BY created_at DESC`,
          [emailLower]
        )
      : await query<any>(
          `SELECT * FROM public.candidate_cv_artifacts ORDER BY created_at DESC`
        );
    if (res && res.rows) {
      for (const r of res.rows) {
        if (r.id && !existingIds.has(r.id)) {
          existingIds.add(r.id);
          artifacts.push({
            id: r.id,
            userId: r.user_id || undefined,
            candidateId: r.candidate_id || undefined,
            candidateEmail: r.candidate_email,
            jobId: r.job_id || undefined,
            jobTitle: r.job_title,
            company: r.company,
            version: Number(r.version) || 1,
            generatedCv:
              typeof r.generated_cv === "string"
                ? JSON.parse(r.generated_cv)
                : r.generated_cv,
            generatedCoverLetter:
              typeof r.generated_cover_letter === "string"
                ? JSON.parse(r.generated_cover_letter)
                : r.generated_cover_letter,
            sourceDetails: r.source_details || undefined,
            avatarDataUrl: r.avatar_data_url || undefined,
            includePhoto: Boolean(r.include_photo),
            createdAt: r.created_at
              ? new Date(r.created_at).toISOString()
              : new Date().toISOString(),
          });
        }
      }
    }
  } catch {}

  const sb = getSupabaseServer();
  if (sb) {
    try {
      const q = sb
        .from("candidate_cv_artifacts")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: sbArts, error } = emailLower
        ? await q.ilike("candidate_email", emailLower)
        : await q;
      if (!error && sbArts) {
        for (const r of sbArts) {
          if (r.id && !existingIds.has(r.id)) {
            existingIds.add(r.id);
            artifacts.push({
              id: r.id,
              userId: r.user_id || undefined,
              candidateId: r.candidate_id || undefined,
              candidateEmail: r.candidate_email,
              jobId: r.job_id || undefined,
              jobTitle: r.job_title,
              company: r.company,
              version: Number(r.version) || 1,
              generatedCv: r.generated_cv,
              generatedCoverLetter: r.generated_cover_letter,
              sourceDetails: r.source_details || undefined,
              avatarDataUrl: r.avatar_data_url || undefined,
              includePhoto: Boolean(r.include_photo),
              createdAt: r.created_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {}
  }

  return emailLower
    ? artifacts.filter((a) => a.candidateEmail.trim().toLowerCase() === emailLower)
    : artifacts;
}

// =============================================================================
// Audit Trail & Activity Tracking (Who Changed What & When)
// =============================================================================

export function recordAuditLog(params: {
  entityType: AuditLogEntry["entityType"];
  entityId: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  previousValue?: string;
  newValue?: string;
  summary: string;
}): AuditLogEntry {
  const state = readStore();
  if (!state.auditLogs) state.auditLogs = [];
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    previousValue: params.previousValue,
    newValue: params.newValue,
    summary: params.summary,
    createdAt: new Date().toISOString(),
  };

  state.auditLogs.unshift(entry);
  if (state.auditLogs.length > 500) {
    state.auditLogs = state.auditLogs.slice(0, 500);
  }
  writeStore(state);

  query(
    `INSERT INTO public.audit_logs (
       id, entity_type, entity_id, action, actor_email, actor_role,
       previous_value, new_value, summary, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO NOTHING`,
    [
      entry.id,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.actorEmail,
      entry.actorRole,
      entry.previousValue || null,
      entry.newValue || null,
      entry.summary,
      entry.createdAt,
    ]
  ).catch(() => {});

  const sb = getSupabaseServer();
  if (sb) {
    sb.from("audit_logs")
      .upsert(
        {
          id: entry.id,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          action: entry.action,
          actor_email: entry.actorEmail,
          actor_role: entry.actorRole,
          previous_value: entry.previousValue || null,
          new_value: entry.newValue || null,
          summary: entry.summary,
          created_at: entry.createdAt,
        },
        { onConflict: "id" }
      )
      .then(
        () => {},
        () => {}
      );
  }

  return entry;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const state = readStore();
  const logs: AuditLogEntry[] = [...(state.auditLogs || [])];
  const existingIds = new Set(logs.map((l) => l.id));

  try {
    const res = await query<any>(
      `SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    if (res && res.rows) {
      for (const r of res.rows) {
        if (r.id && !existingIds.has(r.id)) {
          existingIds.add(r.id);
          logs.push({
            id: r.id,
            entityType: r.entity_type,
            entityId: r.entity_id,
            action: r.action,
            actorEmail: r.actor_email,
            actorRole: r.actor_role,
            previousValue: r.previous_value || undefined,
            newValue: r.new_value || undefined,
            summary: r.summary,
            createdAt: r.created_at
              ? new Date(r.created_at).toISOString()
              : new Date().toISOString(),
          });
        }
      }
    }
  } catch {}

  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data: sbLogs, error } = await sb
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && sbLogs) {
        for (const r of sbLogs) {
          if (r.id && !existingIds.has(r.id)) {
            existingIds.add(r.id);
            logs.push({
              id: r.id,
              entityType: r.entity_type,
              entityId: r.entity_id,
              action: r.action,
              actorEmail: r.actor_email,
              actorRole: r.actor_role,
              previousValue: r.previous_value || undefined,
              newValue: r.new_value || undefined,
              summary: r.summary,
              createdAt: r.created_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {}
  }

  return logs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
