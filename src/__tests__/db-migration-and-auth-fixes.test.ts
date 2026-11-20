import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ADDITIVE_SCHEMA_DDL, EXPECTED_TABLES } from "@/lib/db-schema";
import { safeSupabaseUpsert } from "@/lib/supabase/safe-write";

const mockSignUp = vi.fn();
const mockAdminCreateUser = vi.fn();
const mockAdminUpdateUserById = vi.fn();
const mockUpsertSpy = vi.fn();

vi.mock("@/lib/email-domain-check", () => ({
  checkEmailDomain: vi.fn(async () => "deliverable"),
}));

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  },
  getSupabaseAdmin: () => ({
    auth: {
      admin: {
        createUser: (...args: unknown[]) => mockAdminCreateUser(...args),
        updateUserById: (...args: unknown[]) => mockAdminUpdateUserById(...args),
      },
    },
  }),
  getSupabaseServer: () => ({
    from: (table: string) => ({
      upsert: (payload: Record<string, unknown>, opts?: unknown) => {
        mockUpsertSpy(table, payload, opts);
        return Promise.resolve({ data: payload, error: null });
      },
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}));

import { deleteAllUserData, findAuthUserByEmail } from "@/lib/store";

const createdEmails: string[] = [];

describe("Release DB Migrations, SafeWrite & Employer/Spam Auth Fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    for (const email of createdEmails) {
      await deleteAllUserData({
        targetEmail: email,
        actorEmail: "test-cleanup@utare-zem.org",
        actorRole: "superuser",
        reason: "Vitest cleanup",
      });
    }
  });

  it("1. safeSupabaseUpsert strips unknown columns on PGRST204 and Postgres 42703 and succeeds on retry", async () => {
    const payloadsSeen: Array<Record<string, unknown>> = [];
    const mockSb = {
      from: () => ({
        upsert: async (payload: Record<string, unknown>) => {
          payloadsSeen.push({ ...payload });
          if ("last_active_at" in payload) {
            return {
              data: null,
              error: {
                code: "PGRST204",
                message:
                  "Could not find the 'last_active_at' column of 'auth_users' in the schema cache",
              },
            };
          }
          if ("data_policy_version" in payload) {
            return {
              data: null,
              error: {
                code: "42703",
                message:
                  'column "data_policy_version" of relation "auth_users" does not exist',
              },
            };
          }
          return { data: payload, error: null };
        },
      }),
    } as unknown as SupabaseClient;

    const result = await safeSupabaseUpsert(
      mockSb,
      "auth_users",
      {
        id: "usr-test-1",
        email: "safewrite@example.co.zw",
        name: "Safe Write",
        last_active_at: "2026-11-20T00:00:00Z",
        data_policy_version: "2026-11-v1",
      },
      "email"
    );

    expect(result.error).toBeNull();
    expect(result.strippedColumns).toEqual([
      "last_active_at",
      "data_policy_version",
    ]);
    expect(payloadsSeen).toHaveLength(3);
    expect(payloadsSeen[2]).toEqual({
      id: "usr-test-1",
      email: "safewrite@example.co.zw",
      name: "Safe Write",
    });
  });

  it("2. safeSupabaseUpsert falls back to select + update/insert when ON CONFLICT unique constraint is missing (42P10)", async () => {
    const updateSpy = vi.fn(
      async (_payload: Record<string, unknown>) => ({
        data: { id: "uuid-1" },
        error: null,
      })
    );
    const insertSpy = vi.fn(
      async (_payload: Record<string, unknown>) => ({
        data: { id: "uuid-2" },
        error: null,
      })
    );
    let existingRow: { id: string } | null = { id: "uuid-1" };

    const mockSb = {
      from: () => ({
        upsert: async () => ({
          data: null,
          error: {
            code: "42P10",
            message:
              "there is no unique or exclusion constraint matching the ON CONFLICT specification",
          },
        }),
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: existingRow, error: null }),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: (_col: string, _val: string) => updateSpy(payload),
        }),
        insert: (payload: Record<string, unknown>) => insertSpy(payload),
      }),
    } as unknown as SupabaseClient;

    const updateRes = await safeSupabaseUpsert(
      mockSb,
      "employer_registrations",
      { email: "emp@company.co.zw", company_name: "Updated Corp" },
      "email"
    );
    expect(updateRes.error).toBeNull();
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy).not.toHaveBeenCalled();

    existingRow = null;
    const insertRes = await safeSupabaseUpsert(
      mockSb,
      "employer_registrations",
      { email: "newemp@company.co.zw", company_name: "New Corp" },
      "email"
    );
    expect(insertRes.error).toBeNull();
    expect(insertSpy).toHaveBeenCalledTimes(1);
  });

  it("3. Additive DDL files define all 14 expected tables, reload PostgREST schema, and forbid destructive DDL", () => {
    const sqlPath = path.join(process.cwd(), "supabase", "additive-schema.sql");
    expect(fs.existsSync(sqlPath)).toBe(true);
    const additiveSql = fs.readFileSync(sqlPath, "utf8");

    expect(EXPECTED_TABLES).toHaveLength(14);
    for (const table of EXPECTED_TABLES) {
      expect(additiveSql).toMatch(
        new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, "i")
      );
      expect(ADDITIVE_SCHEMA_DDL).toMatch(
        new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, "i")
      );
    }

    expect(additiveSql).toContain("NOTIFY pgrst, 'reload schema';");
    expect(ADDITIVE_SCHEMA_DDL).toContain("NOTIFY pgrst, 'reload schema';");

    const stripSqlComments = (sql: string) =>
      sql
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");

    const forbidden = /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DROP\s+CONSTRAINT)\b/i;
    expect(stripSqlComments(additiveSql)).not.toMatch(forbidden);
    expect(stripSqlComments(ADDITIVE_SCHEMA_DDL)).not.toMatch(forbidden);
  });

  it("4. POST /api/employers registers via Supabase Auth signUp, persists confirmation_token, and supports rate-limit fallback", async () => {
    const { POST } = await import("@/app/api/employers/route");

    const email1 = `emp-smtp-${Date.now()}@savannahtech.co.zw`;
    createdEmails.push(email1);

    mockSignUp.mockResolvedValueOnce({
      data: {
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          email: email1,
          identities: [{ id: "ident-1" }],
          email_confirmed_at: null,
        },
        session: null,
      },
      error: null,
    });
    mockAdminUpdateUserById.mockResolvedValueOnce({ data: {}, error: null });

    const req1 = new NextRequest("https://utare-zisedu-mvp.vercel.app/api/employers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://utare-zisedu-mvp.vercel.app",
      },
      body: JSON.stringify({
        companyName: "Savannah Tech Labs",
        contactPerson: "Sarah Jenkins",
        email: email1,
        password: "StrongPassword#2026",
      }),
    });

    const res1 = await POST(req1);
    const data1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(data1.success).toBe(true);
    expect(data1.requiresEmailConfirmation).toBe(true);
    expect(data1.confirmationPath).toBeUndefined();
    expect(data1.message.toLowerCase()).toContain("spam");
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: email1,
        options: expect.objectContaining({
          emailRedirectTo: "https://utare-zisedu-mvp.vercel.app/auth/callback",
        }),
      })
    );

    const stored1 = findAuthUserByEmail(email1);
    expect(stored1?.confirmationToken).toBeTruthy();
    expect(stored1?.emailConfirmed).toBe(false);
    expect(mockUpsertSpy).toHaveBeenCalledWith(
      "auth_users",
      expect.objectContaining({
        email: email1,
        confirmation_token: stored1?.confirmationToken,
      }),
      { onConflict: "email" }
    );

    // Rate-limit fallback via Admin API
    const email2 = `emp-ratelimit-${Date.now()}@savannahtech.co.zw`;
    createdEmails.push(email2);

    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Email rate limit exceeded", status: 429 },
    });
    mockAdminCreateUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "22222222-2222-4222-8222-222222222222",
          email: email2,
        },
      },
      error: null,
    });

    const req2 = new NextRequest("https://utare-zisedu-mvp.vercel.app/api/employers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Harare Remote Ops",
        contactPerson: "Tendai Moyo",
        email: email2,
        password: "StrongPassword#2026",
      }),
    });

    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(data2.success).toBe(true);
    expect(data2.requiresEmailConfirmation).toBe(false);
    expect(data2.confirmationPath).toContain("/auth/callback?token=");
    expect(mockAdminCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: email2,
        email_confirm: true,
      })
    );
  });

  it("5. Login, callback, employers UI and auth APIs guide users to check Spam/Junk/Promotions folders", () => {
    const filesToCheck = [
      "src/app/login/page.tsx",
      "src/app/employers/page.tsx",
      "src/app/auth/callback/page.tsx",
      "src/app/api/auth/login/route.ts",
      "src/app/api/auth/signup/route.ts",
      "src/app/api/auth/resend-confirmation/route.ts",
    ];

    for (const relPath of filesToCheck) {
      const content = fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
      expect(content.toLowerCase()).toContain("spam");
    }

    const loginPage = fs.readFileSync(
      path.join(process.cwd(), "src/app/login/page.tsx"),
      "utf8"
    );
    expect(loginPage).toContain("Not seeing it in your inbox? Check your Spam folder");
    expect(loginPage).toContain("utarezemai@gmail.com");
  });
});
