import { NextRequest, NextResponse } from "next/server";
import {
  confirmUserEmailByAddress,
  findCandidateByEmail,
  findEmployerByEmail,
  verifyUserEmailByToken,
} from "@/lib/store";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth-session";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { UserRole } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || "").trim();
    const code = String(body.code || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    // 1. Handle Supabase PKCE code exchange when Supabase Auth is active
    if (code && isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user || !data.user.email) {
        return NextResponse.json(
          { error: error?.message || "Invalid or expired verification code." },
          { status: 400 }
        );
      }

      const verifiedEmail = data.user.email.toLowerCase();
      const localUser = confirmUserEmailByAddress(verifiedEmail);
      const role: UserRole =
        (data.user.app_metadata?.role as UserRole) ||
        localUser?.role ||
        (data.user.user_metadata?.account_type as UserRole) ||
        "candidate";

      const sessionToken = await signSessionToken({
        sub: data.user.id,
        email: verifiedEmail,
        name:
          localUser?.name ||
          (data.user.user_metadata?.full_name as string) ||
          verifiedEmail.split("@")[0],
        role,
        emailConfirmed: true,
        companyName: localUser?.companyName,
      });

      const res = NextResponse.json({
        success: true,
        role,
        email: verifiedEmail,
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

    // 2. Verify backend confirmation token
    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    const user = verifyUserEmailByToken(token);
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

    const candidate = findCandidateByEmail(user.email);
    const employer = findEmployerByEmail(user.email);

    const sessionToken = await signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailConfirmed: true,
      companyName: user.companyName || employer?.companyName,
      city: user.city || candidate?.profile.city,
      qualification:
        user.qualification || candidate?.profile.highestQualification,
      fieldOfStudy: user.fieldOfStudy || candidate?.profile.fieldOfStudy,
    });

    const res = NextResponse.json({
      success: true,
      role: user.role,
      email: user.email,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailConfirmed: true,
        companyName: user.companyName || employer?.companyName,
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
  } catch (error) {
    console.error("[API /api/auth/verify-email POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to verify email." },
      { status: 500 }
    );
  }
}
