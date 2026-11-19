import { describe, it, expect } from "vitest";
import {
  addJobToStore,
  confirmUserRemainOnPlatform,
  createAuthUser,
  deleteAllUserData,
  getEmployerApplicants,
  listInactivityRetentionStatus,
  moderateReportedJob,
  purgeInactiveAccountAfterNotices,
  readStore,
  recordInactivityNoticeEmail,
  registerOrUpdateCandidate,
  reportJobListing,
  saveEmployerRegistration,
  submitJobApplicationToStore,
  toggleApplicationSharing,
  updateApplicationStatus,
  writeStore,
} from "@/lib/store";
import {
  computeAssessmentScores,
  generateAICareerPathway,
} from "@/lib/gemini/pathway-engine";
import { hashPassword } from "@/lib/password-hash";
import { CandidateProfile, RemoteJob } from "@/types";

describe("Kutunga Safety by Design Safeguards", () => {
  it("supports minimal remote-readiness profile without survey income/employment fields and explains AI non-qualification", async () => {
    const minimalProfile: CandidateProfile = {
      fullName: "Nyasha Moyo",
      email: "nyasha.minimal@example.co.zw",
      phone: "+263771112233",
      city: "Gweru",
      highestQualification: "National Diploma (ND) / TVET / Polytech",
      fieldOfStudy: "Information Technology",
      yearsExperience: 1,
      canWorkRemotely: false,
      hubSupportNeed:
        "Full Hub Access Needed (Need Workstation, Solar Power & Internet)",
      hasDedicatedLaptop: false,
      primaryDevice: "Smartphone Only",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 4,
      hasGlobalPaymentRail: false,
      primaryGoal: "International Remote Work",
      currentSkills: ["Excel"],
    };

    const assessment = computeAssessmentScores(minimalProfile, {
      domainProblemSolving: 65,
      digitalTools: 55,
      asyncWorkflow: 60,
      clientComms: 65,
    });

    expect(assessment.qualificationBreakdown).toBeDefined();
    expect(
      assessment.qualificationBreakdown?.notQualifiedYetFor.length
    ).toBeGreaterThan(0);
    expect(
      assessment.qualificationBreakdown?.reasonsNotQualified.some((r) =>
        r.toLowerCase().includes("laptop") || r.toLowerCase().includes("score")
      )
    ).toBe(true);
    expect(
      assessment.qualificationBreakdown?.howToQualify.length
    ).toBeGreaterThan(0);

    const pathway = await generateAICareerPathway(minimalProfile, assessment);
    expect(pathway.executiveDiagnosis).not.toContain("undefined");
    expect(pathway.executiveDiagnosis.toLowerCase()).toContain("hub");
  });

  it("takes reported listings off the public board and lets superusers restore or permanently delete them", () => {
    const jobId = `job-report-test-${Date.now()}`;
    const job: RemoteJob = {
      id: jobId,
      title: "Suspicious Test Role",
      company: "Questionable Corp",
      category: "Operations",
      compensationUsdMonthly: "$5,000 / mo",
      supportedPaymentRails: ["Deel"],
      requiredSkills: ["Excel"],
      minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
      isAsyncFriendly: true,
      description: "Test listing for reporting workflow.",
      applicationUrl: "https://example.com/scam",
      status: "approved",
    };

    addJobToStore(job);

    const reported = reportJobListing({
      jobId,
      reason: "Asks for upfront fee or payment",
      details: "Asked candidate to pay registration fee.",
      reportedByEmail: "reporter@example.co.zw",
      reportedByName: "Reporter",
    });

    expect(reported?.status).toBe("reported");
    expect(reported?.reports?.length).toBe(1);

    // Restoring puts it back as approved
    const restored = moderateReportedJob({
      jobId,
      decision: "restore",
      superuserEmail: "superuser@utare.co.zw",
      note: "Verified false alarm",
    });
    expect(restored?.removed).toBe(false);
    expect(restored?.job?.status).toBe("approved");

    // Re-report and permanently delete as scam
    reportJobListing({
      jobId,
      reason: "Confirmed phishing",
      reportedByEmail: "reporter@example.co.zw",
    });
    const removed = moderateReportedJob({
      jobId,
      decision: "remove",
      superuserEmail: "superuser@utare.co.zw",
      note: "Confirmed scam",
    });
    expect(removed?.removed).toBe(true);
    expect(readStore().jobs.some((j) => j.id === jobId)).toBe(false);
  });

  it("enforces candidate sharing consent toggle on applications and supports optional employer feedback", () => {
    const ts = Date.now();
    const emp = saveEmployerRegistration({
      companyName: `Consent Test Co ${ts}`,
      contactPerson: "Hiring Manager",
      email: `emp-${ts}@consenttest.co.zw`,
      industry: "Technology",
      rolesInterested: ["Operations"],
      hiringModel: "100% Remote Contract",
      estimatedHires: 1,
      timezoneOverlapNeeded: "CAT (GMT+2)",
      verificationStatus: "verified",
    });

    const jobId = `job-consent-${ts}`;
    addJobToStore({
      id: jobId,
      title: "Remote Operations Coordinator",
      company: emp.companyName,
      employerId: emp.id,
      employerEmail: emp.email,
      category: "Operations",
      compensationUsdMonthly: "$900 / mo",
      supportedPaymentRails: ["Deel"],
      requiredSkills: ["Coordination"],
      minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
      isAsyncFriendly: true,
      description: "Operations coordinator.",
      applicationUrl: "#apply",
      status: "approved",
    });

    const candEmail = `cand-${ts}@example.co.zw`;
    const app = submitJobApplicationToStore({
      jobId,
      tailoredResumePitch: "Experienced coordinator.",
      candidateName: "Tariro Test",
      candidateEmail: candEmail,
      sharedWithEmployer: true,
    });
    expect(app?.sharedWithEmployer).toBe(true);

    // Visible to employer while shared
    let visible = getEmployerApplicants({
      id: emp.id,
      email: emp.email,
      companyName: emp.companyName,
    });
    expect(visible.some((a) => a.id === app!.id)).toBe(true);

    // Candidate pauses sharing -> hidden from employer
    const paused = toggleApplicationSharing({
      applicationId: app!.id,
      candidateEmail: candEmail,
      sharedWithEmployer: false,
    });
    expect(paused?.sharedWithEmployer).toBe(false);

    visible = getEmployerApplicants({
      id: emp.id,
      email: emp.email,
      companyName: emp.companyName,
    });
    expect(visible.some((a) => a.id === app!.id)).toBe(false);

    // Re-share and test optional feedback on rejection
    toggleApplicationSharing({
      applicationId: app!.id,
      candidateEmail: candEmail,
      sharedWithEmployer: true,
    });

    const updated = updateApplicationStatus({
      applicationId: app!.id,
      status: "rejected",
      employer: { id: emp.id, email: emp.email, companyName: emp.companyName },
      actorEmail: emp.email,
      feedbackNote: "",
    });
    expect(updated?.status).toBe("rejected");
    expect(updated?.employerFeedbackNote).toBeUndefined();
  });

  it("enforces 1-year inactivity + 3 email warnings before purge, and fully erases user data on request", async () => {
    const ts = Date.now();
    const email = `inactive-${ts}@example.co.zw`;
    const user = createAuthUser({
      email,
      name: "Inactive User",
      role: "candidate",
      passwordHash: hashPassword("TestPass123!"),
      emailConfirmed: true,
    });

    registerOrUpdateCandidate({
      fullName: "Inactive User",
      email,
      phone: "+263770001122",
      city: "Harare",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "Accounting",
      yearsExperience: 2,
      hasDedicatedLaptop: true,
      primaryDevice: "Dedicated Laptop / PC",
      internetAccessType: "Home Fiber / Wi-Fi",
      powerReliabilityHours: 12,
      hasGlobalPaymentRail: true,
      primaryGoal: "International Remote Work",
      currentSkills: ["Excel"],
    });

    // Backdate lastActiveAt to 400 days ago
    const state = readStore();
    const storedUser = state.users.find((u) => u.id === user.id)!;
    const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    storedUser.lastActiveAt = oldDate;
    writeStore(state);

    // Attempt purge with 0/3 notices -> blocked
    const blocked0 = await purgeInactiveAccountAfterNotices({
      targetEmail: email,
      actorEmail: "superuser@utare.co.zw",
    });
    expect(blocked0.ok).toBe(false);

    // Send 2 notices -> still blocked
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    const blocked2 = await purgeInactiveAccountAfterNotices({
      targetEmail: email,
      actorEmail: "superuser@utare.co.zw",
    });
    expect(blocked2.ok).toBe(false);

    // Confirming remain resets notices
    const confirmed = confirmUserRemainOnPlatform(email);
    expect(confirmed?.inactivityNoticesSent).toBe(0);

    // Backdate again and send 3 notices -> eligible & purged
    const state2 = readStore();
    state2.users.find((u) => u.id === user.id)!.lastActiveAt = oldDate;
    writeStore(state2);

    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });

    const statuses = listInactivityRetentionStatus();
    const targetStatus = statuses.find((s) => s.email === email);
    expect(targetStatus?.eligibleForDeletion).toBe(true);

    const purged = await purgeInactiveAccountAfterNotices({
      targetEmail: email,
      actorEmail: "superuser@utare.co.zw",
    });
    expect(purged.ok).toBe(true);
    expect(purged.deleted).toBe(true);

    const afterState = readStore();
    expect(afterState.users.some((u) => u.email === email)).toBe(false);
    expect(afterState.candidates.some((c) => c.profile.email === email)).toBe(false);

    // Direct self-deletion test
    const selfEmail = `selfdel-${ts}@example.co.zw`;
    const selfUser = createAuthUser({
      email: selfEmail,
      name: "Self Delete User",
      role: "candidate",
      passwordHash: hashPassword("TestPass123!"),
      emailConfirmed: true,
    });
    const delRes = await deleteAllUserData({
      targetEmail: selfEmail,
      targetUserId: selfUser.id,
      actorEmail: selfEmail,
      actorRole: "candidate",
      reason: "User self-deletion",
    });
    expect(delRes.deleted).toBe(true);
    expect(readStore().users.some((u) => u.email === selfEmail)).toBe(false);
  });
});
