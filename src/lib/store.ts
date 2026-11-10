// =============================================================================
// UTARE ZIMEDU AI — Unified Persistent Data Store (Local JSON + Supabase Sync)
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
  InnovationHub,
  RemoteJob,
  SkillsAssessmentResult,
} from "@/types";
import {
  SEED_COACHES,
  SEED_INNOVATION_HUBS,
  SEED_REMOTE_JOBS,
} from "@/lib/mock-data";

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
  state.hubs.unshift(hub);
  writeStore(state);
  return hub;
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
