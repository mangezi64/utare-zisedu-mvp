import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  OAUTH_INTENT_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  signOAuthIntentToken,
  verifyOAuthIntentToken,
} from "@/lib/auth-session";
import { hashPassword } from "@/lib/password-hash";
import {
  createAuthUser,
  deleteAllUserData,
  findAuthUserByEmail,
  findCandidateByEmail,
  findEmployerByEmail,
} from "@/lib/store";

const mockSignInWithOAuth = vi.fn();
const mockGetUser = vi.fn();
const mockVerifyOtp = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockAdminGetUserById = vi.fn();
const mockAdminUpdateUserById = vi.fn();
const mockUpsertSpy = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
      signInWithPassword: (...args: unknown[]) =>
        mockSignInWithPassword(...args),
    },
  },
  getSupabaseAdmin: () => ({
    auth: {
      admin: {
        getUserById: (...args: unknown[]) => mockAdminGetUserById(...args),
        updateUserById: (...args: unknown[]) =>
          mockAdminUpdateUserById(...args),
      },
    },
  }),
  getSupabaseServer: () => ({
    from: (table: string) => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      upsert: (payload: Record<string, unknown>, opts?: unknown) => {
        mockUpsertSpy(table, payload, opts);
        return Promise.resolve({ data: payload, error: null });
      },
      update: () => ({
        ilike: async () => ({ data: null, error: null }),
        eq: async () => ({ data: null, error: null }),
      }),
      delete: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  }),
}));

const createdEmails: string[] = [];

