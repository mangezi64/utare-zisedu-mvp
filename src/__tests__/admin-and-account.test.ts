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
  updateUserPassword,
  addCandidateDocument,
  listCandidateDocuments,
  saveCandidateCvArtifact,
  listCandidateCvArtifacts,
  listAuditLogs,
} from "@/lib/store";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { signSessionToken, verifySessionToken } from "@/lib/auth-session";
import { resolveBootstrapRole } from "@/lib/bootstrap-roles";
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

  it("dynamically resolves bootstrap roles for configured superusers and founders", () => {
    // 1. Founder defaults
    expect(resolveBootstrapRole("admin@utare.co.zw")).toBe("superuser");
    expect(resolveBootstrapRole("stewart@utare.co.zw")).toBe("superuser");
    expect(resolveBootstrapRole("stewart.mangezi@utare.co.zw")).toBe("superuser");
    expect(resolveBootstrapRole("regular.candidate@gmail.com")).toBe("candidate");

    // 2. Custom env overrides
    process.env.SUPERUSER_EMAILS = "custom-lead@domain.com, root@utare-zem.ai";
    expect(resolveBootstrapRole("custom-lead@domain.com")).toBe("superuser");
    expect(resolveBootstrapRole("ROOT@utare-zem.ai")).toBe("superuser");

    process.env.ADMIN_EMAILS = "regional-admin@utare.co.zw";
    expect(resolveBootstrapRole("regional-admin@utare.co.zw")).toBe("admin");
  });

  it("supports password updates, versioned credential attachments, versioned CV artifacts, and audit logs", async () => {
    const email = `rutendo-ver-${Date.now()}@utare.co.zw`;
    createAuthUser({
      email,
      name: "Rutendo Mangezi",
      role: "candidate",
      passwordHash: hashPassword("InitialPass1!"),
      emailConfirmed: true,
    });

    // 1. Update password
    const newHash = hashPassword("UpdatedPass2026!");
    const updatedUser = updateUserPassword(email, newHash);
    expect(updatedUser).not.toBeNull();
    expect(verifyPassword("UpdatedPass2026!", updatedUser!.passwordHash)).toBe(true);

    // 2. Upload v1 and v2 of a degree certificate
    const docV1 = await addCandidateDocument({
      candidateEmail: email,
      category: "degree",
      title: "BSc Computer Science Honours",
      issuer: "University of Zimbabwe",
      issueYear: "2024",
      fileName: "bsc_degree_v1.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 120000,
      dataUrl: "data:application/pdf;base64,JVBERi0xLjQ=",
    });
    expect(docV1.version).toBe(1);
    expect(docV1.isLatest).toBe(true);

    const docV2 = await addCandidateDocument({
      candidateEmail: email,
      category: "degree",
      title: "BSc Computer Science Honours",
      issuer: "University of Zimbabwe",
      issueYear: "2025",
      fileName: "bsc_degree_v2_stamped.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 135000,
      dataUrl: "data:application/pdf;base64,JVBERi0xLjQ=",
    });
    expect(docV2.version).toBe(2);
    expect(docV2.isLatest).toBe(true);

    const docs = await listCandidateDocuments(email);
    expect(docs.length).toBeGreaterThanOrEqual(2);
    expect(docs.find((d) => d.id === docV1.id)?.isLatest).toBe(false);
    expect(docs.find((d) => d.id === docV2.id)?.isLatest).toBe(true);

    // 3. Save v1 and v2 of a tailored CV & Cover Letter artifact
    const cvArtV1 = await saveCandidateCvArtifact({
      candidateEmail: email,
      jobId: "job-test-1",
      jobTitle: "Junior Data Analyst",
      company: "GlobalScale",
      generatedCv: {
        fullName: "Rutendo Mangezi",
        headline: "Data & Operations Specialist",
        contactLine: "Harare | rutendo@utare.co.zw",
        summary: "Analytical graduate.",
        coreSkills: ["SQL", "Excel"],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        languages: ["English"],
        generatedBy: "utare-deterministic-engine",
      },
      generatedCoverLetter: {
        fullName: "Rutendo Mangezi",
        contactLine: "Harare",
        date: "2026-11-16",
        recipient: "Hiring Team",
        subject: "Application: Junior Data Analyst",
        greeting: "Dear Hiring Team,",
        paragraphs: ["I am writing to apply."],
        signOff: "Sincerely,",
        generatedBy: "utare-deterministic-engine",
      },
      includePhoto: true,
    });
    expect(cvArtV1.version).toBe(1);

    const cvArtV2 = await saveCandidateCvArtifact({
      candidateEmail: email,
      jobId: "job-test-1",
      jobTitle: "Junior Data Analyst",
      company: "GlobalScale",
      generatedCv: cvArtV1.generatedCv,
      generatedCoverLetter: cvArtV1.generatedCoverLetter,
      includePhoto: true,
    });
    expect(cvArtV2.version).toBe(2);

    const arts = await listCandidateCvArtifacts(email);
    expect(arts.length).toBeGreaterThanOrEqual(2);

    // 4. Verify audit logs are recorded
    const logs = await listAuditLogs(20);
    expect(logs.length).toBeGreaterThan(0);
  });
});
