import { describe, it, expect } from "vitest";
import {
  computeAssessmentScores,
  generateAICareerPathway,
  matchBestCoach,
  matchNearestHub,
} from "@/lib/gemini/pathway-engine";
import { CandidateProfile } from "@/types";

const SAMPLE_HARARE_CANDIDATE: CandidateProfile = {
  fullName: "Chipo Nyamande",
  email: "chipo@example.co.zw",
  phone: "+263772109876",
  city: "Harare",
  highestQualification: "Bachelors Degree",
  fieldOfStudy: "BSc Honours in Economics & Statistics",
  yearsExperience: 1,
  employmentStatus: "Unemployed",
  monthlyIncomeBracket: "$0 (Zero Income)",
  hasDedicatedLaptop: false,
  primaryDevice: "Smartphone Only",
  internetAccessType: "Mobile Data Bundles Only",
  powerReliabilityHours: 4,
  hasGlobalPaymentRail: false,
  primaryGoal: "International Remote Work",
  currentSkills: ["Excel", "Statistical Analysis", "Academic Research"],
};

const SAMPLE_STEM_MARKET_READY: CandidateProfile = {
  fullName: "Tinashe Dube",
  email: "tinashe@example.co.zw",
  phone: "+263714553210",
  city: "Bulawayo",
  highestQualification: "Masters Degree",
  fieldOfStudy: "Computer Science & Software Engineering",
  yearsExperience: 3,
  employmentStatus: "Partially Aligned Role",
  monthlyIncomeBracket: "$151 - $300 / mo",
  hasDedicatedLaptop: true,
  primaryDevice: "Dedicated Laptop / PC",
  internetAccessType: "Starlink",
  powerReliabilityHours: 16,
  hasGlobalPaymentRail: true,
  primaryGoal: "International Remote Work",
  currentSkills: ["TypeScript", "Python", "SQL", "Next.js", "Git"],
};

describe("Task #3 & #4: Partner Hub & Human Coach Matching", () => {
  it("matches candidates to the Innovation Hub in their city", () => {
    const harareHub = matchNearestHub("Harare");
    expect(harareHub.city).toBe("Harare");
    expect(harareHub.hasSolarBackup).toBe(true);

    const byoHub = matchNearestHub("Bulawayo");
    expect(byoHub.city).toBe("Bulawayo");

    const mutareHub = matchNearestHub("Mutare");
    expect(mutareHub.city).toBe("Mutare");
  });

  it("falls back to Harare node when city is unlisted", () => {
    const fallbackHub = matchNearestHub("Hwange");
    expect(fallbackHub.city).toBe("Harare");
  });

  it("pairs STEM candidates with the Engineering & AI Architect coach", () => {
    const coach = matchBestCoach(SAMPLE_STEM_MARKET_READY);
    expect(coach.fullName).toContain("Farai Ncube");
  });

  it("pairs Grassroots SME founders with the SME Digitization coach", () => {
    const smeCandidate: CandidateProfile = {
      ...SAMPLE_HARARE_CANDIDATE,
      primaryGoal: "Scale Grassroots Venture",
    };
    const coach = matchBestCoach(smeCandidate);
    expect(coach.fullName).toContain("Tendai Mutasa");
  });

  it("pairs Vocational / Solar Artisans with the Clean Energy Trades coach", () => {
    const solarArtisan: CandidateProfile = {
      ...SAMPLE_HARARE_CANDIDATE,
      city: "Masvingo",
      fieldOfStudy: "Electrical Power Engineering & Solar PV",
      primaryGoal: "Vocational & Clean Energy Trades",
    };
    const coach = matchBestCoach(solarArtisan);
    expect(coach.fullName).toContain("Brian Takawira");
  });

  it("pairs Creative & Media Freelancers with the Creative Media coach", () => {
    const creative: CandidateProfile = {
      ...SAMPLE_HARARE_CANDIDATE,
      fieldOfStudy: "Motion Graphics & UI Branding",
      primaryGoal: "Creative, Media & Freelance Services",
    };
    const coach = matchBestCoach(creative);
    expect(coach.fullName).toContain("Kudzai Sithole");
  });
});

describe("Task #2: Multi-Dimensional Readiness & Competency Scoring", () => {
  it("flags smartphone-only candidates with low power hours for Hardware Bridge / Foundation Track", () => {
    const result = computeAssessmentScores(SAMPLE_HARARE_CANDIDATE, {
      domainProblemSolving: 75,
      digitalTools: 60,
      asyncWorkflow: 65,
      clientComms: 70,
    });

    expect(result.domainCompetencyScore).toBeGreaterThanOrEqual(70);
    expect(result.infrastructureIndexScore).toBeLessThan(40);
    expect(result.readinessTier).toBe(
      "Foundation Track (Hardware Bridge + Intensive Coaching)"
    );
    expect(
      result.criticalGaps.some((gap) => gap.includes("Hardware Deficit"))
    ).toBe(true);
  });

  it("classifies well-equipped high-scoring candidates as Market-Ready", () => {
    const result = computeAssessmentScores(SAMPLE_STEM_MARKET_READY, {
      domainProblemSolving: 92,
      digitalTools: 90,
      asyncWorkflow: 88,
      clientComms: 85,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(76);
    expect(result.readinessTier).toBe("Market-Ready (Direct Placement)");
  });
});

describe("Task #3: AI Career Pathway & Coaching Generator", () => {
  it("generates a complete 3-phase pathway, coach agenda, hub bridge, and tailored resume", async () => {
    const assessment = computeAssessmentScores(SAMPLE_HARARE_CANDIDATE, {
      domainProblemSolving: 80,
      digitalTools: 70,
      asyncWorkflow: 75,
      clientComms: 80,
    });

    const pathway = await generateAICareerPathway(
      SAMPLE_HARARE_CANDIDATE,
      assessment
    );

    expect(pathway.recommendedTrack).toBeTruthy();
    expect(pathway.recommendedHub.city).toBe("Harare");
    expect(pathway.assignedCoach.fullName).toBeTruthy();
    expect(pathway.coachingAgenda.length).toBeGreaterThanOrEqual(3);
    expect(pathway.upskillingMilestones).toHaveLength(3);
    expect(pathway.targetRemoteRoles.length).toBeGreaterThanOrEqual(2);
    expect(pathway.tailoredResumeSummary).toContain("Zimbabwe");
  });
});