describe("Google OAuth Sign-In & Registration Flow", () => {
  const originalSuperusers = process.env.SUPERUSER_EMAILS;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminGetUserById.mockResolvedValue({ data: { user: null }, error: null });
    mockAdminUpdateUserById.mockResolvedValue({ data: { user: null }, error: null });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
  });

  afterAll(async () => {
    process.env.SUPERUSER_EMAILS = originalSuperusers;
    for (const email of createdEmails) {
      await deleteAllUserData({
        targetEmail: email,
        actorEmail: "test-cleanup@utare-zem.org",
        actorRole: "superuser",
        reason: "Google OAuth Vitest cleanup",
      });
    }
  });

  it("1. GET /api/auth/oauth/google redirects to Supabase Google authorize URL and sets signed intent cookie", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: {
        provider: "google",
        url: "https://stzsuwwmeiqdhsoghmrj.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&prompt=select_account",
      },
      error: null,
    });

    const { GET } = await import("@/app/api/auth/oauth/google/route");
    const req = new NextRequest(
      "http://localhost:3000/api/auth/oauth/google?intent=login&redirect=%2Fjobs",
      { method: "GET" }
    );

    const res = await GET(req);
    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("provider=google");
    expect(location).toContain("prompt=select_account");
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });

    const intentCookie = res.cookies.get(OAUTH_INTENT_COOKIE_NAME)?.value;
    expect(intentCookie).toBeTruthy();
    const verified = await verifyOAuthIntentToken(intentCookie);
    expect(verified).toMatchObject({
      intent: "login",
      redirectUrl: "/jobs",
    });
  });

  it("2. GET /api/auth/oauth/google blocks unconsented registration and redirects back to /login", async () => {
    const { GET } = await import("@/app/api/auth/oauth/google/route");
    const req = new NextRequest(
      "http://localhost:3000/api/auth/oauth/google?intent=register&dataPolicyAccepted=false",
      { method: "GET" }
    );

    const res = await GET(req);
    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login?tab=register&oauthError=");
    expect(decodeURIComponent(location)).toContain("UTARE Data Policy");
    expect(mockSignInWithOAuth).not.toHaveBeenCalled();
  });

  it("3. GET /api/auth/oauth/google requires companyName when registering as an employer", async () => {
    const { GET } = await import("@/app/api/auth/oauth/google/route");
    const req = new NextRequest(
      "http://localhost:3000/api/auth/oauth/google?intent=register&accountType=employer&dataPolicyAccepted=true",
      { method: "GET" }
    );

    const res = await GET(req);
    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login?tab=register&oauthError=");
    expect(decodeURIComponent(location)).toContain("Company name is required");
    expect(mockSignInWithOAuth).not.toHaveBeenCalled();
  });

  it("4. POST /api/auth/verify-email provisions a new Google candidate, sets session, clears intent cookie, and routes to /assessment", async () => {
    const ts = Date.now();
    const email = `google-cand-${ts}@gmail.com`;
    createdEmails.push(email);

    const intentToken = await signOAuthIntentToken({
      intent: "register",
      accountType: "candidate",
      city: "Bulawayo",
      qualification: "Bachelors Degree",
      fieldOfStudy: "Data Analytics",
      dataPolicyAccepted: true,
    });

    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: `supa-cand-${ts}`,
          email,
          app_metadata: { provider: "google", providers: ["google"] },
          user_metadata: { full_name: "Tendai Moyo" },
        },
      },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/verify-email/route");
    const req = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${OAUTH_INTENT_COOKIE_NAME}=${intentToken}`,
      },
      body: JSON.stringify({ accessToken: "eyJ.google.candidate" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.role).toBe("candidate");
    expect(data.redirectTo).toBe("/assessment");
    expect(data.provider).toBe("google");
    expect(res.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();
    expect(res.cookies.get(OAUTH_INTENT_COOKIE_NAME)?.value).toBe("");

    const authUser = findAuthUserByEmail(email);
    expect(authUser).toBeTruthy();
    expect(authUser?.passwordHash).toBe("supabase_managed");
    expect(authUser?.emailConfirmed).toBe(true);
    expect(authUser?.dataPolicyAcceptedAt).toBeTruthy();
    expect(authUser?.city).toBe("Bulawayo");

    const cand = findCandidateByEmail(email);
    expect(cand).toBeTruthy();
    expect(cand?.profile.city).toBe("Bulawayo");
    expect(cand?.profile.fieldOfStudy).toBe("Data Analytics");

    expect(mockUpsertSpy).toHaveBeenCalledWith(
      "candidate_profiles",
      expect.objectContaining({ email, city: "Bulawayo" }),
      { onConflict: "email" }
    );
    expect(mockUpsertSpy).toHaveBeenCalledWith(
      "auth_users",
      expect.objectContaining({
        email,
        password_hash: "supabase_managed",
        email_confirmed: true,
      }),
      { onConflict: "email" }
    );
  });

  it("5. POST /api/auth/verify-email provisions a new Google employer and routes to /employer", async () => {
    const ts = Date.now();
    const email = `google-emp-${ts}@gmail.com`;
    createdEmails.push(email);

    const intentToken = await signOAuthIntentToken({
      intent: "register",
      accountType: "employer",
      companyName: "Zambezi Cloud Works",
      industry: "FinTech",
      hiringModel: "100% Remote Contract",
      dataPolicyAccepted: true,
    });

    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: `supa-emp-${ts}`,
          email,
          app_metadata: { provider: "google", providers: ["google"] },
          user_metadata: { full_name: "Chido Nyathi" },
        },
      },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/verify-email/route");
    const req = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${OAUTH_INTENT_COOKIE_NAME}=${intentToken}`,
      },
      body: JSON.stringify({ accessToken: "eyJ.google.employer" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.role).toBe("employer");
    expect(data.redirectTo).toBe("/employer");

    const emp = findEmployerByEmail(email);
    expect(emp).toBeTruthy();
    expect(emp?.companyName).toBe("Zambezi Cloud Works");
    expect(emp?.verificationStatus).toBe("pending");

    const authUser = findAuthUserByEmail(email);
    expect(authUser).toBeTruthy();
    expect(authUser?.role).toBe("employer");
    expect(authUser?.orgRole).toBe("org_admin");
    expect(authUser?.companyName).toBe("Zambezi Cloud Works");
  });

  it("6. POST /api/auth/verify-email confirms existing unconfirmed email/password users without overwriting passwordHash or role", async () => {
    const ts = Date.now();
    const email = `existing-pw-${ts}@gmail.com`;
    createdEmails.push(email);
    const originalHash = hashPassword("ExistingStrongPass#2026");

    createAuthUser({
      email,
      name: "Kudakwashe Existing",
      role: "candidate",
      passwordHash: originalHash,
      emailConfirmed: false,
      confirmationToken: `tok-old-${ts}`,
    });

    // Even if an attacker or user passes an employer intent cookie, existing candidate role must not escalate
    const spoofedIntent = await signOAuthIntentToken({
      intent: "register",
      accountType: "employer",
      companyName: "Spoofed Co",
      dataPolicyAccepted: true,
    });

    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: `supa-existing-${ts}`,
          email,
          app_metadata: { provider: "google", providers: ["google"] },
          user_metadata: { full_name: "Kudakwashe Existing" },
        },
      },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/verify-email/route");
    const req = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${OAUTH_INTENT_COOKIE_NAME}=${spoofedIntent}`,
      },
      body: JSON.stringify({ accessToken: "eyJ.google.existing" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.role).toBe("candidate");
    expect(data.redirectTo).toBe("/account");

    const updated = findAuthUserByEmail(email);
    expect(updated?.emailConfirmed).toBe(true);
    expect(updated?.passwordHash).toBe(originalHash);
    expect(updated?.role).toBe("candidate");
    expect(findEmployerByEmail(email)).toBeNull();
  });

  it("7. POST /api/auth/verify-email preserves superuser bootstrap role and ignores tampered intent cookies", async () => {
    const ts = Date.now();
    const email = `google-superuser-${ts}@gmail.com`;
    createdEmails.push(email);
    process.env.SUPERUSER_EMAILS = email;

    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: `supa-super-${ts}`,
          email,
          app_metadata: { provider: "google", providers: ["google"] },
          user_metadata: { full_name: "Bootstrap Admin" },
        },
      },
      error: null,
    });

    // Tampered unsigned cookie claiming employer + /employer redirect must be ignored
    const tamperedCookie = `${Buffer.from(
      JSON.stringify({
        intent: "register",
        accountType: "employer",
        companyName: "Tampered Corp",
        redirectUrl: "/employer",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 600,
      })
    ).toString("base64url")}.invalid-signature`;

    const { POST } = await import("@/app/api/auth/verify-email/route");
    const req = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${OAUTH_INTENT_COOKIE_NAME}=${tamperedCookie}`,
      },
      body: JSON.stringify({ accessToken: "eyJ.google.super" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.role).toBe("superuser");
    expect(data.redirectTo).toBe("/admin");
    expect(findEmployerByEmail(email)).toBeNull();
    expect(findAuthUserByEmail(email)?.role).toBe("superuser");
  });

  it("8. POST /api/auth/login returns 401 with Google Sign-In hint for supabase_managed OAuth accounts", async () => {
    const ts = Date.now();
    const email = `google-only-login-${ts}@gmail.com`;
    createdEmails.push(email);

    createAuthUser({
      email,
      name: "Google Only User",
      role: "candidate",
      passwordHash: "supabase_managed",
      emailConfirmed: true,
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "SomePassword#2026" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Google Sign-In");
    expect(data.error).toContain("Continue with Google");
  });

  it("9. Login page wires Google Sign-In controls for both Sign In and Create Account", () => {
    const loginPage = fs.readFileSync(
      path.join(process.cwd(), "src/app/login/page.tsx"),
      "utf-8"
    );
    expect(loginPage).toContain("Continue with Google");
    expect(loginPage).toContain("/api/auth/oauth/google");
    expect(loginPage).toContain("Continue with Google as Employer");
    expect(loginPage).toContain("Continue with Google as Candidate");
    expect(loginPage).toContain("oauthError");
  });
});
