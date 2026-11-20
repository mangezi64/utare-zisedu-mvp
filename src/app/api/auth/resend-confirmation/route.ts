import { NextRequest, NextResponse } from "next/server";
import { validateEmail } from "@/lib/validation";
import {
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
} from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export const runtime = "nodejs";

function resolveOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const derivedHostOrigin = host ? `${proto}://${host}` : undefined;

  return (
    req.headers.get("origin") ||
    derivedHostOrigin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const normalizedEmail = String(body.email || "")
      .trim()
      .toLowerCase();

    const emailCheck = validateEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json(
        { error: emailCheck.error || "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const origin = resolveOrigin(req);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          (error as { status?: number }).status === 429;
        if (isRateLimit) {
          return NextResponse.json(
            {
              error:
                "Email sending rate limit reached. Please wait a few minutes before requesting another confirmation email.",
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: error.message || "Could not resend confirmation email." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "If an unconfirmed account exists for this email, a fresh confirmation link has been sent. Please check your inbox as well as your Spam, Junk, or Promotions folder.",
      });
    }

    // Local/non-Supabase fallback mode
    const userRecord =
      findAuthUserByEmail(normalizedEmail) ||
      (await findAuthUserByEmailFromDb(normalizedEmail));

    const confirmationPath =
      userRecord && !userRecord.emailConfirmed && userRecord.confirmationToken
        ? `/auth/callback?token=${encodeURIComponent(
            userRecord.confirmationToken
          )}&email=${encodeURIComponent(normalizedEmail)}`
        : undefined;

    return NextResponse.json({
      success: true,
      confirmationPath,
      message: confirmationPath
        ? "Confirmation link is ready below."
        : "If an unconfirmed account exists for this email, it is ready to confirm.",
    });
  } catch (error) {
    console.error("[API /api/auth/resend-confirmation POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to resend confirmation email." },
      { status: 500 }
    );
  }
}
