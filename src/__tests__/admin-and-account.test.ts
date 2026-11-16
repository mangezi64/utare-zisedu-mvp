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
  createAuthUser,
  verifyUserEmailByToken,
  updateUserRole,
  saveEmployerRegistration,
  updateEmployerVerificationStatus,
  submitJobApplicationToStore,
  getEmployerApplicants,
  updateApplicationStatus,
} from "@/lib/store";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { signSessionToken, verifySessionToken } from "@/lib/auth-session";
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
      contactEmail: "mutare@utare-zem.org",
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

  it("hashes passwords, signs/verifies session tokens, and enforces backend role promotion", async () => {
    const hash = hashPassword("StrongPass#2026");
    expect(verifyPassword("StrongPass#2026", hash)).toBe(true);
    expect(verifyPassword("WrongPassword1!", hash)).toBe(false);

    const user = createAuthUser({
      email: "facilitator-test@utare-zem.org",
      name: "Test Facilitator",
      role: "candidate",
      passwordHash: hash,
      emailConfirmed: false,
      confirmationToken: "tok-confirm-123",
    });
    expect(user.emailConfirmed).toBe(false);

    const confirmed = verifyUserEmailByToken("tok-confirm-123");
    expect(confirmed?.emailConfirmed).toBe(true);

    const promoted = updateUserRole("facilitator-test@utare-zem.org", "admin");
    expect(promoted?.role).toBe("admin");

    const token = await signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "admin",
      emailConfirmed: true,
    });
    const payload = await verifySessionToken(token);
    expect(payload?.email).toBe("facilitator-test@utare-zem.org");
    expect(payload?.role).toBe("admin");
  });

  it("scopes employer applicants strictly to owned jobs and strips all private candidate fields", () => {
    // 1. Enrol an employer (starts pending verification)
    const emp = saveEmployerRegistration({
      companyName: "Zambezi Cloud Labs",
      contactPerson: "Tariro Ndlovu",
      email: `hiring-${Date.now()}@zambezicloud.co.zw`,
      industry: "Technology",
      rolesInterested: ["Backend Engineering"],
      hiringModel: "100% Remote Contract",
      estimatedHires: 2,
      timezoneOverlapNeeded: "CAT (GMT+2)",
    });
    expect(emp.verificationStatus).toBe("pending");

    // 2. Employer posts a role while pending verification
    const empJobId = `job-emp-test-${Date.now()}`;
    addJobToStore({
      id: empJobId,
      title: "Backend Python Engineer",
      company: emp.companyName,
      employerId: emp.id,
      employerEmail: emp.email,
      category: "Software",
      compensationUsdMonthly: "$1,300 / mo",
      supportedPaymentRails: ["Deel"],
      requiredSkills: ["Python", "PostgreSQL"],
      minReadinessTier: "Market-Ready (Direct Placement)",
      isAsyncFriendly: true,
      description: "Build APIs for fintech partners.",
      applicationUrl: "#apply",
      status: "pending_review",
      discoveredBy: "employer-posted",
    });

    // 3. Admin verifies employer once -> pending job auto-approves
    const verifiedEmp = updateEmployerVerificationStatus(emp.id, "verified");
    expect(verifiedEmp?.verificationStatus).toBe("verified");
    const approvedJob = readStore().jobs.find((j) => j.id === empJobId);
    expect(approvedJob?.status).toBe("approved");

    // 4. Candidate applies to the employer's job
    const cand = registerOrUpdateCandidate(testCandidateProfile);
    const submittedApp = submitJobApplicationToStore({
      jobId: empJobId,
      tailoredResumePitch: "Experienced Python & FastAPI engineer in Mutare.",
      candidateId: cand.id,
      candidateName: cand.profile.fullName,
      candidateEmail: cand.profile.email,
    });
    expect(submittedApp).not.toBeNull();

    // 5. Employer retrieves applicants for their own jobs
    const views = getEmployerApplicants({
      id: emp.id,
      email: emp.email,
      companyName: emp.companyName,
    });
    expect(views.length).toBeGreaterThanOrEqual(1);
    const view = views.find((v) => v.id === submittedApp?.id)!;
    expect(view).toBeDefined();
    expect(view.candidateName).toBe("Ruvimbo Chitepo");
    expect(view.tailoredResumePitch).toContain("FastAPI");

    // Verify private fields are NEVER leaked on the EmployerApplicantView object
    const rawView = view as unknown as Record<string, unknown>;
    expect(rawView.phone).toBeUndefined();
    expect(rawView.monthlyIncomeBracket).toBeUndefined();
    expect(rawView.employmentStatus).toBeUndefined();
    expect(rawView.hasDedicatedLaptop).toBeUndefined();
    expect(rawView.primaryDevice).toBeUndefined();
    expect(rawView.internetAccessType).toBeUndefined();
    expect(rawView.powerReliabilityHours).toBeUndefined();
    expect(rawView.hasGlobalPaymentRail).toBeUndefined();
    expect(rawView.assessment).toBeUndefined();
    expect(rawView.pathway).toBeUndefined();

    // 6. Employer updates applicant status to shortlisted
    const updatedView = updateApplicationStatus({
      applicationId: view.id,
      status: "shortlisted",
      employer: { id: emp.id, email: emp.email },
    });
    expect(updatedView?.status).toBe("shortlisted");

    // 7. Unrelated employer cannot see or modify this applicant
    const otherEmployerViews = getEmployerApplicants({
      id: "emp-unrelated-999",
      email: "nobody@othercompany.com",
      companyName: "Other Co",
    });
    expect(otherEmployerViews.some((v) => v.id === view.id)).toBe(false);

    deleteJobFromStore(empJobId);
  });
});
