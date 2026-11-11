import { describe, it, expect, beforeEach } from "vitest";
import {
  readStore,
  writeStore,
  registerOrUpdateCandidate,
  addHubToStore,
  deleteHubFromStore,
  addJobToStore,
  updateJobStatus,
  deleteJobFromStore,
} from "@/lib/store";
import { CandidateProfile, InnovationHub, RemoteJob } from "@/types";

describe("Admin & Candidate Account Store Integration", () => {
  const testCandidateProfile: CandidateProfile = {
    fullName: "Ruvimbo Chitepo",
    email: "ruvimbo.chitepo@example.co.zw",
    phone: "+263 77 999 1122",
    city: "Mutare",
    highestQualification: "Bachelors Degree",
    fieldOfStudy: "Computer Science",
    yearsExperience: 2,
    employmentStatus: "Survival Gig (Misaligned)",
    monthlyIncomeBracket: "$1 - $150 / mo",
    hasDedicatedLaptop: true,
    primaryDevice: "Dedicated Laptop / PC",
    internetAccessType: "Mobile Data Bundles Only",
    powerReliabilityHours: 6,
    hasGlobalPaymentRail: true,
    primaryGoal: "International Remote Work",
    currentSkills: ["Python", "FastAPI", "PostgreSQL"],
  };

  it("registers and updates candidate accounts cleanly", () => {
    const record = registerOrUpdateCandidate(testCandidateProfile);
    expect(record.id).toBeDefined();
    expect(record.profile.fullName).toBe("Ruvimbo Chitepo");
    expect(record.profile.email).toBe("ruvimbo.chitepo@example.co.zw");
    expect(record.assessment.readinessTier).toBe("Market-Ready (Direct Placement)");

    // Check store persistence
    const state = readStore();
    const found = state.candidates.find((c) => c.profile.email === testCandidateProfile.email);
    expect(found).toBeDefined();
    expect(state.activeCandidateId).toBe(record.id);
  });

  it("enlists, persists and unlists partner innovation hubs", () => {
    const newHub: InnovationHub = {
      id: "hub-mutare-test-01",
      name: "Eastern Highlands Tech & Solar Node",
      city: "Mutare",
      address: "12 Main St, Mutare",
      hasSolarBackup: true,
      internetProvider: "Starlink Business (200 Mbps)",
      avgSpeedMbps: 200,
      availableWorkstations: 30,
      laptopLoanAvailable: true,
      dailyPassUsd: 0,
      utarePartnerSubsidized: true,
      contactEmail: "mutare@utare-zisedu.org",
      operatingHours: "08:00 - 18:00",
    };

    const added = addHubToStore(newHub);
    expect(added.id).toBe("hub-mutare-test-01");

    const state = readStore();
    expect(state.hubs.some((h) => h.id === "hub-mutare-test-01")).toBe(true);

    const deleted = deleteHubFromStore("hub-mutare-test-01");
    expect(deleted).toBe(true);

    const stateAfter = readStore();
    expect(stateAfter.hubs.some((h) => h.id === "hub-mutare-test-01")).toBe(false);
  });

  it("manages remote jobs pipeline (manual add, approval, archive, delete)", () => {
    const testJob: RemoteJob = {
      id: "test-job-qa-01",
      title: "Remote QA & Automation Engineer",
      company: "Apex Global Software",
      category: "Software & Automation",
      compensationUsdMonthly: "$1,200 – $1,800 / mo",
      supportedPaymentRails: ["Deel", "Payoneer"],
      requiredSkills: ["Selenium", "Python", "API Testing"],
      minReadinessTier: "Market-Ready (Direct Placement)",
      isAsyncFriendly: true,
      description: "Test automated APIs and frontend workflows with UK timezone overlap.",
      applicationUrl: "https://example.com/apply",
      status: "pending_review",
      discoveredBy: "ai-search",
      discoveredAt: new Date().toISOString(),
    };

    addJobToStore(testJob);

    // Initial status is pending review
    let state = readStore();
    let job = state.jobs.find((j) => j.id === "test-job-qa-01");
    expect(job).toBeDefined();
    expect(job?.status).toBe("pending_review");

    // Admin approves job
    updateJobStatus("test-job-qa-01", "approved");
    state = readStore();
    job = state.jobs.find((j) => j.id === "test-job-qa-01");
    expect(job?.status).toBe("approved");

    // Clean up
    deleteJobFromStore("test-job-qa-01");
    state = readStore();
    expect(state.jobs.some((j) => j.id === "test-job-qa-01")).toBe(false);
  });
});
