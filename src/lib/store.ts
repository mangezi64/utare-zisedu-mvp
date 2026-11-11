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

export function readStore(): UtareDatabaseState {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as UtareDatabaseState;
      return {
        ...createInitialState(),
        ...parsed,
      };
    }
  } catch (err) {
    console.warn("[Utare Store] Failed to read store file, using seed:", err);
  }
  return createInitialState();
}

export function writeStore(state: UtareDatabaseState): UtareDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Utare Store] Non-fatal write warning:", err);
  }
  return state;
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
  return newRec;
}

export function submitJobApplicationToStore(params: {
  jobId: string;
  tailoredResumePitch: string;
}): JobApplicationRecord | null {
  const state = readStore();
  const job = state.jobs.find((j) => j.id === params.jobId);
  if (!job) return null;

  const activeCandidate = state.candidates.find(
    (c) => c.id === state.activeCandidateId
  );

  const appRecord: JobApplicationRecord = {
    id: `app-${Date.now()}`,
    candidateId: activeCandidate?.id || "guest-candidate",
    candidateName: activeCandidate?.profile.fullName || "Utare Candidate",
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    tailoredResumePitch: params.tailoredResumePitch,
    appliedAt: new Date().toISOString(),
  };

  state.applications.unshift(appRecord);
  writeStore(state);
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
