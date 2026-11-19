import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth-session";
import { hashPassword } from "@/lib/password-hash";
import {
  addCandidateDocument,
  addJobToStore,
  createAuthUser,
  deleteAllUserData,
  deleteHubFromStore,
  deleteJobFromStore,
  listCandidateCvArtifacts,
  readStore,
  registerOrUpdateCandidate,
  reportJobListing,
  saveEmployerRegistration,
  submitJobApplicationToStore,
  writeStore,
} from "@/lib/store";
import { UserRole } from "@/types";

// Mock Supabase client so tests run deterministically against the backend store
// without external network calls.
vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: false,
  supabase: null,
  getSupabaseAdmin: () => null,
  getSupabaseServer: () => null,
}));

vi.mock("@/lib/email-domain-check", () => ({
  checkEmailDomain: async () => "deliverable",
}));

async function buildAuthedRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    user?: {
      sub: string;
      email: string;
      name: string;
      role: UserRole;
      companyName?: string;
    };
    cookieToken?: string;
  } = {}
): Promise<NextRequest> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let token = options.cookieToken;
  if (!token && options.user) {
    token = await signSessionToken({
      sub: options.user.sub,
      email: options.user.email,
      name: options.user.name,
      role: options.user.role,
      emailConfirmed: true,
      companyName: options.user.companyName,
    });
  }

  if (token) {
    headers["Cookie"] = `${SESSION_COOKIE_NAME}=${token}`;
  }

  return new NextRequest(url, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

describe("UTARE ZEM AI — Security, Authorization, Superuser Boundaries & PII Audit", () => {
  const ts = Date.now();

  const candAEmail = `sec-cand-a-${ts}@example.co.zw`;
  const candBEmail = `sec-cand-b-${ts}@example.co.zw`;
  const empAEmail = `sec-emp-a-${ts}@company-a.co.zw`;
  const empBEmail = `sec-emp-b-${ts}@company-b.co.zw`;
  const adminEmail = `sec-admin-${ts}@utare.co.zw`;
  const superEmail = `sec-super-${ts}@utare.co.zw`;
  const targetUserEmail = `sec-target-${ts}@example.co.zw`;
  const inactiveEmail = `sec-inactive-${ts}@example.co.zw`;

  let candAId = "";
  let candBId = "";
  let empAId = "";
  let empBId = "";
  let empARegId = "";
  let adminId = "";
  let superId = "";
  let targetUserId = "";
  let inactiveUserId = "";

  let empAJobId = "";
  let reportedJobId = "";
  let candADocId = "";
  let candAAppId = "";
  let candBAppId = "";

  const createdJobIds: string[] = [];
  const createdHubIds: string[] = [];
  const createdEmails: string[] = [
    candAEmail,
    candBEmail,
    empAEmail,
    empBEmail,
    adminEmail,
    superEmail,
    targetUserEmail,
    inactiveEmail,
  ];

  beforeAll(async () => {
    process.env.SUPERUSER_EMAILS = `${superEmail},${process.env.SUPERUSER_EMAILS || ""}`;

    const pwHash = hashPassword("StrongPass#2026");

    const candAUser = createAuthUser({
      email: candAEmail,
      name: "Shared Name",
      role: "candidate",
      passwordHash: pwHash,
      emailConfirmed: true,
    });
    candAId = candAUser.id;

    const candBUser = createAuthUser({
      email: candBEmail,
      name: "Shared Name",
      role: "candidate",
      passwordHash: pwHash,
      emailConfirmed: true,
    });
    candBId = candBUser.id;

    const empAReg = saveEmployerRegistration({
      companyName: `Sec Corp ${ts}`,
      contactPerson: "Employer A",
      email: empAEmail,
      industry: "Software",
      rolesInterested: ["Backend"],
      hiringModel: "100% Remote Contract",
      estimatedHires: 2,
      timezoneOverlapNeeded: "CAT (GMT+2)",
      verificationStatus: "verified",
    });
    empARegId = empAReg.id;

    const empAUser = createAuthUser({
      email: empAEmail,
      name: "Employer A",
      role: "employer",
      passwordHash: pwHash,
      emailConfirmed: true,
      employerId: empAReg.id,
      companyName: empAReg.companyName,
    });
    empAId = empAUser.id;

    const empBReg = saveEmployerRegistration({
      // Deliberately matching companyName to verify company-name spoofing cannot hijack Employer A's jobs
      companyName: `Sec Corp ${ts}`,
      contactPerson: "Employer B",
      email: empBEmail,
      industry: "Software",
      rolesInterested: ["Backend"],
      hiringModel: "100% Remote Contract",
      estimatedHires: 1,
      timezoneOverlapNeeded: "CAT (GMT+2)",
      verificationStatus: "verified",
    });

    const empBUser = createAuthUser({
      email: empBEmail,
      name: "Employer B",
      role: "employer",
      passwordHash: pwHash,
      emailConfirmed: true,
      employerId: empBReg.id,
      companyName: empBReg.companyName,
    });
    empBId = empBUser.id;

    const adminUser = createAuthUser({
      email: adminEmail,
      name: "Regular Admin",
      role: "admin",
      passwordHash: pwHash,
      emailConfirmed: true,
    });
    adminId = adminUser.id;

    const superUser = createAuthUser({
      email: superEmail,
      name: "Platform Superuser",
      role: "superuser",
      passwordHash: pwHash,
      emailConfirmed: true,
    });
    superId = superUser.id;

    const targetUser = createAuthUser({
      email: targetUserEmail,
      name: "Target Candidate",
      role: "candidate",
      passwordHash: pwHash,
      emailConfirmed: true,
    });
    targetUserId = targetUser.id;

    const inactiveUser = createAuthUser({
      email: inactiveEmail,
      name: "Inactive Candidate",
      role: "candidate",
      passwordHash: pwHash,
      emailConfirmed: true,
    });
    inactiveUserId = inactiveUser.id;

    // Backdate inactive user > 365 days
    const st = readStore();
    const iu = st.users.find((u) => u.id === inactiveUserId);
    if (iu) {
      iu.lastActiveAt = new Date(
        Date.now() - 400 * 24 * 60 * 60 * 1000
      ).toISOString();
      writeStore(st);
    }

    // Register full candidate profiles with sensitive fields
    const candARec = registerOrUpdateCandidate({
      fullName: "Shared Name",
      email: candAEmail,
      phone: "+263771000111",
      city: "Harare",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "Computer Science",
      yearsExperience: 3,
      employmentStatus: "Survival Gig (Misaligned)",
      monthlyIncomeBracket: "$1 - $150 / mo",
      hasDedicatedLaptop: false,
      primaryDevice: "Smartphone Only",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 4,
      hasGlobalPaymentRail: false,
      primaryGoal: "International Remote Work",
      currentSkills: ["TypeScript", "SQL"],
    });

    const candBRec = registerOrUpdateCandidate({
      fullName: "Shared Name",
      email: candBEmail,
      phone: "+263772000222",
      city: "Bulawayo",
      highestQualification: "Bachelors Degree",
      fieldOfStudy: "Finance",
      yearsExperience: 2,
      employmentStatus: "Unemployed",
      monthlyIncomeBracket: "$0 (Zero Income)",
      hasDedicatedLaptop: true,
      primaryDevice: "Dedicated Laptop / PC",
      internetAccessType: "Home Fiber / Wi-Fi",
      powerReliabilityHours: 14,
      hasGlobalPaymentRail: true,
      primaryGoal: "International Remote Work",
      currentSkills: ["Excel", "Accounting"],
    });

    const docA = await addCandidateDocument({
      userId: candAId,
      candidateEmail: candAEmail,
      category: "degree",
      title: "BSc CS",
      fileName: "degree.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
      dataUrl: "data:application/pdf;base64,JVBERi0=",
    });
    candADocId = docA.id;

    empAJobId = `sec-job-emp-${ts}`;
    addJobToStore({
      id: empAJobId,
      title: "Senior TypeScript Engineer",
      company: empAReg.companyName,
      employerId: empAReg.id,
      employerEmail: empAEmail,
      category: "Engineering",
      compensationUsdMonthly: "$1,500 / mo",
      supportedPaymentRails: ["Deel"],
      requiredSkills: ["TypeScript", "SQL"],
      minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
      isAsyncFriendly: true,
      description: "Remote TS role.",
      applicationUrl: "#apply",
      status: "approved",
      discoveredBy: "employer-posted",
    });
    createdJobIds.push(empAJobId);

    reportedJobId = `sec-job-reported-${ts}`;
    addJobToStore({
      id: reportedJobId,
      title: "Flagged Scam Listing",
      company: empAReg.companyName,
      employerId: empAReg.id,
      employerEmail: empAEmail,
      category: "Operations",
      compensationUsdMonthly: "$9,000 / mo",
      supportedPaymentRails: ["Deel"],
      requiredSkills: ["Excel"],
      minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
      isAsyncFriendly: true,
      description: "Flagged test job.",
      applicationUrl: "#apply",
      status: "approved",
      discoveredBy: "employer-posted",
    });
    createdJobIds.push(reportedJobId);
    reportJobListing({
      jobId: reportedJobId,
      reason: "Upfront fee scam",
      details: "Asked for deposit",
      reportedByEmail: candAEmail,
      reportedByName: "Shared Name",
    });

    const appA = submitJobApplicationToStore({
      jobId: empAJobId,
      tailoredResumePitch: "Candidate A secret pitch",
      candidateId: candARec.id,
      candidateName: "Shared Name",
      candidateEmail: candAEmail,
      sharedWithEmployer: true,
    });
    candAAppId = appA!.id;

    const appB = submitJobApplicationToStore({
      jobId: empAJobId,
      tailoredResumePitch: "Candidate B secret pitch",
      candidateId: candBRec.id,
      candidateName: "Shared Name",
      candidateEmail: candBEmail,
      sharedWithEmployer: false,
    });
    candBAppId = appB!.id;
  });

  afterAll(async () => {
    for (const email of createdEmails) {
      await deleteAllUserData({
        targetEmail: email,
        actorEmail: "security-test-cleanup",
        actorRole: "superuser",
        reason: "Cleanup after area-security tests",
      });
    }
    for (const jobId of createdJobIds) {
      deleteJobFromStore(jobId);
    }
    for (const hubId of createdHubIds) {
      deleteHubFromStore(hubId);
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Unauthenticated Access & Token Integrity
  // ---------------------------------------------------------------------------
  describe("1. Unauthenticated Access & Session Token Integrity", () => {
    it("rejects tampered, malformed, and expired session tokens", async () => {
      const validToken = await signSessionToken({
        sub: candAId,
        email: candAEmail,
        name: "Shared Name",
        role: "candidate",
        emailConfirmed: true,
      });
      const [payloadPart, sigPart] = validToken.split(".");
      const tamperedPayload = Buffer.from(
        JSON.stringify({
          sub: candAId,
          email: candAEmail,
          name: "Shared Name",
          role: "superuser",
          emailConfirmed: true,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ).toString("base64url");

      expect(await verifySessionToken(`${tamperedPayload}.${sigPart}`)).toBeNull();
      expect(await verifySessionToken(`${payloadPart}.invalidsig`)).toBeNull();
      expect(await verifySessionToken("not-a-jwt")).toBeNull();

      const expiredToken = await signSessionToken(
        {
          sub: candAId,
          email: candAEmail,
          name: "Shared Name",
          role: "candidate",
          emailConfirmed: true,
        },
        -10
      );
      expect(await verifySessionToken(expiredToken)).toBeNull();
    });

    it("rejects unauthenticated requests across all protected endpoints", async () => {
      const accountRoute = await import("@/app/api/auth/account/route");
      const reportRoute = await import("@/app/api/jobs/report/route");
      const jobsRoute = await import("@/app/api/jobs/route");
      const portalRoute = await import("@/app/api/employer/portal/route");
      const employersRoute = await import("@/app/api/employers/route");
      const adminCandRoute = await import("@/app/api/admin/candidates/route");
      const adminHubsRoute = await import("@/app/api/admin/hubs/route");
      const adminJobsRoute = await import("@/app/api/admin/jobs/route");
      const adminUsersRoute = await import("@/app/api/admin/users/route");
      const attachmentsRoute = await import("@/app/api/auth/attachments/route");
      const profileRoute = await import("@/app/api/auth/profile/route");
      const pathwayRoute = await import("@/app/api/pathway/route");
      const hubsRoute = await import("@/app/api/hubs/route");
      const aiStatusRoute = await import("@/app/api/ai/status/route");
      const passwordRoute = await import("@/app/api/auth/password/route");

      const calls: Promise<Response>[] = [
        accountRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/auth/account", {
            method: "POST",
            body: { action: "confirm_remain" },
          })
        ),
        accountRoute.DELETE(
          await buildAuthedRequest("http://localhost:3000/api/auth/account", {
            method: "DELETE",
            body: { confirmationText: "delete" },
          })
        ),
        reportRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/jobs/report", {
            method: "POST",
            body: { jobId: empAJobId, reason: "Test" },
          })
        ),
        jobsRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/jobs", {
            method: "POST",
            body: {
              jobId: empAJobId,
              tailoredResumePitch: "Pitch",
              sharedWithEmployer: true,
            },
          })
        ),
        jobsRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/jobs", {
            method: "PATCH",
            body: { applicationId: candAAppId, sharedWithEmployer: false },
          })
        ),
        portalRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/employer/portal")
        ),
        portalRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
            method: "POST",
            body: { title: "Role", description: "Desc" },
          })
        ),
        portalRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
            method: "PATCH",
            body: { action: "update_job_status", jobId: empAJobId, status: "archived" },
          })
        ),
        employersRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/employers")
        ),
        employersRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/employers", {
            method: "PATCH",
            body: { employerId: empARegId, verificationStatus: "verified" },
          })
        ),
        adminCandRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/candidates")
        ),
        adminHubsRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/hubs")
        ),
        adminHubsRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/admin/hubs", {
            method: "POST",
            body: { name: "H", city: "Harare", address: "1 Main" },
          })
        ),
        adminHubsRoute.DELETE(
          await buildAuthedRequest(
            "http://localhost:3000/api/admin/hubs?id=hub-1",
            { method: "DELETE" }
          )
        ),
        adminJobsRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/jobs")
        ),
        adminJobsRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/admin/jobs", {
            method: "POST",
            body: { title: "Test", company: "Test Co" },
          })
        ),
        adminJobsRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/admin/jobs", {
            method: "PATCH",
            body: { jobId: empAJobId, status: "archived" },
          })
        ),
        adminJobsRoute.DELETE(
          await buildAuthedRequest(
            `http://localhost:3000/api/admin/jobs?id=${empAJobId}`,
            { method: "DELETE" }
          )
        ),
        adminUsersRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/users")
        ),
        adminUsersRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/admin/users", {
            method: "PATCH",
            body: { email: candAEmail, role: "admin" },
          })
        ),
        adminUsersRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            body: { action: "send_inactivity_notice", email: inactiveEmail },
          })
        ),
        adminUsersRoute.DELETE(
          await buildAuthedRequest("http://localhost:3000/api/admin/users", {
            method: "DELETE",
            body: { email: targetUserEmail, confirmationText: "delete" },
          })
        ),
        attachmentsRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/auth/attachments")
        ),
        attachmentsRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/auth/attachments", {
            method: "POST",
            body: {
              title: "Doc",
              fileName: "doc.pdf",
              dataUrl: "data:application/pdf;base64,AA==",
            },
          })
        ),
        attachmentsRoute.DELETE(
          await buildAuthedRequest(
            `http://localhost:3000/api/auth/attachments?id=${candADocId}`,
            { method: "DELETE" }
          )
        ),
        profileRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/auth/profile", {
            method: "POST",
            body: { fullName: "Attacker", email: candAEmail },
          })
        ),
        // Ensure legacy mode: "register" cannot bypass authentication on /api/auth/profile
        profileRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/auth/profile", {
            method: "POST",
            body: {
              mode: "register",
              profile: { fullName: "Bypass", email: adminEmail },
            },
          })
        ),
        pathwayRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/pathway", {
            method: "PATCH",
            body: { confirmCoaching: true },
          })
        ),
        hubsRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/hubs", {
            method: "POST",
            body: { name: "Rogue Hub", city: "Harare", address: "123 St" },
          })
        ),
        aiStatusRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/ai/status", {
            method: "POST",
            body: { apiKey: "fake-key", model: "gemini-2.5-flash" },
          })
        ),
        passwordRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/auth/password", {
            method: "POST",
            body: {
              mode: "change",
              currentPassword: "StrongPass#2026",
              newPassword: "NewStrong#2026",
            },
          })
        ),
        passwordRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/auth/password", {
            method: "POST",
            body: {
              mode: "admin-reset",
              email: candAEmail,
              newPassword: "NewStrong#2026",
            },
          })
        ),
      ];

      const responses = await Promise.all(calls);
      for (const res of responses) {
        expect(res.status).toBe(401);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Role Boundaries & Superuser-Only Boundaries
  // ---------------------------------------------------------------------------
  describe("2. Role & Superuser Authorization Boundaries", () => {
    it("enforces middleware redirects for wrong-role page visits", async () => {
      const { middleware } = await import("@/middleware");
      const candSession = {
        sub: candAId,
        email: candAEmail,
        name: "Shared Name",
        role: "candidate" as const,
      };

      const adminPageReq = await buildAuthedRequest(
        "http://localhost:3000/admin",
        { user: candSession }
      );
      const adminRes = await middleware(adminPageReq);
      expect(adminRes.status).toBe(307);
      expect(adminRes.headers.get("location")).toContain("/login");

      const employerPageReq = await buildAuthedRequest(
        "http://localhost:3000/employer",
        { user: candSession }
      );
      const empRes = await middleware(employerPageReq);
      expect(empRes.status).toBe(307);
      expect(empRes.headers.get("location")).toContain("/login");
    });

    it("blocks candidates from all /api/admin/* and /api/employer/portal routes", async () => {
      const candUser = {
        sub: candAId,
        email: candAEmail,
        name: "Shared Name",
        role: "candidate" as const,
      };

      const adminCandRoute = await import("@/app/api/admin/candidates/route");
      const adminHubsRoute = await import("@/app/api/admin/hubs/route");
      const adminJobsRoute = await import("@/app/api/admin/jobs/route");
      const adminUsersRoute = await import("@/app/api/admin/users/route");
      const portalRoute = await import("@/app/api/employer/portal/route");
      const employersRoute = await import("@/app/api/employers/route");

      const candidateBlocked = await Promise.all([
        adminCandRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/candidates", {
            user: candUser,
          })
        ),
        adminHubsRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/hubs", {
            user: candUser,
          })
        ),
        adminHubsRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/admin/hubs", {
            method: "POST",
            user: candUser,
            body: { name: "H", city: "Harare", address: "Addr" },
          })
        ),
        adminJobsRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/jobs", {
            user: candUser,
          })
        ),
        adminJobsRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/admin/jobs", {
            method: "POST",
            user: candUser,
            body: { title: "J", company: "C" },
          })
        ),
        adminUsersRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/admin/users", {
            user: candUser,
          })
        ),
        adminUsersRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/admin/users", {
            method: "PATCH",
            user: candUser,
            body: { email: candAEmail, role: "superuser" },
          })
        ),
        employersRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/employers", {
            user: candUser,
          })
        ),
        portalRoute.GET(
          await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
            user: candUser,
          })
        ),
        portalRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
            method: "POST",
            user: candUser,
            body: { title: "Role", description: "Desc" },
          })
        ),
        portalRoute.PATCH(
          await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
            method: "PATCH",
            user: candUser,
            body: {
              action: "update_application_status",
              applicationId: candAAppId,
              status: "shortlisted",
            },
          })
        ),
      ]);

      for (const res of candidateBlocked) {
        expect(res.status).toBe(401);
      }
    });

    it("prevents regular admins from performing superuser-only actions (403)", async () => {
      const adminUser = {
        sub: adminId,
        email: adminEmail,
        name: "Regular Admin",
        role: "admin" as const,
      };

      const adminJobsRoute = await import("@/app/api/admin/jobs/route");
      const adminUsersRoute = await import("@/app/api/admin/users/route");

      // 1. Cannot evaluate/restore/remove reported jobs
      const evalRes = await adminJobsRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/admin/jobs", {
          method: "PATCH",
          user: adminUser,
          body: {
            action: "evaluate_report",
            jobId: reportedJobId,
            decision: "restore",
          },
        })
      );
      expect(evalRes.status).toBe(403);

      // 2. Cannot directly change status of a reported job back to approved
      const statusRes = await adminJobsRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/admin/jobs", {
          method: "PATCH",
          user: adminUser,
          body: { jobId: reportedJobId, status: "approved" },
        })
      );
      expect(statusRes.status).toBe(403);

      // 3. Cannot delete a reported job
      const delJobRes = await adminJobsRoute.DELETE(
        await buildAuthedRequest(
          `http://localhost:3000/api/admin/jobs?id=${reportedJobId}`,
          { method: "DELETE", user: adminUser }
        )
      );
      expect(delJobRes.status).toBe(403);

      // 4. Cannot grant superuser role or demote a superuser
      const grantSuperRes = await adminUsersRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "PATCH",
          user: adminUser,
          body: { email: candAEmail, role: "superuser" },
        })
      );
      expect(grantSuperRes.status).toBe(403);

      const modifySuperRes = await adminUsersRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "PATCH",
          user: adminUser,
          body: { email: superEmail, role: "candidate" },
        })
      );
      expect(modifySuperRes.status).toBe(403);

      // 5. Cannot send inactivity notice or purge inactive account
      const noticeRes = await adminUsersRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          user: adminUser,
          body: { action: "send_inactivity_notice", email: inactiveEmail },
        })
      );
      expect(noticeRes.status).toBe(403);

      const purgeRes = await adminUsersRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          user: adminUser,
          body: { action: "purge_inactive", email: inactiveEmail },
        })
      );
      expect(purgeRes.status).toBe(403);

      // 6. Cannot delete user data on request
      const deleteUserRes = await adminUsersRoute.DELETE(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "DELETE",
          user: adminUser,
          body: { email: targetUserEmail, confirmationText: "delete" },
        })
      );
      expect(deleteUserRes.status).toBe(403);
    });

    it("allows superuser to moderate reported jobs, manage retention, and delete user data on request", async () => {
      const superUser = {
        sub: superId,
        email: superEmail,
        name: "Platform Superuser",
        role: "superuser" as const,
      };
      const adminJobsRoute = await import("@/app/api/admin/jobs/route");
      const adminUsersRoute = await import("@/app/api/admin/users/route");

      // Superuser restores reported job
      const restoreRes = await adminJobsRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/admin/jobs", {
          method: "PATCH",
          user: superUser,
          body: {
            action: "evaluate_report",
            jobId: reportedJobId,
            decision: "restore",
            note: "Cleared after audit",
          },
        })
      );
      expect(restoreRes.status).toBe(200);
      const restoreData = await restoreRes.json();
      expect(restoreData.job.status).toBe("approved");

      // Superuser cannot purge inactive user before 3 notices
      const prematurePurge = await adminUsersRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          user: superUser,
          body: { action: "purge_inactive", email: inactiveEmail },
        })
      );
      expect(prematurePurge.status).toBe(400);

      // Superuser sends 3 inactivity notices, then purges
      for (let i = 0; i < 3; i++) {
        const nRes = await adminUsersRoute.POST(
          await buildAuthedRequest("http://localhost:3000/api/admin/users", {
            method: "POST",
            user: superUser,
            body: { action: "send_inactivity_notice", email: inactiveEmail },
          })
        );
        expect(nRes.status).toBe(200);
      }

      const purgeRes = await adminUsersRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "POST",
          user: superUser,
          body: { action: "purge_inactive", email: inactiveEmail },
        })
      );
      expect(purgeRes.status).toBe(200);
      expect(readStore().users.some((u) => u.email === inactiveEmail)).toBe(false);

      // Superuser cannot delete self via /api/admin/users DELETE
      const selfDelBlock = await adminUsersRoute.DELETE(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "DELETE",
          user: superUser,
          body: { email: superEmail, confirmationText: "delete" },
        })
      );
      expect(selfDelBlock.status).toBe(400);

      // Superuser deletes another user on request when confirmationText === "delete"
      const delBadConfirm = await adminUsersRoute.DELETE(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "DELETE",
          user: superUser,
          body: { email: targetUserEmail, confirmationText: "confirm" },
        })
      );
      expect(delBadConfirm.status).toBe(400);

      const delOk = await adminUsersRoute.DELETE(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          method: "DELETE",
          user: superUser,
          body: { email: targetUserEmail, confirmationText: "delete" },
        })
      );
      expect(delOk.status).toBe(200);
      expect(readStore().users.some((u) => u.email === targetUserEmail)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Self-Deletion Safeguards
  // ---------------------------------------------------------------------------
  describe("3. Self-Deletion (/api/auth/account DELETE)", () => {
    it("strictly requires confirmationText === 'delete' and only deletes the session user", async () => {
      const victimEmail = `sec-victim-${ts}@example.co.zw`;
      const selfEmail = `sec-self-${ts}@example.co.zw`;
      createdEmails.push(victimEmail, selfEmail);

      const victim = createAuthUser({
        email: victimEmail,
        name: "Victim User",
        role: "candidate",
        passwordHash: hashPassword("StrongPass#2026"),
        emailConfirmed: true,
      });
      const self = createAuthUser({
        email: selfEmail,
        name: "Self User",
        role: "candidate",
        passwordHash: hashPassword("StrongPass#2026"),
        emailConfirmed: true,
      });

      const accountRoute = await import("@/app/api/auth/account/route");
      const selfSession = {
        sub: self.id,
        email: selfEmail,
        name: "Self User",
        role: "candidate" as const,
      };

      // Wrong confirmation texts rejected
      for (const badText of ["", "yes", "confirm", "remove", "delet"]) {
        const badRes = await accountRoute.DELETE(
          await buildAuthedRequest("http://localhost:3000/api/auth/account", {
            method: "DELETE",
            user: selfSession,
            body: { confirmationText: badText, email: victimEmail },
          })
        );
        expect(badRes.status).toBe(400);
      }

      // Valid confirmationText === "delete" with body-supplied victim email:
      // MUST ignore body email and only delete selfEmail!
      const okRes = await accountRoute.DELETE(
        await buildAuthedRequest("http://localhost:3000/api/auth/account", {
          method: "DELETE",
          user: selfSession,
          body: {
            confirmationText: "delete",
            email: victimEmail,
            userId: victim.id,
          },
        })
      );
      expect(okRes.status).toBe(200);
      expect(okRes.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");

      const after = readStore();
      expect(after.users.some((u) => u.email === selfEmail)).toBe(false);
      expect(after.users.some((u) => u.email === victimEmail)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Employer Portal PII Minimization, Consent & Cross-Employer Isolation
  // ---------------------------------------------------------------------------
  describe("4. Employer Portal Privacy, Consent & Isolation", () => {
    it("strips private candidate fields, hides unshared applications, and blocks cross-employer access", async () => {
      const portalRoute = await import("@/app/api/employer/portal/route");

      const empASession = {
        sub: empAId,
        email: empAEmail,
        name: "Employer A",
        role: "employer" as const,
        companyName: `Sec Corp ${ts}`,
      };
      const empBSession = {
        sub: empBId,
        email: empBEmail,
        name: "Employer B",
        role: "employer" as const,
        companyName: `Sec Corp ${ts}`,
      };

      // Employer A sees candAAppId (sharedWithEmployer: true) but NOT candBAppId (sharedWithEmployer: false)
      const resA = await portalRoute.GET(
        await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
          user: empASession,
        })
      );
      expect(resA.status).toBe(200);
      const dataA = await resA.json();

      const appAView = dataA.applicants.find(
        (a: { id: string }) => a.id === candAAppId
      );
      expect(appAView).toBeDefined();
      expect(
        dataA.applicants.some((a: { id: string }) => a.id === candBAppId)
      ).toBe(false);

      // Private fields MUST be stripped
      expect(appAView.phone).toBeUndefined();
      expect(appAView.monthlyIncomeBracket).toBeUndefined();
      expect(appAView.employmentStatus).toBeUndefined();
      expect(appAView.hasDedicatedLaptop).toBeUndefined();
      expect(appAView.primaryDevice).toBeUndefined();
      expect(appAView.internetAccessType).toBeUndefined();
      expect(appAView.powerReliabilityHours).toBeUndefined();
      expect(appAView.hasGlobalPaymentRail).toBeUndefined();
      expect(appAView.assessment).toBeUndefined();
      expect(appAView.pathway).toBeUndefined();

      // Employer A cannot mutate unshared application
      const unsharedPatch = await portalRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
          method: "PATCH",
          user: empASession,
          body: {
            action: "update_application_status",
            applicationId: candBAppId,
            status: "shortlisted",
          },
        })
      );
      expect(unsharedPatch.status).toBe(404);

      // Employer B (even with identical companyName!) sees 0 of Employer A's jobs/applicants
      const resB = await portalRoute.GET(
        await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
          user: empBSession,
        })
      );
      expect(resB.status).toBe(200);
      const dataB = await resB.json();
      expect(
        dataB.jobs.some((j: { id: string }) => j.id === empAJobId)
      ).toBe(false);
      expect(
        dataB.applicants.some((a: { id: string }) => a.id === candAAppId)
      ).toBe(false);

      const crossEmpPatch = await portalRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
          method: "PATCH",
          user: empBSession,
          body: {
            action: "update_application_status",
            applicationId: candAAppId,
            status: "rejected",
          },
        })
      );
      expect(crossEmpPatch.status).toBe(404);

      // Employer cannot restore a reported job via update_job_status
      reportJobListing({
        jobId: reportedJobId,
        reason: "Re-flagged",
        reportedByEmail: candAEmail,
      });
      const restoreAttempt = await portalRoute.PATCH(
        await buildAuthedRequest("http://localhost:3000/api/employer/portal", {
          method: "PATCH",
          user: empASession,
          body: {
            action: "update_job_status",
            jobId: reportedJobId,
            status: "approved",
          },
        })
      );
      expect(restoreAttempt.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. PII Protection & Authorization Across Remaining API Routes
  // ---------------------------------------------------------------------------
  describe("5. Cross-Route PII Protection & Authorization Audit", () => {
    it("prevents PII leaks on /api/hubs, /api/pathway, /api/jobs, /api/auth/profile, /api/auth/attachments, and /api/admin/users", async () => {
      const hubsRoute = await import("@/app/api/hubs/route");
      const pathwayRoute = await import("@/app/api/pathway/route");
      const jobsRoute = await import("@/app/api/jobs/route");
      const profileRoute = await import("@/app/api/auth/profile/route");
      const attachmentsRoute = await import("@/app/api/auth/attachments/route");
      const documentsRoute = await import("@/app/api/documents/route");
      const adminUsersRoute = await import("@/app/api/admin/users/route");

      const candASession = {
        sub: candAId,
        email: candAEmail,
        name: "Shared Name",
        role: "candidate" as const,
      };

      // /api/hubs?email=victim unauthenticated must NOT leak activeCandidate
      const hubsUnauthRes = await hubsRoute.GET(
        await buildAuthedRequest(
          `http://localhost:3000/api/hubs?email=${encodeURIComponent(candBEmail)}`
        )
      );
      expect(hubsUnauthRes.status).toBe(200);
      const hubsUnauthData = await hubsUnauthRes.json();
      expect(hubsUnauthData.activeCandidate).toBeNull();

      // /api/hubs?email=candB as candA must NOT return candB's record
      const hubsCrossRes = await hubsRoute.GET(
        await buildAuthedRequest(
          `http://localhost:3000/api/hubs?email=${encodeURIComponent(candBEmail)}`,
          { user: candASession }
        )
      );
      const hubsCrossData = await hubsCrossRes.json();
      expect(hubsCrossData.activeCandidate?.profile?.email).toBe(candAEmail);

      // /api/pathway?email=candB unauthenticated returns null; as candA returns candA (never candB)
      const pathwayUnauth = await pathwayRoute.GET(
        await buildAuthedRequest(
          `http://localhost:3000/api/pathway?email=${encodeURIComponent(candBEmail)}`
        )
      );
      expect((await pathwayUnauth.json()).activeCandidate).toBeNull();

      const pathwayCross = await pathwayRoute.GET(
        await buildAuthedRequest(
          `http://localhost:3000/api/pathway?email=${encodeURIComponent(candBEmail)}`,
          { user: candASession }
        )
      );
      expect((await pathwayCross.json()).activeCandidate?.profile?.email).toBe(
        candAEmail
      );

      // Unauthenticated POST /api/pathway must NOT overwrite candB's record in store
      const pathwayOverwrite = await pathwayRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/pathway", {
          method: "POST",
          body: {
            profile: {
              fullName: "Hacked Name",
              email: candBEmail,
              fieldOfStudy: "Hacking",
              city: "Harare",
              highestQualification: "Bachelors Degree",
              yearsExperience: 0,
              hasDedicatedLaptop: false,
              primaryDevice: "Smartphone Only",
              internetAccessType: "Mobile Data Bundles Only",
              powerReliabilityHours: 2,
              hasGlobalPaymentRail: false,
              primaryGoal: "International Remote Work",
              currentSkills: [],
            },
          },
        })
      );
      expect(pathwayOverwrite.status).toBe(200);
      const pwData = await pathwayOverwrite.json();
      expect(pwData.savedToDatabase).toBe(false);
      expect(
        readStore().candidates.find((c) => c.profile.email === candBEmail)?.profile
          .fullName
      ).toBe("Shared Name");

      // Unauthenticated POST /api/documents must NOT persist an artifact to candB's account
      const beforeArts = (await listCandidateCvArtifacts(candBEmail)).length;
      const docUnauth = await documentsRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/documents", {
          method: "POST",
          body: {
            profile: {
              fullName: "Shared Name",
              email: candBEmail,
              city: "Bulawayo",
              highestQualification: "Bachelors Degree",
              fieldOfStudy: "Finance",
              yearsExperience: 2,
              hasDedicatedLaptop: true,
              primaryDevice: "Dedicated Laptop / PC",
              internetAccessType: "Home Fiber / Wi-Fi",
              powerReliabilityHours: 14,
              hasGlobalPaymentRail: true,
              primaryGoal: "International Remote Work",
              currentSkills: ["Excel"],
            },
            target: {
              title: "Analyst",
              company: "TestCo",
              description: "Analyze datasets.",
              requiredSkills: ["Excel", "SQL"],
            },
          },
        })
      );
      expect(docUnauth.status).toBe(200);
      expect((await docUnauth.json()).artifact).toBeNull();
      expect((await listCandidateCvArtifacts(candBEmail)).length).toBe(beforeArts);

      // Authenticated candA cannot inject a CV artifact into candB's email
      const docCross = await documentsRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/documents", {
          method: "POST",
          user: candASession,
          body: {
            profile: {
              fullName: "Shared Name",
              email: candBEmail,
              city: "Harare",
              highestQualification: "Bachelors Degree",
              fieldOfStudy: "Computer Science",
              yearsExperience: 3,
              hasDedicatedLaptop: false,
              primaryDevice: "Smartphone Only",
              internetAccessType: "Mobile Data Bundles Only",
              powerReliabilityHours: 4,
              hasGlobalPaymentRail: false,
              primaryGoal: "International Remote Work",
              currentSkills: ["TypeScript", "SQL"],
            },
            target: {
              title: "Analyst",
              company: "TestCo",
              description: "Analyze datasets.",
              requiredSkills: ["Excel", "SQL"],
            },
          },
        })
      );
      expect(docCross.status).toBe(200);
      const docCrossData = await docCross.json();
      expect(docCrossData.artifact?.candidateEmail).toBe(candAEmail);
      expect((await listCandidateCvArtifacts(candBEmail)).length).toBe(beforeArts);

      // GET /api/jobs?all=1 unauthenticated hides reported/pending jobs and all applications
      const jobsPublic = await jobsRoute.GET(
        await buildAuthedRequest("http://localhost:3000/api/jobs?all=1")
      );
      const jobsPublicData = await jobsPublic.json();
      expect(jobsPublicData.applications).toEqual([]);
      expect(jobsPublicData.activeCandidate).toBeNull();
      expect(
        jobsPublicData.jobs.some((j: { id: string }) => j.id === reportedJobId)
      ).toBe(false);

      // GET /api/jobs as candA must NOT leak candB's application even though both have fullName "Shared Name"!
      const jobsCandA = await jobsRoute.GET(
        await buildAuthedRequest("http://localhost:3000/api/jobs", {
          user: candASession,
        })
      );
      const jobsCandAData = await jobsCandA.json();
      expect(
        jobsCandAData.applications.some(
          (a: { id: string }) => a.id === candBAppId
        )
      ).toBe(false);

      // Candidate cannot apply to a reported job
      const applyReported = await jobsRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/jobs", {
          method: "POST",
          user: candASession,
          body: {
            jobId: reportedJobId,
            tailoredResumePitch: "Trying to apply to reported job",
            sharedWithEmployer: true,
          },
        })
      );
      expect(applyReported.status).toBe(404);

      // Candidate cannot update another candidate's profile
      const crossProfilePost = await profileRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/auth/profile", {
          method: "POST",
          user: candASession,
          body: { profile: { fullName: "Tampered", email: candBEmail } },
        })
      );
      expect(crossProfilePost.status).toBe(403);

      // Candidate cannot delete another candidate's document
      const candBSession = {
        sub: candBId,
        email: candBEmail,
        name: "Shared Name",
        role: "candidate" as const,
      };
      const crossDocDel = await attachmentsRoute.DELETE(
        await buildAuthedRequest(
          `http://localhost:3000/api/auth/attachments?id=${candADocId}`,
          { method: "DELETE", user: candBSession }
        )
      );
      expect(crossDocDel.status).toBe(403);

      // GET /api/admin/users never exposes passwordHash, confirmationToken, or resetToken
      const adminUsersRes = await adminUsersRoute.GET(
        await buildAuthedRequest("http://localhost:3000/api/admin/users", {
          user: {
            sub: adminId,
            email: adminEmail,
            name: "Regular Admin",
            role: "admin",
          },
        })
      );
      expect(adminUsersRes.status).toBe(200);
      const adminUsersData = await adminUsersRes.json();
      for (const u of adminUsersData.users) {
        expect(u.passwordHash).toBeUndefined();
        expect(u.confirmationToken).toBeUndefined();
        expect(u.resetToken).toBeUndefined();
      }
    });

    it("hardens password reset against admin/superuser takeover and substring bypasses, and protects existing employer registrations", async () => {
      const passwordRoute = await import("@/app/api/auth/password/route");
      const employersRoute = await import("@/app/api/employers/route");

      // 1. Admin/superuser password cannot be reset via unauthenticated mode: "reset"
      const adminResetAttempt = await passwordRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/auth/password", {
          method: "POST",
          body: {
            mode: "reset",
            email: superEmail,
            fullName: "Platform Superuser",
            newPassword: "HackedPass#2026",
          },
        })
      );
      expect(adminResetAttempt.status).toBe(403);

      // 2. Single-character or email-prefix fullName bypass must be rejected (403)
      const shortBypassAttempt = await passwordRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/auth/password", {
          method: "POST",
          body: {
            mode: "reset",
            email: candAEmail,
            fullName: "s",
            newPassword: "HackedPass#2026",
          },
        })
      );
      expect(shortBypassAttempt.status).toBe(403);

      // 3. Unauthenticated POST /api/employers cannot overwrite an existing employer registration
      const empOverwrite = await employersRoute.POST(
        await buildAuthedRequest("http://localhost:3000/api/employers", {
          method: "POST",
          body: {
            companyName: "Hijacked Corp",
            contactPerson: "Attacker",
            email: empAEmail,
          },
        })
      );
      expect(empOverwrite.status).toBe(409);
    });
  });
});
