import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  confirmUserEmailByAddressAsync,
  createAuthUser,
  verifyUserEmailByTokenAsync,
} from "@/lib/store";
import { hashPassword } from "@/lib/password-hash";

const mockGetUser = vi.fn();
const mockVerifyOtp = vi.fn();
const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
    },
  },
  getSupabaseAdmin: () => null,
  getSupabaseServer: () => null,
}));

describe("Email Verification & Auth Callback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies Supabase implicit flow accessToken (#access_token=...) and sets session cookie", async () => {
    const email = `future-verify-${Date.now()}@example.com`;
    createAuthUser({
      email,
      name: "Future Wenzira",
      role: "candidate",
      passwordHash: hashPassword("SecurePass#2026"),
      emailConfirmed: false,
      confirmationToken: "tok-implicit-1",
    });

    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "supa-uid-1",
          email,
          app_metadata: { role: "candidate" },
          user_metadata: { full_name: "Future Wenzira" },
        },
      },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/verify-email/route");
    const req = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: "eyJ.mock.jwt" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.email).toBe(email);
    expect(data.role).toBe("candidate");
    expect(mockGetUser).toHaveBeenCalledWith("eyJ.mock.jwt");
    expect(res.cookies.get("utare_session")?.value).toBeTruthy();
  });

  it("verifies Supabase token_hash + type=signup", async () => {
    const email = `bheki-otp-${Date.now()}@example.com`;
    createAuthUser({
      email,
      name: "Bheki",
      role: "candidate",
      passwordHash: hashPassword("SecurePass#2026"),
      emailConfirmed: false,
    });

    mockVerifyOtp.mockResolvedValueOnce({
      data: {
        user: {
          id: "supa-uid-2",
          email,
          app_metadata: { role: "candidate" },
          user_metadata: { full_name: "Bheki" },
        },
      },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/verify-email/route");
    const req = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenHash: "hash-123", type: "signup" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.email).toBe(email);
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: "hash-123",
      type: "signup",
    });
  });

  it("verifies custom confirmation tokens and address confirmation asynchronously", async () => {
    const email = `async-token-${Date.now()}@example.com`;
    const token = `tok-${Date.now()}`;
    createAuthUser({
      email,
      name: "Async Candidate",
      role: "candidate",
      passwordHash: hashPassword("SecurePass#2026"),
      emailConfirmed: false,
      confirmationToken: token,
    });

    const verified = await verifyUserEmailByTokenAsync(token);
    expect(verified?.emailConfirmed).toBe(true);
    expect(verified?.confirmationToken).toBeUndefined();

    const confirmedByAddr = await confirmUserEmailByAddressAsync(email);
    expect(confirmedByAddr?.emailConfirmed).toBe(true);
  });

  it("returns 400 when all verification parameters are missing", async () => {
    const { POST } = await import("@/app/api/auth/verify-email/route");
    const req = new NextRequest("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Verification token is required");
  });
});
