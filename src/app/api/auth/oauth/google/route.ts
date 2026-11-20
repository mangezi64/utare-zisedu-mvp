import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_INTENT_COOKIE_NAME,
  signOAuthIntentToken,
} from "@/lib/auth-session";
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
    req.nextUrl.origin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

function readOptionalField(
  params: URLSearchParams,
  key: string
): string | undefined {
  const raw = params.get(key);
  if (!raw) return undefined;
  const trimmed = raw.trim().slice(0, 120);
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function GET(req: NextRequest) {
  const origin = resolveOrigin(req);
  const params = req.nextUrl.searchParams;

  const intent: "login" | "register" =
    params.get("intent") === "register" ? "register" : "login";
  const accountType: "candidate" | "employer" =
    params.get("accountType") === "employer" ? "employer" : "candidate";

  const rawRedirect = params.get("redirect");
  const redirectUrl =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : undefined;

  const dataPolicyParam = params.get("dataPolicyAccepted");
  const companyName = readOptionalField(params, "companyName");
  const website = readOptionalField(params, "website");
  const industry = readOptionalField(params, "industry");
  const hiringModel = readOptionalField(params, "hiringModel");
  const city = readOptionalField(params, "city");
  const qualification = readOptionalField(params, "qualification");
  const fieldOfStudy = readOptionalField(params, "fieldOfStudy");

  const redirectWithError = (message: string) => {
    const query = `${intent === "register" ? "tab=register&" : ""}oauthError=${encodeURIComponent(
      message
    )}`;
    return NextResponse.redirect(`${origin}/login?${query}`, { status: 302 });
  };

  if (intent === "register" && dataPolicyParam === "false") {
    return redirectWithError(
      "You must read and accept the UTARE Data Policy before creating an account."
    );
  }

  if (intent === "register" && accountType === "employer" && !companyName) {
    return redirectWithError(
      "Company name is required for employer registration."
    );
  }

  if (!isSupabaseConfigured || !supabase) {
    return redirectWithError(
      "Google Sign-In requires Supabase Auth to be configured. Please sign in with email and password."
    );
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error || !data?.url) {
      return redirectWithError(
        error?.message || "Unable to start Google Sign-In right now."
      );
    }

    const intentToken = await signOAuthIntentToken({
      intent,
      accountType: intent === "register" ? accountType : undefined,
      companyName,
      website,
      industry,
      hiringModel,
      city,
      qualification,
      fieldOfStudy,
      dataPolicyAccepted: dataPolicyParam === "true",
      redirectUrl,
    });

    const res = NextResponse.redirect(data.url, { status: 302 });
    res.cookies.set(OAUTH_INTENT_COOKIE_NAME, intentToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return res;
  } catch (error) {
    console.error("[API /api/auth/oauth/google GET Error]:", error);
    return redirectWithError("Unable to start Google Sign-In right now.");
  }
}
