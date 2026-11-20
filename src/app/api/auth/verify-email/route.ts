import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, User as SupabaseUser } from "@supabase/supabase-js";
import {
  confirmUserEmailByAddressAsync,
  confirmUserRemainOnPlatform,
  createAuthUser,
  findCandidateByEmailAsync,
  findEmployerByEmailAsync,
  registerOrUpdateCandidate,
  saveEmployerRegistration,
  StoredAuthUser,
  touchUserActivity,
  verifyUserEmailByTokenAsync,
} from "@/lib/store";
import {
  OAUTH_INTENT_COOKIE_NAME,
  OAuthIntentPayload,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyOAuthIntentToken,
} from "@/lib/auth-session";
import {
  getSupabaseAdmin,
  getSupabaseServer,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase/client";
import { isValidUuid, safeSupabaseUpsert } from "@/lib/supabase/safe-write";
import {
  resolveBootstrapRole,
  resolvePostLoginDestination,
} from "@/lib/bootstrap-roles";
import { CandidateProfile, OrgRole, UserRole } from "@/types";

export const runtime = "nodejs";

const VALID_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "email",
  "magiclink",
  "recovery",
  "invite",
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
  orgRole?: OrgRole;
  employerId?: string;
  hubId?: string;
  companyName?: string;
  city?: string;
  qualification?: string;
  fieldOfStudy?: string;
  redirectTo?: string;
  provider?: string;
  clearOAuthIntent?: boolean;
}) {
  const sessionToken = await signSessionToken({
    sub: params.userId,
    email: params.email,
    name: params.name,
    role: params.role,
    orgRole: params.orgRole,
    employerId: params.employerId,
    hubId: params.hubId,
    emailConfirmed: true,
    companyName: params.companyName,
    city: params.city,
    qualification: params.qualification,
    fieldOfStudy: params.fieldOfStudy,
  });

  const res = NextResponse.json({
    success: true,
    role: params.role,
    orgRole: params.orgRole,
    employerId: params.employerId,
    hubId: params.hubId,
    email: params.email,
    ...(params.redirectTo ? { redirectTo: params.redirectTo } : {}),
    ...(params.provider ? { provider: params.provider } : {}),
    user: {
      id: params.userId,
      email: params.email,
      name: params.name,
      role: params.role,
      orgRole: params.orgRole,
      employerId: params.employerId,
      hubId: params.hubId,
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

  if (params.clearOAuthIntent) {
    res.cookies.set(OAUTH_INTENT_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}

async function finalizeSupabaseVerifiedUser(
  supaUser: SupabaseUser,
  oauthIntent: OAuthIntentPayload | null = null,
  clearOAuthIntent = false
) {
  const verifiedEmail = (supaUser.email || "").trim().toLowerCase();
  let localUser: StoredAuthUser | null =
    await confirmUserEmailByAddressAsync(verifiedEmail);
  let candidate = await findCandidateByEmailAsync(verifiedEmail);
  let employer = await findEmployerByEmailAsync(verifiedEmail);
  const isExistingAccount = Boolean(localUser || candidate || employer);

  const provider = String(supaUser.app_metadata?.provider || "").toLowerCase();
  const isOAuthProvider =
    provider === "google" ||
    (Array.isArray(supaUser.app_metadata?.providers) &&
      supaUser.app_metadata.providers.includes("google")) ||
    Boolean(oauthIntent);

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
    (employer && !candidate ? "employer" : undefined) ||
    metaAccountType ||
    (supaUser.user_metadata?.account_type as UserRole) ||
    (!isExistingAccount && oauthIntent?.accountType === "employer"
      ? "employer"
      : undefined) ||
    "candidate";

  const finalRole = resolveBootstrapRole(verifiedEmail, rawRole);

  const resolvedName =
    localUser?.name ||
    (supaUser.user_metadata?.full_name as string) ||
    (supaUser.user_metadata?.name as string) ||
    candidate?.profile.fullName ||
    employer?.contactPerson ||
    verifiedEmail.split("@")[0];

  const sb = getSupabaseServer();
  const dataPolicyAcceptedAt =
    oauthIntent?.dataPolicyAccepted || isOAuthProvider
      ? new Date().toISOString()
      : undefined;
  const dataPolicyVersion = dataPolicyAcceptedAt ? "2026-11-v1" : undefined;

  if (finalRole === "employer" && !employer && isOAuthProvider) {
    const companyName =
      oauthIntent?.companyName || `${resolvedName}'s Organization`;
    const empRecord = saveEmployerRegistration({
      userId: supaUser.id,
      companyName,
      contactPerson: resolvedName,
      email: verifiedEmail,
      website: oauthIntent?.website || "",
      industry: oauthIntent?.industry || "Technology & SaaS",
      rolesInterested: ["Remote Operations, Tech & Data"],
      hiringModel: oauthIntent?.hiringModel || "100% Remote Contract",
      estimatedHires: 1,
      timezoneOverlapNeeded: "CAT (GMT+2) / UK-EU overlap",
      additionalNotes: "",
      verificationStatus: "pending",
    });
    employer = empRecord;

    if (sb) {
      await safeSupabaseUpsert(
        sb,
        "employer_registrations",
        {
          ...(isValidUuid(empRecord.id) ? { id: empRecord.id } : {}),
          user_id: supaUser.id || null,
          company_name: empRecord.companyName,
          contact_person: empRecord.contactPerson,
          email: empRecord.email,
          website: empRecord.website || "",
          industry: empRecord.industry || "Technology & SaaS",
          roles_interested: empRecord.rolesInterested,
          hiring_model: empRecord.hiringModel,
          estimated_hires: empRecord.estimatedHires,
          timezone_overlap_needed: empRecord.timezoneOverlapNeeded,
          additional_notes: empRecord.additionalNotes || "",
          verification_status: empRecord.verificationStatus,
          updated_at: new Date().toISOString(),
        },
        "email"
      );
    }
  } else if (finalRole === "candidate" && !candidate && isOAuthProvider) {
    const city = oauthIntent?.city || "Harare";
    const highestQualification = (oauthIntent?.qualification ||
      "Bachelors Degree") as CandidateProfile["highestQualification"];
    const fieldOfStudy = oauthIntent?.fieldOfStudy || "Computer Science & IT";

    const candRecord = registerOrUpdateCandidate({
      fullName: resolvedName,
      email: verifiedEmail,
      phone: "",
      city,
      highestQualification,
      fieldOfStudy,
      yearsExperience: 0,
      hasDedicatedLaptop: false,
      primaryDevice: "Smartphone Only",
      internetAccessType: "Mobile Data Bundles Only",
      powerReliabilityHours: 6,
      hasGlobalPaymentRail: false,
      primaryGoal: "International Remote Work",
      currentSkills: fieldOfStudy ? [fieldOfStudy] : [],
    });
    candidate = candRecord;

    if (sb) {
      await safeSupabaseUpsert(
        sb,
        "candidate_profiles",
        {
          user_id: supaUser.id,
          full_name: resolvedName,
          email: verifiedEmail,
          phone: "",
          city,
          highest_qualification: highestQualification,
          field_of_study: fieldOfStudy,
          years_experience: 0,
          employment_status: "Not specified",
          monthly_income_bracket: "Not collected",
          has_dedicated_laptop: false,
          primary_device: "Smartphone Only",
          internet_access_type: "Mobile Data Bundles Only",
          power_reliability_hours: 6,
          has_global_payment_rail: false,
          primary_goal: "International Remote Work",
          updated_at: new Date().toISOString(),
        },
        "email"
      );
    }
  }

  if (!localUser && isOAuthProvider) {
    const createdUser = createAuthUser({
      id: supaUser.id,
      email: verifiedEmail,
      name: resolvedName,
      role: finalRole,
      passwordHash: "supabase_managed",
      emailConfirmed: true,
      employerId: employer?.id,
      orgRole: finalRole === "employer" ? "org_admin" : undefined,
      companyName: employer?.companyName || oauthIntent?.companyName,
      city: candidate?.profile.city || oauthIntent?.city,
      qualification:
        candidate?.profile.highestQualification || oauthIntent?.qualification,
      fieldOfStudy:
        candidate?.profile.fieldOfStudy || oauthIntent?.fieldOfStudy,
      dataPolicyAcceptedAt,
      dataPolicyVersion,
    });
    localUser = createdUser;

    if (sb) {
      await safeSupabaseUpsert(
        sb,
        "auth_users",
        {
          id: supaUser.id || createdUser.id,
          email: verifiedEmail,
          name: resolvedName,
          role: finalRole,
          password_hash: "supabase_managed",
          email_confirmed: true,
          confirmation_token: null,
          employer_id: employer?.id || null,
          org_role: finalRole === "employer" ? "org_admin" : null,
          company_name:
            employer?.companyName || oauthIntent?.companyName || null,
          data_policy_accepted_at: dataPolicyAcceptedAt || null,
          data_policy_version: dataPolicyVersion || null,
          last_active_at: createdUser.lastActiveAt || new Date().toISOString(),
        },
        "email"
      );
    }
  } else if (localUser) {
    if ((localUser.inactivityNoticesSent ?? 0) > 0) {
      confirmUserRemainOnPlatform(verifiedEmail);
    } else {
      touchUserActivity(verifiedEmail);
    }
  }

  if (adminClient && !adminRole && isOAuthProvider) {
    try {
      await adminClient.auth.admin.updateUserById(supaUser.id, {
        app_metadata: {
          role: finalRole,
          ...(finalRole === "employer" ? { org_role: "org_admin" } : {}),
        },
      });
    } catch {}
  }

  const redirectTo = isExistingAccount
    ? resolvePostLoginDestination(finalRole, oauthIntent?.redirectUrl)
    : finalRole === "candidate"
    ? oauthIntent?.redirectUrl
      ? resolvePostLoginDestination(finalRole, oauthIntent.redirectUrl)
      : "/assessment"
    : resolvePostLoginDestination(finalRole, oauthIntent?.redirectUrl);

  return buildVerifiedSessionResponse({
    userId: supaUser.id,
    email: verifiedEmail,
    name: resolvedName,
    role: finalRole,
    orgRole:
      localUser?.orgRole ||
      (supaUser.app_metadata?.org_role as OrgRole | undefined),
    employerId:
      localUser?.employerId ||
      (supaUser.app_metadata?.employer_id as string | undefined) ||
      employer?.id,
    hubId:
      localUser?.hubId ||
      (supaUser.app_metadata?.hub_id as string | undefined),
    companyName:
      localUser?.companyName ||
      (supaUser.user_metadata?.company_name as string | undefined) ||
      employer?.companyName ||
      oauthIntent?.companyName,
    city: localUser?.city || candidate?.profile.city || oauthIntent?.city,
    qualification:
      localUser?.qualification ||
      candidate?.profile.highestQualification ||
      oauthIntent?.qualification,
    fieldOfStudy:
      localUser?.fieldOfStudy ||
      candidate?.profile.fieldOfStudy ||
      oauthIntent?.fieldOfStudy,
    redirectTo,
    provider: provider || (isOAuthProvider ? "google" : undefined),
    clearOAuthIntent,
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

    const rawIntentCookie = req.cookies.get(OAUTH_INTENT_COOKIE_NAME)?.value;
    const oauthIntent = rawIntentCookie
      ? await verifyOAuthIntentToken(rawIntentCookie)
      : null;
    const clearOAuthIntent = Boolean(rawIntentCookie);

    // 1. Handle Supabase implicit flow (#access_token=...) from confirmation email links or OAuth
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
      return finalizeSupabaseVerifiedUser(
        data.user,
        oauthIntent,
        clearOAuthIntent
      );
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
      return finalizeSupabaseVerifiedUser(
        data.user,
        oauthIntent,
        clearOAuthIntent
      );
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
      return finalizeSupabaseVerifiedUser(
        data.user,
        oauthIntent,
        clearOAuthIntent
      );
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
      orgRole: user.orgRole,
      employerId: user.employerId || employer?.id,
      hubId: user.hubId,
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
