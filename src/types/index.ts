// =============================================================================
// UTARE ZISEDU AI — Core Domain Types
// =============================================================================

export type QualificationLevel =
  | "Masters Degree"
  | "Bachelors Degree"
  | "HND / Higher National Diploma"
  | "National Diploma (ND) / TVET / Polytech"
  | "Vocational Trade Certificate (Artisan / Apprenticeship)"
  | "A-Level / High School Leaver"
  | "O-Level / Secondary Leaver"
  | "Self-Taught / Practical Experience";

export type EmploymentStatus =
  | "Unemployed"
  | "Survival Gig (Misaligned)"
  | "Partially Aligned Role"
  | "Aligned Discipline Role"
  | "Self-Employed / Grassroots SME"
  | "Informal Trader / Vendor"
  | "Independent Artisan / Tradesperson";

export type IncomeBracket =
  | "$0 (Zero Income)"
  | "$1 - $150 / mo"
  | "$151 - $300 / mo"
  | "$300+ / mo";

export type PrimaryDevice =
  | "Smartphone Only"
  | "Feature Phone / Shared Community Phone"
  | "Shared / Borrowed PC"
  | "Dedicated Laptop / PC";

export type InternetAccessType =
  | "WhatsApp Bundles Only"
  | "Mobile Data Bundles Only"
  | "Home Fiber / Wi-Fi"
  | "Starlink"
  | "Intermittent / Cafe Only"
  | "No Internet Access at Home";

export type PrimaryGoal =
  | "International Remote Work"
  | "Local Formal Career"
  | "Scale Grassroots Venture"
  | "Vocational & Clean Energy Trades"
  | "Creative, Media & Freelance Services"
  | "Agribusiness & Farm Commercialization"
  | "Foundational Digital Skills & Micro-Tasking";

export type ZimbabweanCity =
  | "Harare"
  | "Bulawayo"
  | "Mutare"
  | "Gweru"
  | "Masvingo"
  | "Chinhoyi"
  | "Bindura"
  | "Marondera"
  | "Kwekwe"
  | "Victoria Falls"
  | "Zvishavane"
  | "Growth Point / Rural District"
  | "Other";

export type ReadinessTier =
  | "Market-Ready (Direct Placement)"
  | "Bridge-Ready (Hub + Rapid Upskilling)"
  | "Foundation Track (Hardware Bridge + Intensive Coaching)";

export interface CandidateProfile {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  city: ZimbabweanCity;
  highestQualification: QualificationLevel;
  fieldOfStudy: string;
  yearsExperience: number;
  employmentStatus: EmploymentStatus;
  monthlyIncomeBracket: IncomeBracket;
  // Infrastructure Constraints
  hasDedicatedLaptop: boolean;
  primaryDevice: PrimaryDevice;
  internetAccessType: InternetAccessType;
  powerReliabilityHours: number;
  hasGlobalPaymentRail: boolean;
  primaryGoal: PrimaryGoal;
  currentSkills: string[];
}

export interface SkillsAssessmentResult {
  domainCompetencyScore: number;
  digitalReadinessScore: number;
  remoteWorkLiteracyScore: number;
  infrastructureIndexScore: number;
  overallScore: number;
  readinessTier: ReadinessTier;
  strengths: string[];
  criticalGaps: string[];
}

export interface UpskillingMilestone {
  phase: string;
  durationWeeks: number;
  title: string;
  objective: string;
  deliverable: string;
  resources: string[];
  lowBandwidthFriendly: boolean;
}

export interface InnovationHub {
  id: string;
  name: string;
  city: string;
  address: string;
  hasSolarBackup: boolean;
  internetProvider: string;
  avgSpeedMbps: number;
  availableWorkstations: number;
  laptopLoanAvailable: boolean;
  dailyPassUsd: number;
  utarePartnerSubsidized: boolean;
  contactEmail: string;
  operatingHours: string;
}

export interface CoachProfile {
  id: string;
  fullName: string;
  title: string;
  organization: string;
  specialtyTrack: string;
  bio: string;
  city: string;
  availableSlotsWeekly: number;
  calBookingLink: string;
}

export interface AICareerPathway {
  recommendedTrack: string;
  executiveDiagnosis: string;
  infrastructureBridgePlan: string;
  recommendedHub: InnovationHub;
  assignedCoach: CoachProfile;
  coachingAgenda: string[];
  upskillingMilestones: UpskillingMilestone[];
  targetRemoteRoles: {
    role: string;
    estimatedMonthlyUsd: string;
    matchReason: string;
  }[];
  paymentRailGuidance: string;
  tailoredResumeSummary: string;
  generatedBy: "gemini-live" | "utare-deterministic-engine";
}

export interface RemoteJob {
  id: string;
  title: string;
  company: string;
  category: string;
  compensationUsdMonthly: string;
  supportedPaymentRails: string[];
  requiredSkills: string[];
  minReadinessTier: string;
  isAsyncFriendly: boolean;
  description: string;
  applicationUrl: string;
}
