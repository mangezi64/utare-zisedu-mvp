// =============================================================================
// UTARE ZISEDU AI — Task #3: Gemini AI Career Pathway & Coach Pairing Engine
// =============================================================================
// Author: Stewart Mangezi (Task #3 Lead)
//
// Evaluates:
// 1. Academic qualification vs. current survival-gig/unemployment reality
// 2. Last-mile infrastructure constraints (Laptop deficit, ZESA power hours,
//    broadband access, global payment rail lockout)
// 3. Diagnostic assessment scores
//
// Outputs:
// - Personalized Career Track & Executive Diagnosis
// - Last-Mile Infrastructure Bridge Plan + Nearest Partner Innovation Hub
// - Paired Human Coach & First Session Agenda
// - 3-Phase Upskilling Roadmap (optimized for low-bandwidth / hub execution)
// - International Remote Resume Summary
// =============================================================================

import { GoogleGenAI } from "@google/genai";
import {
  AICareerPathway,
  CandidateProfile,
  CoachProfile,
  InnovationHub,
  SkillsAssessmentResult,
} from "@/types";
import { SEED_COACHES, SEED_INNOVATION_HUBS } from "@/lib/mock-data";

export function matchNearestHub(city: string): InnovationHub {
  const normalized = city.trim().toLowerCase();
  const directMatch = SEED_INNOVATION_HUBS.find(
    (h) => h.city.toLowerCase() === normalized
  );
  return directMatch || SEED_INNOVATION_HUBS[0];
}

export function matchBestCoach(
  profile: CandidateProfile
): CoachProfile {
  const field = profile.fieldOfStudy.toLowerCase();
  const goal = profile.primaryGoal;

  if (
    goal === "Vocational & Clean Energy Trades" ||
    field.includes("solar") ||
    field.includes("electrical") ||
    field.includes("mechanic") ||
    field.includes("artisan") ||
    field.includes("welding") ||
    field.includes("plumbing")
  ) {
    return SEED_COACHES[4]; // Eng. Brian Takawira - Solar & Clean Energy Trades
  }

  if (
    goal === "Creative, Media & Freelance Services" ||
    goal === "Foundational Digital Skills & Micro-Tasking" ||
    field.includes("graphic") ||
    field.includes("design") ||
    field.includes("media") ||
    field.includes("video") ||
    field.includes("creative") ||
    field.includes("content")
  ) {
    return SEED_COACHES[5]; // Kudzai Sithole - Creative Media & Micro-Work
  }

  if (
    goal === "Scale Grassroots Venture" ||
    goal === "Agribusiness & Farm Commercialization" ||
    field.includes("agri") ||
    field.includes("farm")
  ) {
    return SEED_COACHES[3]; // Tendai Mutasa - SME Digitization & Agribusiness
  }

  if (
    field.includes("computer") ||
    field.includes("software") ||
    field.includes("engineering") ||
    field.includes("math") ||
    field.includes("data") ||
    field.includes("it")
  ) {
    return SEED_COACHES[1]; // Eng. Farai Ncube - Tech & Data
  }

  if (
    !profile.hasGlobalPaymentRail &&
    (field.includes("finance") ||
      field.includes("accounting") ||
      field.includes("economics"))
  ) {
    return SEED_COACHES[2]; // Rudo Chikwanda - Fintech & Global Payments
  }

  return SEED_COACHES[0]; // Tariro Moyo - Global Remote Operations
}

