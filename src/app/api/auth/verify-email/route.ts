import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, User as SupabaseUser } from "@supabase/supabase-js";
import {
  confirmUserEmailByAddressAsync,
  findCandidateByEmailAsync,
  findEmployerByEmailAsync,
  StoredAuthUser,
  verifyUserEmailByTokenAsync,
} from "@/lib/store";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth-session";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase/client";
import { resolveBootstrapRole } from "@/lib/bootstrap-roles";
import { UserRole } from "@/types";

export const runtime = "nodejs";

const VALID_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "email",
  "magiclink",
  "recovery",
  "email_change",
]);

function normalizeOtpType(rawType: string): EmailOtpType {
  const lowered = rawType.trim().toLowerCase() as EmailOtpType;
  return VALID_OTP_TYPES.has(lowered) ? lowered : "signup";
}

async function buildVerifiedSessionResponse(params: {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  city?: string;
  qualification?: string;
  fieldOfStudy?: string;
}) {
  const sessionToken = await signSessionToken({
    sub: params.userId,
    email: params.email,
    name: params.name,
    role: params.role,
    emailConfirmed: true,
    companyName: params.companyName,
    city: params.city,
    qualification: params.qualification,
    fieldOfStudy: params.fieldOfStudy,
  });

  const res = NextResponse.json({
    success: true,
    role: params.role,
    email: params.email,
    user: {
      id: params.userId,
      email: params.email,
      name: params.name,
      role: params.role,
      emailConfirmed: true,
      companyName: params.companyName,
      city: params.city,
      qualification: params.qualification,
      fieldOfStudy: params.fieldOfStudy,
    },
  });

  res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

async function finalizeSupabaseVerifiedUser(supaUser: SupabaseUser) {
  const verifiedEmail = (supaUser.email || "").trim().toLowerCase();
  const localUser: StoredAuthUser | null =
    await confirmUserEmailByAddressAsync(verifiedEmail);
  const candidate = await findCandidateByEmailAsync(verifiedEmail);
  const employer = await findEmployerByEmailAsync(verifiedEmail);

  let adminRole: UserRole | undefined;
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data: adminData } = await adminClient.auth.admin.getUserById(
        supaUser.id
      );
      if (adminData?.user?.app_metadata?.role) {
        adminRole = adminData.user.app_metadata.role as UserRole;
      }
    } catch {}
  }

  const metaAccountType =
    supaUser.user_metadata?.account_type === "employer"
      ? ("employer" as UserRole)
      : undefined;

  const rawRole: UserRole =
    adminRole ||
    (supaUser.app_metadata?.role as UserRole) ||
    localUser?.role ||
    metaAccountType ||
    (supaUser.user_metadata?.account_type as UserRole) ||
    (employer && !candidate ? "employer" : "candidate");

  const finalRole = resolveBootstrapRole(verifiedEmail, rawRole);

  return buildVerifiedSessionResponse({
    userId: supaUser.id,
    email: verifiedEmail,
    name:
      localUser?.name ||
      (supaUser.user_metadata?.full_name as string) ||
      candidate?.profile.fullName ||
      employer?.contactPerson ||
      verifiedEmail.split("@")[0],
    role: finalRole,
    companyName:
      localUser?.companyName ||
      (supaUser.user_metadata?.company_name as string | undefined) ||
      employer?.companyName,
    city: localUser?.city || candidate?.profile.city,
    qualification:
      localUser?.qualification || candidate?.profile.highestQualification,
    fieldOfStudy: localUser?.fieldOfStudy || candidate?.profile.fieldOfStudy,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || "").trim();
    const code = String(body.code || "").trim();
    const tokenHash = String(body.tokenHash || body.token_hash || "").trim();
    const accessToken = String(
      body.accessToken || body.access_token || ""
    ).trim();
    const otpType = normalizeOtpType(String(body.type || "signup"));
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    // 1. Handle Supabase implicit flow (#access_token=...) from confirmation email links
    if (accessToken && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data?.user || !data.user.email) {
        return NextResponse.json(
          {
            error:
              error?.message ||
              "Invalid or expired email verification session.",
          },
          { status: 400 }
        );
      }
      return finalizeSupabaseVerifiedUser(data.user);
    }

    // 2. Handle Supabase OTP token_hash (?token_hash=...&type=signup)
    if (tokenHash && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });
      if (error || !data?.user || !data.user.email) {
        return NextResponse.json(
          { error: error?.message || "Invalid or expired verification link." },
          { status: 400 }
        );
      }
      return finalizeSupabaseVerifiedUser(data.user);
    }

    // 3. Handle Supabase PKCE code exchange (?code=...)
    if (code && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data?.user || !data.user.email) {
        return NextResponse.json(
          { error: error?.message || "Invalid or expired verification code." },
          { status: 400 }
        );
      }
      return finalizeSupabaseVerifiedUser(data.user);
    }

    // 4. Verify backend confirmation token (?token=...) across store & Postgres/Supabase
    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    const user = await verifyUserEmailByTokenAsync(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired email confirmation link." },
        { status: 400 }
      );
    }

    if (email && user.email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Confirmation token does not match email address." },
        { status: 400 }
      );
    }

    const candidate = await findCandidateByEmailAsync(user.email);
    const employer = await findEmployerByEmailAsync(user.email);
    const finalRole = resolveBootstrapRole(user.email, user.role);

    return buildVerifiedSessionResponse({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: finalRole,
      companyName: user.companyName || employer?.companyName,
      city: user.city || candidate?.profile.city,
      qualification:
        user.qualification || candidate?.profile.highestQualification,
      fieldOfStudy: user.fieldOfStudy || candidate?.profile.fieldOfStudy,
    });
  } catch (error) {
    console.error("[API /api/auth/verify-email POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to verify email." },
      { status: 500 }
    );
  }
}
