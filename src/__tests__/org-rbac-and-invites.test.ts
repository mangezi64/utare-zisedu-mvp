import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, signSessionToken, SessionPayload } from "@/lib/auth-session";
import { addHubToStore, createAuthUser, saveEmployerRegistration } from "@/lib/store";
import { hashPassword } from "@/lib/password-hash";

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: false,
  supabase: null,
  getSupabaseAdmin: () => null,
  getSupabaseServer: () => null,
}));

async function buildSignedRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    session?: Partial<SessionPayload> & { sub: string; email: string; role: SessionPayload["role"] };
  } = {}
): Promise<NextRequest> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.session) {
    const token = await signSessionToken({
      sub: options.session.sub,
      email: options.session.email,
      name: options.session.name || "Test User",
      role: options.session.role,
      orgRole: options.session.orgRole,
      employerId: options.session.employerId,
      hubId: options.session.hubId,
      emailConfirmed: true,
      companyName: options.session.companyName,
    });
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }
  return new NextRequest(url, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

describe("Org RBAC, One-Time Invite/Reset Links & Curated Directory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets admin invite an employer, consume the one-time set-password link once, and blocks reuse", async () => {
    const inviteRoute = await import("@/app/api/admin/employers/invite/route");
    const passwordRoute = await import("@/app/api/auth/password/route");

    const empEmail = `invite-emp-${Date.now()}@utare-test.org`;
    const inviteReq = await buildSignedRequest("http://localhost:3000/api/admin/employers/invite", {
      method: "POST",
      session: { sub: "adm-1", email: "admin@utare.zw", role: "admin" },
      body: {
        companyName: "Zambezi Cloud Labs",
        contactPerson: "Tendai Moyo",
        email: empEmail,
        orgRole: "org_admin",
      },
    });
    const inviteRes = await inviteRoute.POST(inviteReq);
    expect([200, 201]).toContain(inviteRes.status);
    const inviteData = await inviteRes.json();
    expect(inviteData.ok).toBe(true);
    expect(inviteData.inviteUrl).toContain("/auth/callback?reset_token=");

    const parsedUrl = new URL(inviteData.inviteUrl);
    const resetToken = parsedUrl.searchParams.get("reset_token");
    expect(resetToken).toBeTruthy();

    // Consume one-time token to set password
    const setPwReq = await buildSignedRequest("http://localhost:3000/api/auth/password", {
      method: "POST",
      body: {
        mode: "set-password",
        email: empEmail,
        resetToken,
        newPassword: "StrongOrgPass#2026",
      },
    });
    const setPwRes = await passwordRoute.POST(setPwReq);
    expect(setPwRes.status).toBe(200);
    const setPwData = await setPwRes.json();
    expect(setPwData.success).toBe(true);
    expect(setPwData.redirectTo).toBe("/employer");

    // Reusing the same one-time token must fail
    const reuseReq = await buildSignedRequest("http://localhost:3000/api/auth/password", {
      method: "POST",
      body: {
        mode: "set-password",
        email: empEmail,
        resetToken,
        newPassword: "AnotherPass#2026",
      },
    });
    const reuseRes = await passwordRoute.POST(reuseReq);
    expect(reuseRes.status).toBe(400);
  });

  it("lets admin generate a one-time reset link for an inquiry-only employer", async () => {
    const resetRoute = await import("@/app/api/admin/employers/reset-link/route");
    const inquiryEmail = `inquiry-${Date.now()}@utare-test.org`;
    const emp = saveEmployerRegistration({
      companyName: "Harare Fintech",
      contactPerson: "Rudo Chikwanda",
      email: inquiryEmail,
      industry: "Technology & SaaS",
      rolesInterested: ["QA Analyst"],
      hiringModel: "100% Remote Contract",
      estimatedHires: 1,
      timezoneOverlapNeeded: "CAT",
    });

    const req = await buildSignedRequest("http://localhost:3000/api/admin/employers/reset-link", {
      method: "POST",
      session: { sub: "adm-1", email: "admin@utare.zw", role: "admin" },
      body: { employerId: emp.id },
    });
    const res = await resetRoute.POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.resetUrl).toContain("type=recovery");
  });

  it("enforces employer org_admin vs org_member permissions and team management", async () => {
    const teamRoute = await import("@/app/api/employer/team/route");
    const portalRoute = await import("@/app/api/employer/portal/route");

    const ts = Date.now();
    const adminEmail = `org-admin-${ts}@utare-test.org`;
    const memberEmail = `org-member-${ts}@utare-test.org`;

    const emp = saveEmployerRegistration({
      companyName: `OrgRBAC Co ${ts}`,
      contactPerson: "Admin Owner",
      email: adminEmail,
      industry: "Technology & SaaS",
      rolesInterested: ["Engineering"],
      hiringModel: "100% Remote Contract",
      estimatedHires: 2,
      timezoneOverlapNeeded: "CAT",
      verificationStatus: "verified",
    });

    const orgAdminUser = createAuthUser({
      email: adminEmail,
      name: "Admin Owner",
      role: "employer",
      orgRole: "org_admin",
      employerId: emp.id,
      companyName: emp.companyName,
      passwordHash: hashPassword("OrgAdmin#2026"),
      emailConfirmed: true,
    });

    // org_admin invites an org_member
    const addRes = await teamRoute.POST(
      await buildSignedRequest("http://localhost:3000/api/employer/team", {
        method: "POST",
        session: {
          sub: orgAdminUser.id,
          email: adminEmail,
          role: "employer",
          orgRole: "org_admin",
          employerId: emp.id,
          companyName: emp.companyName,
        },
        body: { fullName: "Recruiter Member", email: memberEmail, orgRole: "org_member" },
      })
    );
    expect([200, 201]).toContain(addRes.status);
    const addData = await addRes.json();
    expect(addData.member.orgRole).toBe("org_member");

    // org_member can post a job, but cannot edit company profile or manage team
    const memberSession = {
      sub: addData.member.id,
      email: memberEmail,
      role: "employer" as const,
      orgRole: "org_member" as const,
      employerId: emp.id,
      companyName: emp.companyName,
    };

    const postJobRes = await portalRoute.POST(
      await buildSignedRequest("http://localhost:3000/api/employer/portal", {
        method: "POST",
        session: memberSession,
        body: {
          title: "Junior Data Analyst",
          description: "Analyze remote ops metrics.",
          category: "Data",
        },
      })
    );
    expect([200, 201]).toContain(postJobRes.status);

    const editProfileRes = await portalRoute.PATCH(
      await buildSignedRequest("http://localhost:3000/api/employer/portal", {
        method: "PATCH",
        session: memberSession,
        body: { action: "update_employer_profile", companyName: "Hijacked Name" },
      })
    );
    expect(editProfileRes.status).toBe(403);

    const memberTeamRes = await teamRoute.GET(
      await buildSignedRequest("http://localhost:3000/api/employer/team", {
        session: memberSession,
      })
    );
    expect(memberTeamRes.status).toBe(403);

    // org_admin cannot remove self, but can remove org_member
    const selfDeleteRes = await teamRoute.DELETE(
      await buildSignedRequest(`http://localhost:3000/api/employer/team?userId=${orgAdminUser.id}`, {
        method: "DELETE",
        session: {
          sub: orgAdminUser.id,
          email: adminEmail,
          role: "employer",
          orgRole: "org_admin",
          employerId: emp.id,
        },
      })
    );
    expect(selfDeleteRes.status).toBe(400);

    const removeMemberRes = await teamRoute.DELETE(
      await buildSignedRequest(`http://localhost:3000/api/employer/team?userId=${addData.member.id}`, {
        method: "DELETE",
        session: {
          sub: orgAdminUser.id,
          email: adminEmail,
          role: "employer",
          orgRole: "org_admin",
          employerId: emp.id,
        },
      })
    );
    expect(removeMemberRes.status).toBe(200);
  });

  it("enforces hub org_admin vs org_member permissions and candidate verified directory scoping", async () => {
    const hubPortalRoute = await import("@/app/api/hub/portal/route");
    const employersRoute = await import("@/app/api/employers/route");

    const ts = Date.now();
    const hub = addHubToStore({
      id: `hub-${ts}`,
      name: `Mutare Hub ${ts}`,
      city: "Mutare",
      address: "10 Herbert Chitepo",
      hasSolarBackup: true,
      internetProvider: "Starlink Business",
      avgSpeedMbps: 150,
      availableWorkstations: 12,
      laptopLoanAvailable: true,
      dailyPassUsd: 5,
      utarePartnerSubsidized: true,
      contactEmail: `hub-${ts}@utare-test.org`,
      operatingHours: "08:00-18:00",
      ownerEmail: `hub-admin-${ts}@utare-test.org`,
    });

    // hub org_member can update workstations, but not dailyPassUsd
    const memberDeskRes = await hubPortalRoute.PATCH(
      await buildSignedRequest("http://localhost:3000/api/hub/portal", {
        method: "PATCH",
        session: {
          sub: `hub-staff-${ts}`,
          email: `hub-staff-${ts}@utare-test.org`,
          role: "hub",
          orgRole: "org_member",
          hubId: hub.id,
        },
        body: { availableWorkstations: 9 },
      })
    );
    expect(memberDeskRes.status).toBe(200);
    const deskData = await memberDeskRes.json();
    expect(deskData.hub.availableWorkstations).toBe(9);

    const memberPriceRes = await hubPortalRoute.PATCH(
      await buildSignedRequest("http://localhost:3000/api/hub/portal", {
        method: "PATCH",
        session: {
          sub: `hub-staff-${ts}`,
          email: `hub-staff-${ts}@utare-test.org`,
          role: "hub",
          orgRole: "org_member",
          hubId: hub.id,
        },
        body: { dailyPassUsd: 99 },
      })
    );
    expect(memberPriceRes.status).toBe(403);

    // Candidate directory returns 200 with ?directory=1, while plain GET /api/employers stays 401
    const candSession = {
      sub: `cand-${ts}`,
      email: `cand-${ts}@utare-test.org`,
      role: "candidate" as const,
    };
    const plainRes = await employersRoute.GET(
      await buildSignedRequest("http://localhost:3000/api/employers", { session: candSession })
    );
    expect(plainRes.status).toBe(401);

    const dirRes = await employersRoute.GET(
      await buildSignedRequest("http://localhost:3000/api/employers?directory=1", {
        session: candSession,
      })
    );
    expect(dirRes.status).toBe(200);
    const dirData = await dirRes.json();
    expect(Array.isArray(dirData.employers)).toBe(true);
    for (const e of dirData.employers) {
      expect(e.verificationStatus).toBe("verified");
      expect(e.additionalNotes).toBeUndefined();
    }
  });
});