export function computeAssessmentScores(
  profile: CandidateProfile,
  quizAnswers: Record<string, number>
): SkillsAssessmentResult {
  // Base domain score from qualification/practical training + quiz answers
  const qualBonus =
    profile.highestQualification === "Masters Degree"
      ? 25
      : profile.highestQualification === "Bachelors Degree"
      ? 22
      : profile.highestQualification === "HND / Higher National Diploma"
      ? 20
      : profile.highestQualification === "Vocational Trade Certificate (Artisan / Apprenticeship)"
      ? 20
      : profile.highestQualification === "National Diploma (ND) / TVET / Polytech"
      ? 18
      : 15;

  const quizValues = Object.values(quizAnswers);
  const quizAvg =
    quizValues.length > 0
      ? quizValues.reduce((acc, v) => acc + v, 0) / quizValues.length
      : 70;

  const domainCompetencyScore = Math.min(
    100,
    Math.round(quizAvg * 0.75 + qualBonus)
  );

  const digitalReadinessScore = Math.min(
    100,
    Math.round(
      (profile.hasDedicatedLaptop ? 35 : 15) +
        Math.min(35, profile.currentSkills.length * 9) +
        (quizAnswers["digitalTools"] || 65) * 0.3
    )
  );

  const remoteWorkLiteracyScore = Math.min(
    100,
    Math.round(
      (profile.hasGlobalPaymentRail ? 25 : 10) +
        (quizAnswers["asyncWorkflow"] || 70) * 0.5 +
        (quizAnswers["clientComms"] || 75) * 0.25
    )
  );

  // Infrastructure score directly reflects laptop, internet, and power hours
  const laptopPts = profile.hasDedicatedLaptop ? 40 : 0;
  const netPts =
    profile.internetAccessType === "Starlink" ||
    profile.internetAccessType === "Home Fiber / Wi-Fi"
      ? 35
      : profile.internetAccessType === "Mobile Data Bundles Only"
      ? 15
      : 5;
  const powerPts = Math.min(25, Math.round((profile.powerReliabilityHours / 16) * 25));
  const infrastructureIndexScore = Math.min(100, laptopPts + netPts + powerPts);

  const overallScore = Math.round(
    domainCompetencyScore * 0.35 +
      digitalReadinessScore * 0.25 +
      remoteWorkLiteracyScore * 0.2 +
      infrastructureIndexScore * 0.2
  );

  let readinessTier: SkillsAssessmentResult["readinessTier"] =
    "Bridge-Ready (Hub + Rapid Upskilling)";

  if (overallScore >= 76 && profile.hasDedicatedLaptop) {
    readinessTier = "Market-Ready (Direct Placement)";
  } else if (overallScore < 52 || (!profile.hasDedicatedLaptop && profile.powerReliabilityHours < 6)) {
    readinessTier = "Foundation Track (Hardware Bridge + Intensive Coaching)";
  }

  const strengths: string[] = [
    `${profile.highestQualification} in ${profile.fieldOfStudy} provides strong analytical foundation`,
  ];
  if (domainCompetencyScore >= 70) {
    strengths.push("High core academic & problem-solving competency");
  }
  if (profile.currentSkills.length >= 2) {
    strengths.push(`Verified baseline skills in ${profile.currentSkills.slice(0, 3).join(", ")}`);
  }

  const criticalGaps: string[] = [];
  if (!profile.hasDedicatedLaptop) {
    criticalGaps.push(
      "Hardware Deficit: Operating on smartphone/shared PC — requires Partner Hub workstation access"
    );
  }
  if (profile.internetAccessType === "Mobile Data Bundles Only" || profile.internetAccessType === "Intermittent / Cafe Only") {
    criticalGaps.push(
      "Connectivity Bottleneck: Reliant on expensive mobile bundles — needs Starlink/Fiber Hub pairing"
    );
  }
  if (!profile.hasGlobalPaymentRail) {
    criticalGaps.push(
      "Payment Rail Lockout: Needs guided setup for Deel / Payoneer / USD Nostro settlement"
    );
  }
  if (profile.employmentStatus === "Survival Gig (Misaligned)" || profile.employmentStatus === "Unemployed") {
    criticalGaps.push(
      "Portfolio Translation Gap: Academic credentials need repackaging into verified remote deliverables"
    );
  }

  return {
    domainCompetencyScore,
    digitalReadinessScore,
    remoteWorkLiteracyScore,
    infrastructureIndexScore,
    overallScore,
    readinessTier,
    strengths,
    criticalGaps,
  };
}

