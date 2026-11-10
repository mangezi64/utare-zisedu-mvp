import { describe, it, expect } from "vitest";
import {
  computeAssessmentScores,
  generateAICareerPathway,
} from "@/lib/gemini/pathway-engine";
import {
  addHubToStore,
  readStore,
  saveCandidateEndToEnd,
  submitJobApplicationToStore,
  updateCandidateProgress,
} from "@/lib/store";
import { CandidateProfile } from "@/types";

describe("End-to-End Connected Store Lifecycle (Tasks #1 -> #5)", () => {
  const testProfile: CandidateProfile = {
    fullName: "Rutendo Moyo",
    email: `rutendo-${Date.now()}@example.co.zw`,
    phone: "+263773001122",
    city: "Harare",
    highestQualification: "Bachelors Degree",
    fieldOfStudy: "BCom Finance & Banking",
    yearsExperience: 2,
    employmentStatus: "Survival Gig (Misaligned)",
    monthlyIncomeBracket: "$1 - $150 / mo",
    hasDedicatedLaptop: false,
    primaryDevice: "Smartphone Only",
    internetAccessType: "Mobile Data Bundles Only",
    powerReliabilityHours: 5,
    hasGlobalPaymentRail: false,
    primaryGoal: "International Remote Work",
    currentSkills: ["Financial Analysis", "Excel", "Reconciliation"],
  };

  it("persists candidate intake, toggles milestone progress, books coaching & hub desk, and submits remote job application", async () => {
    // 1. Score & generate AI Pathway
    const assessment = computeAssessmentScores(testProfile, {
      domainProblemSolving: 82,
      digitalTools: 74,
      asyncWorkflow: 78,
      clientComms: 80,
    });
    const pathway = await generateAICareerPathway(testProfile, assessment);

    // 2. Save candidate to connected store
    const saved = saveCandidateEndToEnd(testProfile, assessment, pathway);
    expect(saved.id).toMatch(/^cand-/);
    expect(saved.profile.fullName).toBe("Rutendo Moyo");

    // 3. Toggle milestone completion & confirm 1-on-1 coaching + book hub desk
    const firstPhase = pathway.upskillingMilestones[0].phase;
    const updated = updateCandidateProgress({
      candidateId: saved.id,
      toggleMilestonePhase: firstPhase,
      confirmCoaching: true,
      bookHubId: pathway.recommendedHub.id,
    });

    expect(updated).not.toBeNull();
    expect(updated?.completedMilestones).toContain(firstPhase);
    expect(updated?.coachingStatus).toBe("Session Confirmed");
    expect(updated?.bookedHubDesk?.hubId).toBe(pathway.recommendedHub.id);

    // 4. Enlist a new Partner Hub (Task #4)
    const enlistedHub = addHubToStore({
      id: `hub-test-${Date.now()}`,
      name: "Masvingo Great Zimbabwe Innovation Lab",
      city: "Masvingo",
      address: "10 Robertson St, Masvingo",
      hasSolarBackup: true,
      internetProvider: "Starlink Business",
      avgSpeedMbps: 160,
      availableWorkstations: 16,
      laptopLoanAvailable: true,
      dailyPassUsd: 0,
      utarePartnerSubsidized: true,
      contactEmail: "masvingo@utare-zisedu.org",
      operatingHours: "08:00 - 18:00",
    });
    expect(enlistedHub.city).toBe("Masvingo");

    // 5. Submit a Verified Remote Job Application with AI Resume Pitch (Task #5)
    const stateBefore = readStore();
    const targetJob = stateBefore.jobs[0];
    const appRecord = submitJobApplicationToStore({
      jobId: targetJob.id,
      tailoredResumePitch: pathway.tailoredResumeSummary,
    });

    expect(appRecord).not.toBeNull();
    expect(appRecord?.candidateId).toBe(saved.id);
    expect(appRecord?.jobId).toBe(targetJob.id);
  });
});
