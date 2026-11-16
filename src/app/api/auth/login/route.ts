import { NextRequest, NextResponse } from "next/server";
import { validateEmail } from "@/lib/validation";
import { verifyPassword } from "@/lib/password-hash";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth-session";
import {
  confirmUserEmailByAddress,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  findCandidateByEmail,
  findEmployerByEmail,
  updateUserRole,
} from "@/lib/store";
import { getSupabaseAdmin, isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { UserRole } from "@/types";
import { resolveBootstrapRole } from "@/lib/bootstrap-roles";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const normalizedEmail = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const emailCheck = validateEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json(
        { error: emailCheck.error || "Please enter a valid email address." },
        { status: 400 }
      );
    }

    let userRecord = findAuthUserByEmail(normalizedEmail);
    if (!userRecord) {
      userRecord = await findAuthUserByEmailFromDb(normalizedEmail);
    }
    if (!userRecord && isSupabaseConfigured && supabase) {
      try {
        const { data: supaRow } = await supabase
          .from("auth_users")
          .select("*")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (supaRow) {
          userRecord = {
            id: supaRow.id,
            email: supaRow.email,
            name: supaRow.name,
            role: supaRow.role,
            passwordHash: supaRow.password_hash,
            emailConfirmed: Boolean(supaRow.email_confirmed),
            createdAt: supaRow.created_at,
          };
        }
      } catch {}
    }
    let resolvedRole: UserRole | undefined = userRecord?.role;
    let resolvedName = userRecord?.name;
    let resolvedId = userRecord?.id;
    let emailConfirmed = userRecord?.emailConfirmed ?? false;
    let authenticated = false;

    // 1. Authenticate against Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data?.user) {
        authenticated = true;
        resolvedId = data.user.id;
        emailConfirmed = Boolean(data.user.email_confirmed_at);
        const metaRole = data.user.app_metadata?.role as UserRole | undefined;

        const adminClient = getSupabaseAdmin();
        if (adminClient) {
          const { data: adminUser } = await adminClient.auth.admin.getUserById(
            data.user.id
          );
          if (adminUser?.user?.app_metadata?.role) {
            resolvedRole = adminUser.user.app_metadata.role as UserRole;
          }
        }
        if (!resolvedRole && metaRole) {
          resolvedRole = metaRole;
        }
        resolvedName =
          resolvedName ||
          (data.user.user_metadata?.full_name as string) ||
          normalizedEmail.split("@")[0];

        if (emailConfirmed && userRecord && !userRecord.emailConfirmed) {
          userRecord = confirmUserEmailByAddress(normalizedEmail);
        }
      } else if (
        error &&
        error.message.toLowerCase().includes("email not confirmed")
      ) {
        return NextResponse.json(
          {
            error:
              "Please confirm your email address before signing in. Check your inbox for the verification link.",
            code: "EMAIL_NOT_CONFIRMED",
          },
          { status: 403 }
        );
      }
    }

    // 2. Authenticate against backend password hash (scrypt)
    if (!authenticated && userRecord) {
      if (!verifyPassword(password, userRecord.passwordHash)) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
      authenticated = true;
      emailConfirmed = userRecord.emailConfirmed;
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!emailConfirmed) {
      const confirmationPath = userRecord?.confirmationToken
        ? `/auth/callback?token=${encodeURIComponent(
            userRecord.confirmationToken
          )}&email=${encodeURIComponent(normalizedEmail)}`
        : undefined;

      return NextResponse.json(
        {
          error:
            "Please confirm your email address before signing in.",
          code: "EMAIL_NOT_CONFIRMED",
          confirmationPath: !isSupabaseConfigured ? confirmationPath : undefined,
        },
        { status: 403 }
      );
    }

    const baseRole: UserRole = resolvedRole || userRecord?.role || "candidate";
    const finalRole: UserRole = resolveBootstrapRole(normalizedEmail, baseRole);

    if (userRecord && userRecord.role !== finalRole) {
      updateUserRole(normalizedEmail, finalRole);
    }
    let candidate = findCandidateByEmail(normalizedEmail);
    if (!candidate && isSupabaseConfigured && supabase) {
      try {
        const { data: supaCand } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (supaCand) {
          candidate = {
            id: supaCand.id || `cand-${supaCand.user_id}`,
            profile: {
              fullName: supaCand.full_name,
              email: supaCand.email,
              phone: supaCand.phone || "",
              city: supaCand.city || "Harare",
              highestQualification: supaCand.highest_qualification || "Bachelors Degree",
              fieldOfStudy: supaCand.field_of_study || "Information Technology",
              yearsExperience: Number(supaCand.years_experience) || 0,
              employmentStatus: supaCand.employment_status || "Unemployed",
              monthlyIncomeBracket: supaCand.monthly_income_bracket || "$0 (Zero Income)",
              hasDedicatedLaptop: Boolean(supaCand.has_dedicated_laptop),
              primaryDevice: supaCand.primary_device || "Smartphone Only",
              internetAccessType: supaCand.internet_access_type || "Mobile Data Bundles Only",
              powerReliabilityHours: Number(supaCand.power_reliability_hours) || 6,
              hasGlobalPaymentRail: Boolean(supaCand.has_global_payment_rail),
              primaryGoal: supaCand.primary_goal || "International Remote Work",
              currentSkills: supaCand.field_of_study ? [supaCand.field_of_study] : [],
            },
            assessment: {
              domainCompetencyScore: 78,
              digitalReadinessScore: 72,
              remoteWorkLiteracyScore: 75,
              infrastructureIndexScore: supaCand.has_dedicated_laptop ? 80 : 45,
              overallScore: 72,
              readinessTier: supaCand.has_dedicated_laptop
                ? "Market-Ready (Direct Placement)"
                : "Bridge-Ready (Hub + Rapid Upskilling)",
              strengths: [],
              criticalGaps: [],
            },
            pathway: {
              recommendedTrack: supaCand.primary_goal || "International Remote Work",
              executiveDiagnosis: `${supaCand.full_name} is registered for remote pathways.`,
              infrastructureBridgePlan: "Pairing with partner innovation hubs.",
              recommendedHub: {
                id: "hub-1",
                name: "B2C Coworking Space",
                city: "Harare",
                address: "Harare",
                hasSolarBackup: true,
                internetProvider: "Starlink",
                avgSpeedMbps: 120,
                availableWorkstations: 20,
                laptopLoanAvailable: true,
                dailyPassUsd: 0,
                utarePartnerSubsidized: true,
                operatingHours: "08:00 - 18:00",
              },
              assignedCoach: {
                id: "coach-1",
                name: "Tatenda Chigumba",
                specialty: "Remote Work Logistics",
                availability: "Next week",
                bio: "Coach",
              },
              coachingAgenda: [],
              upskillingMilestones: [],
              targetRemoteRoles: [],
              paymentRailGuidance: "",
              tailoredResumeSummary: "",
              generatedBy: "utare-deterministic-engine",
            },
            completedMilestones: [],
            coachingStatus: "Pending Booking",
            createdAt: supaCand.created_at || new Date().toISOString(),
          };
        }
      } catch {}
    }
    const employer = findEmployerByEmail(normalizedEmail);

    const sessionUser = {
      sub: resolvedId || userRecord?.id || `usr-${Date.now()}`,
      email: normalizedEmail,
      name:
        resolvedName ||
        candidate?.profile.fullName ||
        employer?.contactPerson ||
        normalizedEmail.split("@")[0],
      role: finalRole,
      emailConfirmed: true,
      companyName: userRecord?.companyName || employer?.companyName,
      city: userRecord?.city || candidate?.profile.city,
      qualification:
        userRecord?.qualification || candidate?.profile.highestQualification,
      fieldOfStudy:
        userRecord?.fieldOfStudy || candidate?.profile.fieldOfStudy,
    };

    const token = await signSessionToken(sessionUser);

    const res = NextResponse.json({
      success: true,
      user: {
        id: sessionUser.sub,
        email: sessionUser.email,
        name: sessionUser.name,
        role: sessionUser.role,
        emailConfirmed: true,
        companyName: sessionUser.companyName,
        city: sessionUser.city,
        qualification: sessionUser.qualification,
        fieldOfStudy: sessionUser.fieldOfStudy,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("[API /api/auth/login POST Error]:", error);
    return NextResponse.json(
      { error: "Authentication failed." },
      { status: 500 }
    );
  }
}