export async function generateAICareerPathway(
  profile: CandidateProfile,
  assessment: SkillsAssessmentResult
): Promise<AICareerPathway> {
  const recommendedHub = matchNearestHub(profile.city);
  const assignedCoach = matchBestCoach(profile);

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // If GEMINI_API_KEY is configured, call Google Gemini API dynamically
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are the UTARE ZISEDU AI Economic Mobility Engine for Zimbabwe.
Analyze the following Zimbabwean candidate profile and diagnostic assessment:

Candidate Profile:
- Name: ${profile.fullName}
- City: ${profile.city}
- Qualification: ${profile.highestQualification} in ${profile.fieldOfStudy}
- Current Status: ${profile.employmentStatus} (Income: ${profile.monthlyIncomeBracket})
- Primary Goal: ${profile.primaryGoal}
- Existing Skills: ${profile.currentSkills.join(", ") || "General Academic Research"}
- Dedicated Laptop: ${profile.hasDedicatedLaptop ? "Yes" : "No (Smartphone/Shared only)"}
- Internet Access: ${profile.internetAccessType}
- Daily Reliable Power: ${profile.powerReliabilityHours} hours/day
- Has International Payment Account: ${profile.hasGlobalPaymentRail ? "Yes" : "No"}

Assessment Scores:
- Domain Competency: ${assessment.domainCompetencyScore}/100
- Digital Readiness: ${assessment.digitalReadinessScore}/100
- Remote Work Literacy: ${assessment.remoteWorkLiteracyScore}/100
- Infrastructure Index: ${assessment.infrastructureIndexScore}/100
- Tier: ${assessment.readinessTier}

Matched Local Partner Hub: ${recommendedHub.name} (${recommendedHub.city})
Matched Human Coach: ${assignedCoach.fullName} (${assignedCoach.title})

Return ONLY valid JSON matching this exact structure (no markdown code fences):
{
  "recommendedTrack": "string",
  "executiveDiagnosis": "string (2-3 sentences addressing their credential-to-livelihood gap)",
  "infrastructureBridgePlan": "string (specific plan using ${recommendedHub.name} for power/internet/workstation)",
  "coachingAgenda": ["string", "string", "string"],
  "upskillingMilestones": [
    {
      "phase": "Phase 1 (Weeks 1-2)",
      "durationWeeks": 2,
      "title": "string",
      "objective": "string",
      "deliverable": "string",
      "resources": ["string", "string"],
      "lowBandwidthFriendly": true
    },
    {
      "phase": "Phase 2 (Weeks 3-5)",
      "durationWeeks": 3,
      "title": "string",
      "objective": "string",
      "deliverable": "string",
      "resources": ["string", "string"],
      "lowBandwidthFriendly": true
    },
    {
      "phase": "Phase 3 (Weeks 6-8)",
      "durationWeeks": 3,
      "title": "string",
      "objective": "string",
      "deliverable": "string",
      "resources": ["string", "string"],
      "lowBandwidthFriendly": false
    }
  ],
  "targetRemoteRoles": [
    {
      "role": "string",
      "estimatedMonthlyUsd": "string",
      "matchReason": "string"
    },
    {
      "role": "string",
      "estimatedMonthlyUsd": "string",
      "matchReason": "string"
    }
  ],
  "paymentRailGuidance": "string",
  "tailoredResumeSummary": "string (3-4 sentences written in first-person for international remote employers)"
}`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      const rawText = (response.text || "").trim();
      const cleanedJson = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      const parsed = JSON.parse(cleanedJson);

      return {
        ...parsed,
        recommendedHub,
        assignedCoach,
        generatedBy: "gemini-live",
      };
    } catch (error) {
      console.warn(
        "[Utare Gemini Engine] Live API call failed or timed out; using deterministic Zimbabwe mobility engine:",
        error
      );
    }
  }

  // Deterministic Zimbabwe-Contextualized Fallback Engine (runs identically in Docker without external keys)
  const isStem =
    profile.fieldOfStudy.toLowerCase().includes("computer") ||
    profile.fieldOfStudy.toLowerCase().includes("engineering") ||
    profile.fieldOfStudy.toLowerCase().includes("science") ||
    profile.fieldOfStudy.toLowerCase().includes("math") ||
    profile.fieldOfStudy.toLowerCase().includes("it");

  let recommendedTrack =
    "International Digital Operations, Research Synthesis & Revenue Support Track";
  if (profile.primaryGoal === "Vocational & Clean Energy Trades") {
    recommendedTrack =
      "Clean Energy, Commercial Solar PV Design & Technical Trades Track";
  } else if (profile.primaryGoal === "Creative, Media & Freelance Services") {
    recommendedTrack =
      "Global Creative Freelancing, UI/Media Design & International Client Track";
  } else if (
    profile.primaryGoal === "Foundational Digital Skills & Micro-Tasking"
  ) {
    recommendedTrack =
      "Foundational Digital Literacy, AI Data Annotation & Community Hub Micro-Earning Track";
  } else if (
    profile.primaryGoal === "Agribusiness & Farm Commercialization"
  ) {
    recommendedTrack =
      "Agribusiness Value-Chain Digitization, Direct Buyer Contracts & Micro-Capital Track";
  } else if (profile.primaryGoal === "Scale Grassroots Venture") {
    recommendedTrack =
      "Digitized Grassroots Enterprise & Working-Capital Readiness Track";
  } else if (isStem) {
    recommendedTrack =
      "Global Technical Operations, AI QA & Automation Engineering Track";
  }

  const executiveDiagnosis = `${profile.fullName} holds a ${profile.highestQualification} in ${profile.fieldOfStudy} (Domain Score: ${assessment.domainCompetencyScore}/100), yet is currently ${profile.employmentStatus.toLowerCase()} earning ${profile.monthlyIncomeBracket}. The primary barrier to upward mobility is not academic capability, but last-mile infrastructure (${profile.hasDedicatedLaptop ? "has laptop" : "no dedicated laptop"}, ${profile.internetAccessType}) and translating academic credentials into verified global remote deliverables.`;

  const isDiaspora =
    profile.city.toLowerCase().includes("abroad") ||
    profile.city.toLowerCase().includes("diaspora");

  const infrastructureBridgePlan = isDiaspora
    ? `Diaspora Remote Track (${profile.city}): Candidate is based internationally with self-provided workstation infrastructure. Full cloud access is active for skills diagnostic assessments, AI career roadmaps, grounded ATS CV tailoring, and international remote job matching. Physical partner hubs (${recommendedHub.name} in Harare, plus Bulawayo, Mutare, Gweru, Masvingo) remain accessible whenever visiting Zimbabwe.`
    : !profile.hasDedicatedLaptop
    ? `Priority Hardware & Power Bridge: Enroll at ${recommendedHub.name} (${recommendedHub.address}) for subsidized workstation loan access, 100% solar backup during ZESA load-shedding, and ${recommendedHub.avgSpeedMbps} Mbps Starlink connectivity.`
    : `Connectivity & Power Continuity: Utilize ${recommendedHub.name} (${recommendedHub.city}) during peak client overlap hours and ZESA outages to guarantee 99.9% uptime on ${recommendedHub.internetProvider}.`;

  return {
    recommendedTrack,
    executiveDiagnosis,
    infrastructureBridgePlan,
    recommendedHub,
    assignedCoach,
    coachingAgenda: [
      `Session 1 (Week 1) with ${assignedCoach.fullName}: Audit ${profile.fieldOfStudy} degree projects and convert them into 2 outcome-driven international portfolio case studies.`,
      `Session 2 (Week 3): Set up compliant cross-border payment rails (Deel + Payoneer + local USD Nostro account) and verify tax/identity documentation.`,
      `Session 3 (Week 6): Mock asynchronous technical/operations interview and direct warm referrals to Utare verified remote hiring partners.`,
    ],
    upskillingMilestones: [
      {
        phase: "Phase 1 (Weeks 1–2)",
        durationWeeks: 2,
        title: "Async Remote Workflows & Digital Workspace Mastery",
        objective:
          "Master international remote communication norms, Notion/Linear documentation, and AI productivity workflows.",
        deliverable:
          "Published Notion Competency Portfolio & Verified Async SOP Playbook",
        resources: [
          "GitLab Remote Handbook (Offline PDF Bundle)",
          "Utare Async Operations Lab (Hub Workstation Module)",
        ],
        lowBandwidthFriendly: true,
      },
      {
        phase: "Phase 2 (Weeks 3–5)",
        durationWeeks: 3,
        title: isStem
          ? "Applied API Automation, SQL & AI Model Evaluation"
          : "Applied Business Intelligence, CRM Automation & AI Research Synthesis",
        objective: `Bridge ${profile.fieldOfStudy} theory into practical digital execution demanded by UK/EU/US remote teams.`,
        deliverable: isStem
          ? "Deployed Next.js/Python Data Pipeline + 30 Verified AI QA Evaluations"
          : "End-to-End Automated Executive Operations Dashboard & Market Brief",
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
        objective:
          "Eliminate the 86.4% payment rail barrier and submit tailored applications to verified remote employers.",
        deliverable:
          "Verified Deel/Payoneer Contractor Profile + 5 Tailored Remote Applications",
        resources: [
          "1-on-1 Coaching Review with " + assignedCoach.fullName,
          "Utare Verified Remote Employer Fast-Track Feed",
        ],
        lowBandwidthFriendly: false,
      },
    ],
    targetRemoteRoles: isStem
      ? [
          {
            role: "AI Training & Domain Evaluation Specialist (STEM)",
            estimatedMonthlyUsd: "$900 – $1,500 / mo",
            matchReason: `Directly monetizes your ${profile.highestQualification} in ${profile.fieldOfStudy} with flexible async hours.`,
          },
          {
            role: "Junior Solutions & Workflow Automation Engineer",
            estimatedMonthlyUsd: "$1,200 – $1,900 / mo",
            matchReason:
              "Bypasses rigid local 3-year experience walls via verified competency deliverables.",
          },
        ]
      : [
          {
            role: "International Operations & Executive Research Associate",
            estimatedMonthlyUsd: "$850 – $1,350 / mo",
            matchReason: `Matches Zimbabwe's GMT+2 timezone with UK/EU employers seeking degreed analytical talent in ${profile.fieldOfStudy}.`,
          },
          {
            role: "AI Domain Data & Research Analyst",
            estimatedMonthlyUsd: "$800 – $1,250 / mo",
            matchReason:
              "High-demand entry ramp into global USD earnings with 100% asynchronous flexibility.",
          },
        ],
    paymentRailGuidance: profile.hasGlobalPaymentRail
      ? "Your existing global payment rail is ready. Pair it with a local Zimbabwean USD Nostro account (e.g., Stanbic, FBC, or CBZ FCA) for low-fee local withdrawals."
      : "Step 1: Open a zero-balance USD Individual Nostro account using your national ID and Utare Hub proof-of-enrollment. Step 2: Register on Deel and Payoneer using your passport/ID so international employers can pay you via compliant USD ACH/Wire without PayPal receive restrictions.",
    tailoredResumeSummary: `Analytical and execution-focused ${profile.highestQualification} graduate in ${profile.fieldOfStudy} based in ${profile.city}, Zimbabwe (GMT+2 / EMEA overlap). Proven ability to synthesize complex domain data, manage asynchronous digital workflows, and deliver high-accuracy outputs(${
      profile.currentSkills.join(", ") || "Research, Operations & Data Analysis"
    }). Backed by Utare ZISEDU AI Partner Hub infrastructure with 100% solar power redundancy and high-speed Starlink connectivity for uninterrupted global remote collaboration.`,
    generatedBy: "utare-deterministic-engine",
  };
}
