import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import {
  INACTIVITY_THRESHOLD_DAYS,
  REQUIRED_INACTIVITY_EMAILS,
  addCandidateDocument,
  confirmUserRemainOnPlatform,
  createAuthUser,
  deleteAllUserData,
  findAuthUserByEmail,
  findCandidateByEmail,
  listInactivityRetentionStatus,
  purgeInactiveAccountAfterNotices,
  readStore,
  recordInactivityNoticeEmail,
  registerOrUpdateCandidate,
  saveCandidateCvArtifact,
  submitJobApplicationToStore,
  writeStore,
} from "@/lib/store";
import { computeAssessmentScores } from "@/lib/gemini/pathway-engine";
import { hashPassword } from "@/lib/password-hash";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth-session";
import { CandidateProfile } from "@/types";

vi.mock("@/lib/email-domain-check", () => ({
  checkEmailDomain: vi.fn(async () => "deliverable"),
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: false,
  supabase: null,
  getSupabaseAdmin: () => null,
  getSupabaseServer: () => null,
}));

const PROJECT_ROOT = process.cwd();

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf-8");
}

describe("Data Policy, Zimbabwe Cyber & Data Protection Act [Chapter 12:07], SI 155/2024 & Kutunga Safety by Design Compliance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Data Policy page covers Zimbabwe Cyber & Data Protection Act, SI 155/2024, lawful basis, minimization, rights, AI transparency, 1-year retention, website-only PII, 24h breach notice, and contacts", () => {
    const policyPath = path.join(PROJECT_ROOT, "src/app/data-policy/page.tsx");
    expect(fs.existsSync(policyPath)).toBe(true);

    const content = readProjectFile("src/app/data-policy/page.tsx");
    expect(content).toContain("Cyber and Data Protection Act [Chapter 12:07]");
    expect(content).toContain("SI 155 of 2024");
    expect(content).toContain("POTRAZ");
    expect(content).toContain("Lawful Basis for Processing");
    expect(content).toContain("Data Minimization");
    expect(content).toContain("not");
    expect(content).toContain("income brackets");
    expect(content).toContain("Website-Only Security");
    expect(content).toContain("never");
    expect(content).toContain("third-party messaging bots");
    expect(content).toContain("AI Decision Transparency");
    expect(content).toContain("1 full year (365 days) of inactivity");
    expect(content).toContain("at least 3 email notices");
    expect(content).toContain("Access &amp; Rectification");
    expect(content).toContain("Self-Delete");
    expect(content).toContain("24 hours");
    expect(content).toContain("utarezemai@gmail.com");
    expect(content).toContain("+263 78 611 3799");
    expect(content).toContain('href="/contact"');
  });

  it("2. Root layout footer includes clickable links to /data-policy on every page", () => {
    const layout = readProjectFile("src/app/layout.tsx");
    expect(layout).toContain("<footer");
    const matches = layout.match(/href="\/data-policy"/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(layout).toContain("Data Policy &amp; Privacy");
  });

  it("3a. Login registration UI has unticked-by-default consent checkbox linking to /data-policy and sends dataPolicyAccepted", () => {
    const loginPage = readProjectFile("src/app/login/page.tsx");
    expect(loginPage).toContain("const [consentAccepted, setConsentAccepted] = useState(false)");
    expect(loginPage).toContain('href="/data-policy"');
    expect(loginPage).toContain("checked={consentAccepted}");
    expect(loginPage).toContain("!consentAccepted");
    expect(loginPage).toContain("dataPolicyAccepted: consentAccepted");
  });

  it("3b. POST /api/auth/signup rejects dataPolicyAccepted: false (400), persists consent timestamp/version when true, and stays backward-compatible when omitted", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const ts = Date.now();

    // 1) Reject explicit false
    const rejectReq = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountType: "candidate",
        fullName: "Policy Reject Test",
        email: `reject-policy-${ts}@gmail.com`,
        password: "StrongPass#2026",
        dataPolicyAccepted: false,
      }),
    });
    const rejectRes = await POST(rejectReq);
    expect(rejectRes.status).toBe(400);
    const rejectBody = await rejectRes.json();
    expect(rejectBody.error.toLowerCase()).toContain("data policy");
    expect(findAuthUserByEmail(`reject-policy-${ts}@gmail.com`)).toBeNull();

    // 2) Accept true -> persists dataPolicyAcceptedAt & dataPolicyVersion
    const acceptEmail = `accept-policy-${ts}@gmail.com`;
    const acceptReq = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountType: "candidate",
        fullName: "Policy Accept Test",
        email: acceptEmail,
        password: "StrongPass#2026",
        dataPolicyAccepted: true,
        city: "Harare",
      }),
    });
    const acceptRes = await POST(acceptReq);
    expect(acceptRes.status).toBe(200);
    const storedAccepted = findAuthUserByEmail(acceptEmail);
    expect(storedAccepted).not.toBeNull();
    expect(storedAccepted?.dataPolicyAcceptedAt).toBeTruthy();
    expect(storedAccepted?.dataPolicyVersion).toBe("2026-11-v1");

    // 3) Omit dataPolicyAccepted -> backward compatible for legacy tests
    const legacyEmail = `legacy-signup-${ts}@gmail.com`;
    const legacyReq = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountType: "candidate",
        fullName: "Legacy Signup Test",
        email: legacyEmail,
        password: "StrongPass#2026",
      }),
    });
    const legacyRes = await POST(legacyReq);
    expect(legacyRes.status).toBe(200);
    const storedLegacy = findAuthUserByEmail(legacyEmail);
    expect(storedLegacy).not.toBeNull();
    expect(storedLegacy?.dataPolicyAcceptedAt).toBeUndefined();

    await deleteAllUserData({
      targetEmail: acceptEmail,
      actorEmail: "compliance-test",
      actorRole: "superuser",
    });
    await deleteAllUserData({
      targetEmail: legacyEmail,
      actorEmail: "compliance-test",
      actorRole: "superuser",
    });
  });

  it("4. Assessment page avoids income/employment survey fields, focuses on remote capability & hub need, and displays AI non-qualification reasons", () => {
    const assessmentPage = readProjectFile("src/app/assessment/page.tsx");
    expect(assessmentPage).not.toContain("monthlyIncomeBracket");
    expect(assessmentPage).not.toContain("employmentStatus");
    expect(assessmentPage).toContain("canWorkRemotely");
    expect(assessmentPage).toContain("hubSupportNeed");
    expect(assessmentPage).toContain("qualificationBreakdown");
    expect(assessmentPage).toContain("reasonsNotQualified");
    expect(assessmentPage).toContain("howToQualify");
    expect(assessmentPage).toContain("aiRoleNotice");
  });

  it("5. DeleteAccountPanel requires typing 'delete' and warns of permanent data erasure, and DELETE /api/auth/account enforces it", async () => {
    const panel = readProjectFile("src/components/DeleteAccountPanel.tsx");
    expect(panel).toContain('confirmText.trim().toLowerCase() === "delete"');
    expect(panel).toContain("erases all your data from the database");
    expect(panel).toContain("This action cannot be undone.");
    expect(panel).toContain('fetch("/api/auth/account"');

    const { DELETE } = await import("@/app/api/auth/account/route");
    const ts = Date.now();
    const email = `self-erase-${ts}@gmail.com`;
    const user = createAuthUser({
      email,
      name: "Self Erase User",
      role: "candidate",
      passwordHash: hashPassword("StrongPass#2026"),
      emailConfirmed: true,
    });
    const cand = registerOrUpdateCandidate({
      fullName: "Self Erase User",
      email,
      phone: "+263771234567",
      city: "Bulawayo",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "Data Science",
      yearsExperience: 2,
      hasDedicatedLaptop: true,
      primaryDevice: "Dedicated Laptop / PC",
      internetAccessType: "Home Fiber / Wi-Fi",
      powerReliabilityHours: 12,
      hasGlobalPaymentRail: true,
      primaryGoal: "International Remote Work",
      currentSkills: ["Python", "SQL"],
    });
    addCandidateDocument({
      userId: user.id,
      candidateId: cand.id,
      candidateEmail: email,
      category: "degree",
      title: "BSc Data Science",
      fileName: "degree.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 128,
      dataUrl: "data:application/pdf;base64,AAAA",
    });
    saveCandidateCvArtifact({
      userId: user.id,
      candidateId: cand.id,
      candidateEmail: email,
      jobId: readStore().jobs[0]?.id,
      jobTitle: "Remote Analyst",
      company: "Test Co",
      generatedCv: {
        fullName: "Self Erase User",
        contactLine: email,
        headline: "Data Analyst",
        summary: "Summary",
        coreSkills: ["SQL"],
        experience: [
          {
            role: "Analyst",
            organization: "Test Org",
            dates: "2024 - Present",
            bullets: ["Delivered reports"],
          },
        ],
        projects: [],
        education: [
          {
            qualification: "BSc Data Science",
            institution: "University of Zimbabwe",
            year: "2023",
          },
        ],
        certifications: [],
        languages: ["English"],
        generatedBy: "utare-deterministic-engine",
      },
      generatedCoverLetter: {
        fullName: "Self Erase User",
        contactLine: email,
        date: "2026-11-19",
        recipient: "Hiring Team",
        subject: "Application",
        greeting: "Hello,",
        paragraphs: ["Opening", "Body", "Closing"],
        signOff: "Regards",
        generatedBy: "utare-deterministic-engine",
      },
    });
    if (readStore().jobs[0]) {
      submitJobApplicationToStore({
        jobId: readStore().jobs[0].id,
        tailoredResumePitch: "Pitch",
        candidateId: cand.id,
        candidateName: "Self Erase User",
        candidateEmail: email,
        sharedWithEmployer: true,
      });
    }

    const token = await signSessionToken({
      sub: user.id,
      email,
      name: user.name,
      role: "candidate",
      emailConfirmed: true,
    });

    // Unauthenticated rejected
    const unauthReq = new NextRequest("http://localhost:3000/api/auth/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationText: "delete" }),
    });
    expect((await DELETE(unauthReq)).status).toBe(401);

    // Wrong confirmation word rejected
    const wrongReq = new NextRequest("http://localhost:3000/api/auth/account", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
      body: JSON.stringify({ confirmationText: "remove" }),
    });
    expect((await DELETE(wrongReq)).status).toBe(400);

    // Exact "delete" erases all user data and clears session cookie
    const okReq = new NextRequest("http://localhost:3000/api/auth/account", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
      body: JSON.stringify({ confirmationText: "delete" }),
    });
    const okRes = await DELETE(okReq);
    expect(okRes.status).toBe(200);
    const okBody = await okRes.json();
    expect(okBody.deleted).toBe(true);
    expect(okBody.removedCounts.users).toBeGreaterThanOrEqual(1);
    expect(okBody.removedCounts.candidates).toBeGreaterThanOrEqual(1);
    expect(okBody.removedCounts.documents).toBeGreaterThanOrEqual(1);
    expect(okBody.removedCounts.cvArtifacts).toBeGreaterThanOrEqual(1);
    expect(okRes.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");

    expect(findAuthUserByEmail(email)).toBeNull();
    expect(findCandidateByEmail(email)).toBeNull();
  });

  it("6a. Retention logic enforces 365-day inactivity + 3 email notices, resets on remain confirmation/login, and purges only after both conditions are met", async () => {
    expect(INACTIVITY_THRESHOLD_DAYS).toBe(365);
    expect(REQUIRED_INACTIVITY_EMAILS).toBe(3);

    const ts = Date.now();
    const email = `retention-check-${ts}@gmail.com`;
    const user = createAuthUser({
      email,
      name: "Retention Test User",
      role: "candidate",
      passwordHash: hashPassword("StrongPass#2026"),
      emailConfirmed: true,
    });

    // Even with 3 notices, < 365 days inactive must NOT be eligible for deletion
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    const recentStatus = listInactivityRetentionStatus().find((s) => s.email === email);
    expect(recentStatus?.isOverOneYearInactive).toBe(false);
    expect(recentStatus?.eligibleForDeletion).toBe(false);

    const blockedRecent = await purgeInactiveAccountAfterNotices({
      targetEmail: email,
      actorEmail: "superuser@utare.co.zw",
    });
    expect(blockedRecent.ok).toBe(false);
    expect(blockedRecent.error).toContain("365 days");

    // confirmUserRemainOnPlatform resets notices to 0
    const reset = confirmUserRemainOnPlatform(email);
    expect(reset?.inactivityNoticesSent).toBe(0);
    expect(reset?.remainConfirmedAt).toBeTruthy();

    // Backdate > 365 days with < 3 notices -> blocked
    const state = readStore();
    state.users.find((u) => u.id === user.id)!.lastActiveAt = new Date(
      Date.now() - 370 * 24 * 60 * 60 * 1000
    ).toISOString();
    writeStore(state);

    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    const blockedNotices = await purgeInactiveAccountAfterNotices({
      targetEmail: email,
      actorEmail: "superuser@utare.co.zw",
    });
    expect(blockedNotices.ok).toBe(false);
    expect(blockedNotices.error).toContain("3");

    // 3rd notice -> eligible & purged
    recordInactivityNoticeEmail({ emailOrId: email, actorEmail: "superuser@utare.co.zw" });
    const eligibleStatus = listInactivityRetentionStatus().find((s) => s.email === email);
    expect(eligibleStatus?.isOverOneYearInactive).toBe(true);
    expect(eligibleStatus?.noticesSent).toBe(3);
    expect(eligibleStatus?.eligibleForDeletion).toBe(true);

    const purged = await purgeInactiveAccountAfterNotices({
      targetEmail: email,
      actorEmail: "superuser@utare.co.zw",
    });
    expect(purged.ok).toBe(true);
    expect(purged.deleted).toBe(true);
    expect(findAuthUserByEmail(email)).toBeNull();
  });

  it("6b. AI qualificationBreakdown transparently explains qualification and non-qualification across all readiness tiers", () => {
    const base: CandidateProfile = {
      fullName: "Transparency Check",
      email: "transp@example.co.zw",
      phone: "+263770000000",
      city: "Harare",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "Computer Science",
      yearsExperience: 2,
      canWorkRemotely: true,
      hubSupportNeed: "Fully Independent (Have Reliable Device, Power & Internet)",
      hasDedicatedLaptop: true,
      primaryDevice: "Dedicated Laptop / PC",
      internetAccessType: "Starlink",
      powerReliabilityHours: 16,
      hasGlobalPaymentRail: true,
      primaryGoal: "International Remote Work",
      currentSkills: ["Python", "SQL", "React"],
    };

    // Tier 1: Market-Ready
    const marketReady = computeAssessmentScores(base, {
      domainProblemSolving: 90,
      digitalTools: 90,
      asyncWorkflow: 90,
      clientComms: 90,
    });
    expect(marketReady.readinessTier).toBe("Market-Ready (Direct Placement)");
    expect(marketReady.qualificationBreakdown?.qualifiedFor.length).toBeGreaterThan(0);
    expect(marketReady.qualificationBreakdown?.notQualifiedYetFor).toEqual([]);
    expect(marketReady.qualificationBreakdown?.aiRoleNotice).toContain("How this AI decision works");

    // Tier 2: Bridge-Ready (no laptop)
    const bridgeReady = computeAssessmentScores(
      { ...base, hasDedicatedLaptop: false, primaryDevice: "Smartphone Only", canWorkRemotely: false },
      { domainProblemSolving: 80, digitalTools: 75, asyncWorkflow: 75, clientComms: 80 }
    );
    expect(bridgeReady.readinessTier).toBe("Bridge-Ready (Hub + Rapid Upskilling)");
    expect(bridgeReady.qualificationBreakdown?.notQualifiedYetFor).toContain(
      "Market-Ready (Direct Placement) tier"
    );
    expect(bridgeReady.qualificationBreakdown?.reasonsNotQualified.length).toBeGreaterThan(0);
    expect(bridgeReady.qualificationBreakdown?.howToQualify.length).toBeGreaterThan(0);

    // Tier 3: Foundation Track (no laptop + low power)
    const foundation = computeAssessmentScores(
      {
        ...base,
        highestQualification: "O-Level / Secondary Leaver",
        hasDedicatedLaptop: false,
        primaryDevice: "Smartphone Only",
        internetAccessType: "Mobile Data Bundles Only",
        powerReliabilityHours: 4,
        hasGlobalPaymentRail: false,
        currentSkills: [],
      },
      { domainProblemSolving: 40, digitalTools: 40, asyncWorkflow: 40, clientComms: 40 }
    );
    expect(foundation.readinessTier).toBe(
      "Foundation Track (Hardware Bridge + Intensive Coaching)"
    );
    expect(foundation.qualificationBreakdown?.notQualifiedYetFor).toContain("Bridge-Ready roles");
    expect(foundation.qualificationBreakdown?.notQualifiedYetFor).toContain(
      "Market-Ready (Direct Placement) roles"
    );
    expect(foundation.qualificationBreakdown?.reasonsNotQualified.length).toBeGreaterThan(0);
    expect(foundation.qualificationBreakdown?.howToQualify.length).toBeGreaterThan(0);
  });
});
