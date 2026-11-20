import { NextRequest, NextResponse } from "next/server";
import { adminUnauthorizedResponse, isAdminRequest } from "@/lib/auth-guard";
import { generateRandomToken } from "@/lib/password-hash";
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  findEmployerByEmailAsync,
  findEmployerById,
  setUserResetToken,
} from "@/lib/store";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const runtime = "nodejs";

const RESET_LINK_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }

  try {
    const body = await req.json();
    const employerId = String(body.employerId || "").trim();
    const rawEmail = String(body.email || "").trim().toLowerCase();

    if (!employerId && !rawEmail) {
      return NextResponse.json(
        { error: "Either employerId or email is required." },
        { status: 400 }
      );
    }

    let employer = employerId ? findEmployerById(employerId) : null;
    let authUser = rawEmail
      ? findAuthUserByEmail(rawEmail) ||
        (await findAuthUserByEmailFromDb(rawEmail))
      : null;

    if (!employer && rawEmail) {
      employer = await findEmployerByEmailAsync(rawEmail);
    }

    const targetEmail = (
      rawEmail ||
      authUser?.email ||
      employer?.email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Employer or user account not found." },
        { status: 404 }
      );
    }

    if (!authUser) {
      authUser =
        findAuthUserByEmail(targetEmail) ||
        (await findAuthUserByEmailFromDb(targetEmail));
    }

    if (!employer && !authUser) {
      return NextResponse.json(
        { error: "No matching employer registration or user account found." },
        { status: 404 }
      );
    }

    if (!authUser && employer) {
      authUser = createAuthUser({
        email: targetEmail,
        name:
          employer.contactPerson ||
          employer.companyName ||
          targetEmail.split("@")[0],
        role: "employer",
        orgRole: "org_admin",
        employerId: employer.id,
        companyName: employer.companyName,
        passwordHash: "pending_invite",
        emailConfirmed: false,
        isActive: true,
      });
    }

    const token = generateRandomToken(24);
    const expiresAt = new Date(Date.now() + RESET_LINK_TTL_MS).toISOString();
    await setUserResetToken(targetEmail, token, expiresAt);

    const origin = req.nextUrl.origin;
    const resetUrl = `${origin}/auth/callback?reset_token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(targetEmail)}&type=recovery`;

    const adminClient = getSupabaseAdmin();
    if (adminClient) {
      try {
        await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: targetEmail,
          options: {
            redirectTo: `${origin}/auth/callback`,
          },
        });
      } catch (err) {
        console.warn("[Admin Employer Reset-Link Supabase Warning]:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      email: targetEmail,
      resetUrl,
      expiresAt,
    });
  } catch (error) {
    console.error("[API /api/admin/employers/reset-link POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate reset link." },
      { status: 500 }
    );
  }
}
