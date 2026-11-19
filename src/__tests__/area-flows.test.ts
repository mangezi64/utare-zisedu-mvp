import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: false,
  supabase: null,
  getSupabaseAdmin: () => null,
  getSupabaseServer: () => null,
}));

vi.mock("@/lib/email-domain-check", () => ({
  checkEmailDomain: vi.fn(async () => "deliverable"),
}));

vi.mock("@/lib/gemini/client", () => ({
  DEFAULT_MODEL: "gemini-2.5-flash",
  getGeminiConfig: () => ({ apiKey: "", model: "gemini-2.5-flash", enabled: false }),
  isGeminiEnabled: () => false,
  generateJson: vi.fn(async () => null),
}));

import {
  createAuthUser,
  deleteAllUserData,
  deleteJobFromStore,
  readStore,
  updateUserRole,
} from "@/lib/store";
import { hashPassword } from "@/lib/password-hash";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";

import { POST as signupPost } from "@/app/api/auth/signup/route";
import { POST as verifyEmailPost } from "@/app/api/auth/verify-email/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as sessionGet } from "@/app/api/auth/session/route";
import { DELETE as accountDelete } from "@/app/api/auth/account/route";
import { GET as pathwayGet, POST as pathwayPost } from "@/app/api/pathway/route";
import {
  GET as jobsGet,
  PATCH as jobsPatch,
  POST as jobsPost,
} from "@/app/api/jobs/route";
import { POST as reportJobPost } from "@/app/api/jobs/report/route";
import {
  DELETE as adminJobsDelete,
  GET as adminJobsGet,
  PATCH as adminJobsPatch,
  POST as adminJobsPost,
} from "@/app/api/admin/jobs/route";
import { PATCH as employersPatch } from "@/app/api/employers/route";
import {
  GET as employerPortalGet,
  PATCH as employerPortalPatch,
  POST as employerPortalPost,
} from "@/app/api/employer/portal/route";

