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

export const ZIMBABWE_CITIES = [
  // Major Cities & Metropolitan Hubs
  "Harare",
  "Bulawayo",
  "Chitungwiza",
  "Mutare",
  "Gweru",
  "Epworth",
  "Kwekwe",
  "Kadoma",
  "Masvingo",
  "Chinhoyi",
  "Norton",
  "Marondera",
  "Ruwa",
  "Chegutu",
  "Zvishavane",
  "Bindura",
  "Beitbridge",
  "Redcliff",
  "Victoria Falls",
  "Hwange",
  "Rusape",
  "Chiredzi",
  "Kariba",
  "Karoi",
  "Gokwe",
  "Chipinge",
  "Shurugwi",
  "Gwanda",
  // Towns, Municipalities & Urban Centres (Alphabetical)
  "Banket",
  "Bikita",
  "Binga",
  "Buhera",
  "Centenary",
  "Chakari",
  "Chimanimani",
  "Chirundu",
  "Chivhu",
  "Colleen Bawn",
  "Concession",
  "Dete",
  "Dorowa",
  "Esigodini",
  "Filabusi",
  "Glendale",
  "Goromonzi",
  "Guruve",
  "Gutu",
  "Hauna",
  "Headlands",
  "Hwedza (Wedza)",
  "Insiza",
  "Kamativi",
  "Kotwa",
  "Lalapanzi",
  "Lupane",
  "Macheke",
  "Madziwa",
  "Magunje",
  "Maphisa",
  "Marange",
  "Mashava",
  "Matobo",
  "Mazowe",
  "Mberengwa",
  "Mhangura",
  "Mount Darwin",
  "Mubaira",
  "Mupandawana",
  "Murambinda",
  "Murehwa",
  "Mutoko",
  "Mvuma",
  "Mvurwi",
  "Mwenezi",
  "Nkayi",
  "Nyabira",
  "Nyamapanda",
  "Nyanga",
  "Nyika",
  "Penhalonga",
  "Plumtree",
  "Raffingora",
  "Renco Mine",
  "Sadza",
  "Sanyati",
  "Selous",
  "Shamva",
  "Silobela",
  "Tengwe",
  "Triangle",
  "Tsholotsho",
  "West Nicholson",
  // Districts, Diaspora & Custom Locations
  "Growth Point / Rural District",
  "Diaspora / Abroad (Outside Zimbabwe)",
  "Other",
] as const;

export type ZimbabweanCity = (typeof ZIMBABWE_CITIES)[number] | (string & {});

export type ReadinessTier =
  | "Remote Ready"
  | "Needs Upskilling"
  | "Needs Infrastructure Support"
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
  industry?: string; // 'Technology', 'Research', 'Media', 'Professional Services', 'Finance'
  level?: "Entry" | "Mid-level" | "Experienced";
  arrangement?: "Remote" | "Hybrid" | "On-site";
  compensationUsdMonthly: string;
  supportedPaymentRails: string[];
  requiredSkills: string[];
  minReadinessTier: string;
  isAsyncFriendly: boolean;
  description: string;
  applicationUrl: string;
  status?: "approved" | "pending_review" | "archived";
  discoveredBy?: "ai-search" | "admin-manual" | "partner-feed";
  sourceUrl?: string;
  discoveredAt?: string;
}

// =============================================================================
// CV & Application Letter Studio
// =============================================================================
// Facts (employers, dates, institutions) always come from the candidate.
// The AI only rewrites wording and ordering — it must never invent history.

export interface WorkHistoryEntry {
  role: string;
  organization: string;
  location?: string;
  startDate: string; // e.g. "Mar 2022"
  endDate: string; // e.g. "Present"
  /** Raw notes in the candidate's own words; the writer turns these into bullets. */
  notes: string;
}

export interface EducationEntry {
  qualification: string;
  institution: string;
  year: string;
  details?: string;
}

export interface CvSourceDetails {
  headline?: string;
  linkedinOrPortfolio?: string;
  workHistory: WorkHistoryEntry[];
  education: EducationEntry[];
  projects: { name: string; notes: string }[];
  certifications: string[];
  languages: string[];
  /** Short free-text the candidate writes about themselves; tone reference for the writer. */
  aboutMe?: string;
}

export interface TargetRole {
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
}

export interface GeneratedCv {
  fullName: string;
  headline: string;
  contactLine: string;
  summary: string;
  coreSkills: string[];
  experience: {
    role: string;
    organization: string;
    location?: string;
    dates: string;
    bullets: string[];
  }[];
  projects: { name: string; bullets: string[] }[];
  education: { qualification: string; institution: string; year: string; details?: string }[];
  certifications: string[];
  languages: string[];
  generatedBy: "gemini-live" | "utare-deterministic-engine";
}

export interface GeneratedCoverLetter {
  fullName: string;
  contactLine: string;
  date: string;
  recipient: string;
  subject: string;
  greeting: string;
  paragraphs: string[];
  signOff: string;
  generatedBy: "gemini-live" | "utare-deterministic-engine";
}

export interface StyleReport {
  score: number; // 0-100, higher = more human
  flaggedPhrases: string[];
  avgSentenceLength: number;
  notes: string[];
}

export interface EmployerRegistration {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  website?: string;
  industry: string;
  rolesInterested: string[];
  hiringModel: string;
  estimatedHires: number;
  timezoneOverlapNeeded: string;
  additionalNotes?: string;
  createdAt: string;
}

export interface SkillsCourse {
  id: string;
  title: string;
  category: string;
  provider: string;
  durationWeeks: number;
  costType: string;
  skillsTaught: string[];
  level: string;
  courseUrl: string;
  description: string;
  lessons?: string[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryType: string;
  createdAt: string;
}