function makeJsonReq(
  url: string,
  method: string,
  body?: unknown,
  cookieToken?: string
): NextRequest {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (cookieToken) {
    headers["cookie"] = `${SESSION_COOKIE_NAME}=${cookieToken}`;
  }
  return new NextRequest(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe("UTARE ZEM AI — End-to-End Route Flows", () => {
  const createdEmails: string[] = [];
  const createdJobIds: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    for (const jobId of createdJobIds) {
      deleteJobFromStore(jobId);
    }
    for (const email of createdEmails) {
      await deleteAllUserData({
        targetEmail: email,
        actorEmail: "test-cleanup@utare.co.zw",
        actorRole: "superuser",
        reason: "E2E flow test cleanup",
      });
    }
  });

  it("1. Candidate Journey: policy-gated signup -> email confirmation -> login -> pathway -> consent-gated apply -> pause/resume sharing -> self-delete", async () => {
    const email = `flow-cand-${Date.now()}@gmail.com`;
    const password = "CandidatePass#2026";
    createdEmails.push(email);

    // 1a. Reject signup if Data Policy is explicitly declined
    const rejectedSignup = await signupPost(
      makeJsonReq("http://localhost:3000/api/auth/signup", "POST", {
        accountType: "candidate",
        fullName: "Kudzai Moyo",
        email,
        password,
        dataPolicyAccepted: false,
      })
    );
    expect(rejectedSignup.status).toBe(400);

    // 1b. Signup with Data Policy acceptance
    const signupRes = await signupPost(
      makeJsonReq("http://localhost:3000/api/auth/signup", "POST", {
        accountType: "candidate",
        fullName: "Kudzai Moyo",
        email,
        password,
        city: "Bulawayo",
        qualification: "Bachelors Degree",
        fieldOfStudy: "Data Science & Analytics",
        dataPolicyAccepted: true,
      })
    );
    const signupData = await signupRes.json();
    expect(signupRes.status).toBe(200);
    expect(signupData.success).toBe(true);
    expect(signupData.requiresEmailConfirmation).toBe(true);
    expect(signupData.confirmationPath).toContain("/auth/callback?token=");

    // 1c. Login before email confirmation is blocked (403)
    const unverifiedLoginRes = await loginPost(
      makeJsonReq("http://localhost:3000/api/auth/login", "POST", {
        email,
        password,
      })
    );
    const unverifiedLoginData = await unverifiedLoginRes.json();
    expect(unverifiedLoginRes.status).toBe(403);
    expect(unverifiedLoginData.code).toBe("EMAIL_NOT_CONFIRMED");

    // 1d. Confirm email via /api/auth/verify-email
    const callbackUrl = new URL(`http://localhost:3000${signupData.confirmationPath}`);
    const tokenParam = callbackUrl.searchParams.get("token");
    expect(tokenParam).toBeTruthy();

    const verifyRes = await verifyEmailPost(
      makeJsonReq("http://localhost:3000/api/auth/verify-email", "POST", {
        token: tokenParam,
        email,
      })
    );
    const verifyData = await verifyRes.json();
    expect(verifyRes.status).toBe(200);
    expect(verifyData.success).toBe(true);
    expect(verifyData.role).toBe("candidate");
    expect(verifyRes.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();

    // 1e. Login via /api/auth/login -> obtains session cookie
    const loginRes = await loginPost(
      makeJsonReq("http://localhost:3000/api/auth/login", "POST", {
        email,
        password,
      })
    );
    const loginData = await loginRes.json();
    expect(loginRes.status).toBe(200);
    expect(loginData.success).toBe(true);
    expect(loginData.user.email).toBe(email);
    expect(loginData.user.role).toBe("candidate");

    const candCookie = loginRes.cookies.get(SESSION_COOKIE_NAME)?.value;
    expect(candCookie).toBeTruthy();

    // Verify /api/auth/session recognizes authenticated candidate
    const sessionRes = await sessionGet(
      makeJsonReq("http://localhost:3000/api/auth/session", "GET", undefined, candCookie)
    );
    const sessionData = await sessionRes.json();
    expect(sessionData.authenticated).toBe(true);
    expect(sessionData.user.email).toBe(email);

    // 1f. Complete Diagnostic/Pathway (/api/pathway POST & GET)
    const pathwayRes = await pathwayPost(
      makeJsonReq(
        "http://localhost:3000/api/pathway",
        "POST",
        {
          profile: {
            fullName: "Kudzai Moyo",
            email: "spoofed-ignored@gmail.com",
            phone: "+263771009988",
            city: "Bulawayo",
            highestQualification: "Bachelors Degree",
            fieldOfStudy: "Data Science & Analytics",
            yearsExperience: 2,
            hasDedicatedLaptop: true,
            primaryDevice: "Dedicated Laptop / PC",
            internetAccessType: "Home Fiber / Wi-Fi",
            powerReliabilityHours: 14,
            hasGlobalPaymentRail: true,
            primaryGoal: "International Remote Work",
            currentSkills: ["Python", "SQL", "Excel", "Data Analysis"],
          },
          quizAnswers: {
            clientComms: 85,
            digitalTools: 85,
            domainProblemSolving: 90,
            asyncWorkflow: 80,
            internetAccess: 85,
            workExperience: 75,
          },
        },
        candCookie
      )
    );
    const pathwayData = await pathwayRes.json();
    expect(pathwayRes.status).toBe(200);
    expect(pathwayData.savedToDatabase).toBe(true);
    expect(pathwayData.record.profile.email).toBe(email);
    expect(pathwayData.record.profile.city).toBe("Bulawayo");
    expect(pathwayData.assessment.overallScore).toBeGreaterThan(0);
    expect(pathwayData.pathway.upskillingMilestones.length).toBeGreaterThan(0);

    const pathwayGetRes = await pathwayGet(
      makeJsonReq("http://localhost:3000/api/pathway", "GET", undefined, candCookie)
    );
    const pathwayGetData = await pathwayGetRes.json();
    expect(pathwayGetRes.status).toBe(200);
    expect(pathwayGetData.activeCandidate?.profile.email).toBe(email);

    // 1g. Browse approved jobs via GET /api/jobs
    const jobsRes = await jobsGet(
      makeJsonReq("http://localhost:3000/api/jobs", "GET", undefined, candCookie)
    );
    const jobsData = await jobsRes.json();
    expect(jobsRes.status).toBe(200);
    expect(Array.isArray(jobsData.jobs)).toBe(true);
    expect(jobsData.jobs.length).toBeGreaterThan(0);
    expect(
      jobsData.jobs.every(
        (j: { status?: string }) =>
          j.status !== "pending_review" &&
          j.status !== "reported" &&
          j.status !== "archived"
      )
    ).toBe(true);
    const targetJob = jobsData.jobs[0];

    // 1h. Attempt apply WITHOUT consent -> 400
    const noConsentRes = await jobsPost(
      makeJsonReq(
        "http://localhost:3000/api/jobs",
        "POST",
        {
          jobId: targetJob.id,
          tailoredResumePitch: pathwayData.pathway.tailoredResumeSummary,
          sharedWithEmployer: false,
        },
        candCookie
      )
    );
    expect(noConsentRes.status).toBe(400);

    // 1i. Apply WITH sharedWithEmployer: true -> 200
    const applyRes = await jobsPost(
      makeJsonReq(
        "http://localhost:3000/api/jobs",
        "POST",
        {
          jobId: targetJob.id,
          tailoredResumePitch: pathwayData.pathway.tailoredResumeSummary,
          sharedWithEmployer: true,
        },
        candCookie
      )
    );
    const applyData = await applyRes.json();
    expect(applyRes.status).toBe(200);
    expect(applyData.status).toBe("submitted");
    expect(applyData.application.sharedWithEmployer).toBe(true);
    expect(applyData.application.candidateCity).toBe("Bulawayo");
    expect(applyData.application.candidateSkills).toContain("Python");
    const appId = applyData.application.id as string;

    // 1j. Pause sharing via PATCH /api/jobs
    const pauseRes = await jobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/jobs",
        "PATCH",
        { applicationId: appId, sharedWithEmployer: false },
        candCookie
      )
    );
    const pauseData = await pauseRes.json();
    expect(pauseRes.status).toBe(200);
    expect(pauseData.application.sharedWithEmployer).toBe(false);

    // 1k. Resume sharing via PATCH /api/jobs
    const resumeRes = await jobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/jobs",
        "PATCH",
        { applicationId: appId, sharedWithEmployer: true },
        candCookie
      )
    );
    const resumeData = await resumeRes.json();
    expect(resumeRes.status).toBe(200);
    expect(resumeData.application.sharedWithEmployer).toBe(true);

    // 1l. Self-delete requires "delete" confirmation
    const badDeleteRes = await accountDelete(
      makeJsonReq(
        "http://localhost:3000/api/auth/account",
        "DELETE",
        { confirmationText: "wrong" },
        candCookie
      )
    );
    expect(badDeleteRes.status).toBe(400);

    // 1m. Self-delete account via DELETE /api/auth/account -> removes all records & clears cookie
    const deleteRes = await accountDelete(
      makeJsonReq(
        "http://localhost:3000/api/auth/account",
        "DELETE",
        { confirmationText: "delete" },
        candCookie
      )
    );
    const deleteData = await deleteRes.json();
    expect(deleteRes.status).toBe(200);
    expect(deleteData.success).toBe(true);
    expect(deleteData.deleted).toBe(true);
    expect(deleteData.removedCounts.users).toBe(1);
    expect(deleteData.removedCounts.candidates).toBe(1);
    expect(deleteData.removedCounts.applications).toBe(1);

    const clearedCookie = deleteRes.cookies.get(SESSION_COOKIE_NAME);
    expect(clearedCookie?.value).toBe("");
    expect(clearedCookie?.maxAge).toBe(0);

    const storeAfter = readStore();
    expect(storeAfter.users.some((u) => u.email === email)).toBe(false);
    expect(
      storeAfter.candidates.some((c) => c.profile.email === email)
    ).toBe(false);
    expect(
      storeAfter.applications.some((a) => a.candidateEmail === email)
    ).toBe(false);
  });

  it("2. Safety & Moderation Journey: report listing -> vanishes immediately -> admin blocked -> superuser restores -> re-reported -> superuser permanently deletes", async () => {
    const reporterEmail = `flow-reporter-${Date.now()}@gmail.com`;
    const adminEmail = `flow-admin-${Date.now()}@gmail.com`;
    const superuserEmail = `flow-super-${Date.now()}@gmail.com`;
    const pw = "SafetyFlow#2026";
    createdEmails.push(reporterEmail, adminEmail, superuserEmail);

    createAuthUser({
      email: reporterEmail,
      name: "Safety Reporter",
      role: "candidate",
      passwordHash: hashPassword(pw),
      emailConfirmed: true,
    });
    createAuthUser({
      email: adminEmail,
      name: "Regular Facilitator",
      role: "admin",
      passwordHash: hashPassword(pw),
      emailConfirmed: true,
    });
    createAuthUser({
      email: superuserEmail,
      name: "Lead Superuser",
      role: "superuser",
      passwordHash: hashPassword(pw),
      emailConfirmed: true,
    });
    updateUserRole(adminEmail, "admin");
    updateUserRole(superuserEmail, "superuser");

    const [repLogin, adminLogin, superLogin] = await Promise.all([
      loginPost(
        makeJsonReq("http://localhost:3000/api/auth/login", "POST", {
          email: reporterEmail,
          password: pw,
        })
      ),
      loginPost(
        makeJsonReq("http://localhost:3000/api/auth/login", "POST", {
          email: adminEmail,
          password: pw,
        })
      ),
      loginPost(
        makeJsonReq("http://localhost:3000/api/auth/login", "POST", {
          email: superuserEmail,
          password: pw,
        })
      ),
    ]);

    const reporterCookie = repLogin.cookies.get(SESSION_COOKIE_NAME)?.value;
    const adminCookie = adminLogin.cookies.get(SESSION_COOKIE_NAME)?.value;
    const superuserCookie = superLogin.cookies.get(SESSION_COOKIE_NAME)?.value;
    expect(reporterCookie).toBeTruthy();
    expect(adminCookie).toBeTruthy();
    expect(superuserCookie).toBeTruthy();

    // Admin adds a job that goes live on the board
    const createJobRes = await adminJobsPost(
      makeJsonReq(
        "http://localhost:3000/api/admin/jobs",
        "POST",
        {
          title: "Suspicious Upfront-Fee Data Clerk",
          company: "Shady Offshore Ltd",
          category: "Operations",
          compensationUsdMonthly: "$4,500 / mo",
          description: "Test job for end-to-end safety moderation flow.",
        },
        adminCookie
      )
    );
    const createJobData = await createJobRes.json();
    expect(createJobRes.status).toBe(200);
    const jobId = createJobData.job.id as string;
    createdJobIds.push(jobId);

    // Verify it is visible on GET /api/jobs
    const beforeReportBoard = await (
      await jobsGet(makeJsonReq("http://localhost:3000/api/jobs", "GET"))
    ).json();
    expect(beforeReportBoard.jobs.some((j: { id: string }) => j.id === jobId)).toBe(
      true
    );

    // Unauthenticated report is rejected (401)
    const unauthReportRes = await reportJobPost(
      makeJsonReq("http://localhost:3000/api/jobs/report", "POST", {
        jobId,
        reason: "Asks for upfront fee or payment",
      })
    );
    expect(unauthReportRes.status).toBe(401);

    // Authenticated user reports listing via POST /api/jobs/report
    const reportRes = await reportJobPost(
      makeJsonReq(
        "http://localhost:3000/api/jobs/report",
        "POST",
        {
          jobId,
          reason: "Asks for upfront fee or payment",
          details: "Asked applicants to send $50 registration deposit.",
        },
        reporterCookie
      )
    );
    const reportData = await reportRes.json();
    expect(reportRes.status).toBe(200);
    expect(reportData.success).toBe(true);
    expect(reportData.status).toBe("reported");

    // Verify it vanishes immediately from GET /api/jobs
    const afterReportBoard = await (
      await jobsGet(makeJsonReq("http://localhost:3000/api/jobs", "GET"))
    ).json();
    expect(afterReportBoard.jobs.some((j: { id: string }) => j.id === jobId)).toBe(
      false
    );

    // Candidate cannot apply to reported job
    const blockedApplyRes = await jobsPost(
      makeJsonReq(
        "http://localhost:3000/api/jobs",
        "POST",
        {
          jobId,
          tailoredResumePitch: "Trying to apply to reported listing",
          sharedWithEmployer: true,
        },
        reporterCookie
      )
    );
    expect([400, 404]).toContain(blockedApplyRes.status);

    // Regular admin is blocked from restoring or deleting the reported job (403)
    const adminEvaluateRestore = await adminJobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/admin/jobs",
        "PATCH",
        { action: "evaluate_report", jobId, decision: "restore" },
        adminCookie
      )
    );
    expect(adminEvaluateRestore.status).toBe(403);

    const adminDirectApprove = await adminJobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/admin/jobs",
        "PATCH",
        { jobId, status: "approved" },
        adminCookie
      )
    );
    expect(adminDirectApprove.status).toBe(403);

    const adminDeleteReported = await adminJobsDelete(
      makeJsonReq(
        `http://localhost:3000/api/admin/jobs?id=${encodeURIComponent(jobId)}`,
        "DELETE",
        undefined,
        adminCookie
      )
    );
    expect(adminDeleteReported.status).toBe(403);

    // Superuser evaluates & restores via PATCH /api/admin/jobs
    const superRestoreRes = await adminJobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/admin/jobs",
        "PATCH",
        {
          action: "evaluate_report",
          jobId,
          decision: "restore",
          note: "Employer verified; false positive.",
        },
        superuserCookie
      )
    );
    const superRestoreData = await superRestoreRes.json();
    expect(superRestoreRes.status).toBe(200);
    expect(superRestoreData.removed).toBe(false);
    expect(superRestoreData.job.status).toBe("approved");

    // Appears on GET /api/jobs again
    const restoredBoard = await (
      await jobsGet(makeJsonReq("http://localhost:3000/api/jobs", "GET"))
    ).json();
    expect(restoredBoard.jobs.some((j: { id: string }) => j.id === jobId)).toBe(
      true
    );

    // Re-reported by user
    const reReportRes = await reportJobPost(
      makeJsonReq(
        "http://localhost:3000/api/jobs/report",
        "POST",
        {
          jobId,
          reason: "Confirmed phishing link",
          details: "Sent phishing form via email.",
        },
        reporterCookie
      )
    );
    expect(reReportRes.status).toBe(200);
    expect((await reReportRes.json()).status).toBe("reported");

    const afterReReportBoard = await (
      await jobsGet(makeJsonReq("http://localhost:3000/api/jobs", "GET"))
    ).json();
    expect(
      afterReReportBoard.jobs.some((j: { id: string }) => j.id === jobId)
    ).toBe(false);

    // Superuser permanently deletes via PATCH /api/admin/jobs
    const superRemoveRes = await adminJobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/admin/jobs",
        "PATCH",
        {
          action: "evaluate_report",
          jobId,
          decision: "remove",
          note: "Confirmed scam listing.",
        },
        superuserCookie
      )
    );
    const superRemoveData = await superRemoveRes.json();
    expect(superRemoveRes.status).toBe(200);
    expect(superRemoveData.removed).toBe(true);

    const allAdminJobs = await (
      await adminJobsGet(
        makeJsonReq("http://localhost:3000/api/admin/jobs", "GET", undefined, superuserCookie)
      )
    ).json();
    expect(allAdminJobs.jobs.some((j: { id: string }) => j.id === jobId)).toBe(
      false
    );
  });

  it("3. Employer Journey: verified employer posts job -> sees consented applicant -> updates status with/without feedback -> paused applicant disappears", async () => {
    const employerEmail = `flow-emp-${Date.now()}@gmail.com`;
    const cand1Email = `flow-cand1-${Date.now()}@gmail.com`;
    const cand2Email = `flow-cand2-${Date.now()}@gmail.com`;
    const adminEmail = `flow-emp-admin-${Date.now()}@gmail.com`;
    const pw = "EmployerFlow#2026";
    createdEmails.push(employerEmail, cand1Email, cand2Email, adminEmail);

    // Seed verified admin to verify the employer
    createAuthUser({
      email: adminEmail,
      name: "Verifier Admin",
      role: "admin",
      passwordHash: hashPassword(pw),
      emailConfirmed: true,
    });
    updateUserRole(adminEmail, "admin");
    const adminLoginRes = await loginPost(
      makeJsonReq("http://localhost:3000/api/auth/login", "POST", {
        email: adminEmail,
        password: pw,
      })
    );
    const adminCookie = adminLoginRes.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Employer signs up & confirms email
    const empSignupRes = await signupPost(
      makeJsonReq("http://localhost:3000/api/auth/signup", "POST", {
        accountType: "employer",
        fullName: "Sarah Jenkins",
        companyName: "Savannah Cloud UK",
        email: employerEmail,
        password: pw,
        website: "https://savannahcloud.example.co.uk",
        industry: "Cloud & Analytics",
        dataPolicyAccepted: true,
      })
    );
    const empSignupData = await empSignupRes.json();
    expect(empSignupRes.status).toBe(200);
    const empToken = new URL(
      `http://localhost:3000${empSignupData.confirmationPath}`
    ).searchParams.get("token");

    const empVerifyRes = await verifyEmailPost(
      makeJsonReq("http://localhost:3000/api/auth/verify-email", "POST", {
        token: empToken,
        email: employerEmail,
      })
    );
    expect(empVerifyRes.status).toBe(200);
    const empCookie = empVerifyRes.cookies.get(SESSION_COOKIE_NAME)?.value;
    expect(empCookie).toBeTruthy();

    // Admin verifies employer
    const initialPortal = await (
      await employerPortalGet(
        makeJsonReq("http://localhost:3000/api/employer/portal", "GET", undefined, empCookie)
      )
    ).json();
    expect(initialPortal.employer?.id).toBeTruthy();

    const verifyEmpRes = await employersPatch(
      makeJsonReq(
        "http://localhost:3000/api/employers",
        "PATCH",
        {
          employerId: initialPortal.employer.id,
          verificationStatus: "verified",
        },
        adminCookie
      )
    );
    expect(verifyEmpRes.status).toBe(200);
    expect((await verifyEmpRes.json()).employer.verificationStatus).toBe(
      "verified"
    );

    // Verified employer posts job -> published immediately
    const postJobRes = await employerPortalPost(
      makeJsonReq(
        "http://localhost:3000/api/employer/portal",
        "POST",
        {
          title: "Remote Junior SQL & Ops Analyst",
          category: "Data",
          compensationUsdMonthly: "$1,100 – $1,500 / mo",
          requiredSkills: "SQL, Excel, Async Communication",
          description:
            "Analyze operational metrics and collaborate asynchronously with UK team.",
        },
        empCookie
      )
    );
    const postJobData = await postJobRes.json();
    expect(postJobRes.status).toBe(200);
    expect(postJobData.publishedImmediately).toBe(true);
    expect(postJobData.job.status).toBe("approved");
    const empJobId = postJobData.job.id as string;
    createdJobIds.push(empJobId);

    // Verify posted job is live on GET /api/jobs
    const publicJobsData = await (
      await jobsGet(makeJsonReq("http://localhost:3000/api/jobs", "GET"))
    ).json();
    expect(
      publicJobsData.jobs.some((j: { id: string }) => j.id === empJobId)
    ).toBe(true);

    // Sign up & verify 2 candidates, submit diagnostic for candidate 1
    const setupCandidate = async (candEmail: string, fullName: string) => {
      const sRes = await signupPost(
        makeJsonReq("http://localhost:3000/api/auth/signup", "POST", {
          accountType: "candidate",
          fullName,
          email: candEmail,
          password: pw,
          city: "Mutare",
          qualification: "Bachelors Degree",
          fieldOfStudy: "Statistics & Computing",
          dataPolicyAccepted: true,
        })
      );
      const sData = await sRes.json();
      const tok = new URL(
        `http://localhost:3000${sData.confirmationPath}`
      ).searchParams.get("token");
      const vRes = await verifyEmailPost(
        makeJsonReq("http://localhost:3000/api/auth/verify-email", "POST", {
          token: tok,
          email: candEmail,
        })
      );
      const cookie = vRes.cookies.get(SESSION_COOKIE_NAME)?.value;
      await pathwayPost(
        makeJsonReq(
          "http://localhost:3000/api/pathway",
          "POST",
          {
            profile: {
              fullName,
              phone: "+263774445566",
              city: "Mutare",
              highestQualification: "Bachelors Degree",
              fieldOfStudy: "Statistics & Computing",
              yearsExperience: 2,
              hasDedicatedLaptop: true,
              primaryDevice: "Dedicated Laptop / PC",
              internetAccessType: "Starlink",
              powerReliabilityHours: 16,
              hasGlobalPaymentRail: true,
              primaryGoal: "International Remote Work",
              currentSkills: ["SQL", "Excel", "Async Communication"],
            },
            quizAnswers: {
              clientComms: 85,
              digitalTools: 88,
              domainProblemSolving: 85,
              asyncWorkflow: 84,
              internetAccess: 90,
              workExperience: 75,
            },
          },
          cookie
        )
      );
      return cookie!;
    };

    const cand1Cookie = await setupCandidate(cand1Email, "Tariro Chikwava");
    const cand2Cookie = await setupCandidate(cand2Email, "Bongani Ncube");

    // Both candidates apply with sharedWithEmployer: true
    const app1Res = await (
      await jobsPost(
        makeJsonReq(
          "http://localhost:3000/api/jobs",
          "POST",
          {
            jobId: empJobId,
            tailoredResumePitch: "Experienced in SQL & operational reporting.",
            sharedWithEmployer: true,
          },
          cand1Cookie
        )
      )
    ).json();
    const app2Res = await (
      await jobsPost(
        makeJsonReq(
          "http://localhost:3000/api/jobs",
          "POST",
          {
            jobId: empJobId,
            tailoredResumePitch: "Strong Excel and async teamwork background.",
            sharedWithEmployer: true,
          },
          cand2Cookie
        )
      )
    ).json();
    const app1Id = app1Res.application.id as string;
    const app2Id = app2Res.application.id as string;

    // Employer sees both consented applicants, with private fields stripped
    const portalData1 = await (
      await employerPortalGet(
        makeJsonReq("http://localhost:3000/api/employer/portal", "GET", undefined, empCookie)
      )
    ).json();
    expect(portalData1.applicants.length).toBe(2);
    const viewedApp1 = portalData1.applicants.find(
      (a: { id: string }) => a.id === app1Id
    );
    expect(viewedApp1).toBeDefined();
    expect(viewedApp1.candidateCity).toBe("Mutare");
    expect(viewedApp1).not.toHaveProperty("phone");
    expect(viewedApp1).not.toHaveProperty("powerReliabilityHours");
    expect(viewedApp1).not.toHaveProperty("hasDedicatedLaptop");

    // Employer updates candidate 1 status WITH optional feedback
    const shortlistRes = await employerPortalPatch(
      makeJsonReq(
        "http://localhost:3000/api/employer/portal",
        "PATCH",
        {
          action: "update_application_status",
          applicationId: app1Id,
          status: "shortlisted",
          feedbackNote: "Strong SQL alignment; inviting to async screening.",
        },
        empCookie
      )
    );
    const shortlistData = await shortlistRes.json();
    expect(shortlistRes.status).toBe(200);
    expect(shortlistData.applicant.status).toBe("shortlisted");
    expect(shortlistData.applicant.employerFeedbackNote).toBe(
      "Strong SQL alignment; inviting to async screening."
    );

    // Employer updates candidate 2 status WITHOUT feedback
    const rejectNoFeedbackRes = await employerPortalPatch(
      makeJsonReq(
        "http://localhost:3000/api/employer/portal",
        "PATCH",
        {
          action: "update_application_status",
          applicationId: app2Id,
          status: "rejected",
        },
        empCookie
      )
    );
    const rejectNoFeedbackData = await rejectNoFeedbackRes.json();
    expect(rejectNoFeedbackRes.status).toBe(200);
    expect(rejectNoFeedbackData.applicant.status).toBe("rejected");
    expect(rejectNoFeedbackData.applicant.employerFeedbackNote).toBeUndefined();

    // Candidate 1 sees employer feedback on GET /api/jobs
    const cand1JobsData = await (
      await jobsGet(
        makeJsonReq("http://localhost:3000/api/jobs", "GET", undefined, cand1Cookie)
      )
    ).json();
    const cand1AppView = cand1JobsData.applications.find(
      (a: { id: string }) => a.id === app1Id
    );
    expect(cand1AppView.status).toBe("shortlisted");
    expect(cand1AppView.employerFeedbackNote).toBe(
      "Strong SQL alignment; inviting to async screening."
    );

    // Candidate 2 pauses sharing via PATCH /api/jobs
    const pauseCand2Res = await jobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/jobs",
        "PATCH",
        { applicationId: app2Id, sharedWithEmployer: false },
        cand2Cookie
      )
    );
    expect(pauseCand2Res.status).toBe(200);

    // Unconsented/paused applicant disappears from employer view
    const portalAfterPause = await (
      await employerPortalGet(
        makeJsonReq("http://localhost:3000/api/employer/portal", "GET", undefined, empCookie)
      )
    ).json();
    expect(
      portalAfterPause.applicants.some((a: { id: string }) => a.id === app2Id)
    ).toBe(false);
    expect(
      portalAfterPause.applicants.some((a: { id: string }) => a.id === app1Id)
    ).toBe(true);

    // Employer also cannot mutate paused application (404)
    const updatePausedRes = await employerPortalPatch(
      makeJsonReq(
        "http://localhost:3000/api/employer/portal",
        "PATCH",
        {
          action: "update_application_status",
          applicationId: app2Id,
          status: "under_review",
        },
        empCookie
      )
    );
    expect(updatePausedRes.status).toBe(404);

    // Candidate 2 resumes sharing -> reappears in employer portal
    const resumeCand2Res = await jobsPatch(
      makeJsonReq(
        "http://localhost:3000/api/jobs",
        "PATCH",
        { applicationId: app2Id, sharedWithEmployer: true },
        cand2Cookie
      )
    );
    expect(resumeCand2Res.status).toBe(200);

    const portalAfterResume = await (
      await employerPortalGet(
        makeJsonReq("http://localhost:3000/api/employer/portal", "GET", undefined, empCookie)
      )
    ).json();
    expect(
      portalAfterResume.applicants.some((a: { id: string }) => a.id === app2Id)
    ).toBe(true);
  });
});
