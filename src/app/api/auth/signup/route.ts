import { NextRequest, NextResponse } from "next/server";
import { validateEmail, validatePassword } from "@/lib/validation";
import { checkEmailDomain } from "@/lib/email-domain-check";
import { generateRandomToken, hashPassword } from "@/lib/password-hash";
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  registerOrUpdateCandidate,
  saveEmployerRegistration,
} from "@/lib/store";
import { getSupabaseAdmin, getSupabaseServer, isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { resolveBootstrapRole } from "@/lib/bootstrap-roles";
import { CandidateProfile } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accountType: "candidate" | "employer" =
      body.accountType === "employer" ? "employer" : "candidate";

    const fullName = String(body.fullName || body.contactPerson || "").trim();
    const normalizedEmail = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!fullName || !normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Full name, email address, and password are required." },
        { status: 400 }
      );
    }

    // 1. Validate email format + disposable domain list
    const emailCheck = validateEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    // 2. Verify domain MX records (catches made-up domains)
    if ((await checkEmailDomain(normalizedEmail)) === "undeliverable") {
      return NextResponse.json(
        {
          error:
            "This email domain doesn't exist or can't receive mail. Please use a real email address.",
        },
        { status: 400 }
      );
    }

    // 3. Enforce strong password
    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      return NextResponse.json(
        { error: pwCheck.error || "Please choose a stronger password." },
        { status: 400 }
      );
    }

    // 4. Reject duplicate accounts (local store + live database)
    if (
      findAuthUserByEmail(normalizedEmail) ||
      (await findAuthUserByEmailFromDb(normalizedEmail))
    ) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    const companyName =
      accountType === "employer"
        ? String(body.companyName || "").trim()
        : undefined;
    if (accountType === "employer" && !companyName) {
      return NextResponse.json(
        { error: "Company name is required for employer enrolment." },
        { status: 400 }
      );
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
    const derivedHostOrigin = host ? `${proto}://${host}` : undefined;

    const origin =
      req.headers.get("origin") ||
      derivedHostOrigin ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    let supabaseUserId: string | undefined;
    let isAutoConfirmed = false;

    // 5. Register with Supabase Auth when cloud credentials are configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: fullName,
            account_type: accountType,
            company_name: companyName,
          },
        },
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          (error as { status?: number }).status === 429;
        const adminClient = getSupabaseAdmin();

        // Fallback: If Supabase's default mailer reached its 3 emails/hour limit,
        // use the Service Role Admin API to provision and confirm the user directly.
        if (isRateLimit && adminClient) {
          const { data: adminData, error: adminErr } =
            await adminClient.auth.admin.createUser({
              email: normalizedEmail,
              password,
              email_confirm: true,
              user_metadata: {
                full_name: fullName,
                account_type: accountType,
                company_name: companyName,
              },
              app_metadata: {
                role: accountType,
                ...(accountType === "employer"
                  ? { org_role: "org_admin" }
                  : {}),
              },
            });

          if (!adminErr && adminData?.user) {
            supabaseUserId = adminData.user.id;
            isAutoConfirmed = true;
          } else {
            return NextResponse.json(
              {
                error:
                  "Supabase email rate limit exceeded (free tier default is 3-4 emails/hr). Please disable 'Confirm email' in Supabase Dashboard (Authentication > Providers > Email), or configure Custom SMTP (e.g. Resend).",
              },
              { status: 429 }
            );
          }
        } else if (isRateLimit) {
          return NextResponse.json(
            {
              error:
                "Supabase email rate limit exceeded (free tier default is 3-4 emails/hr). Please disable 'Confirm email' in Supabase Dashboard (Authentication > Providers > Email), configure Custom SMTP, or add SUPABASE_SERVICE_ROLE_KEY to environment variables.",
            },
            { status: 429 }
          );
        } else {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      } else {
        if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                "An account with this email already exists. Please sign in instead.",
            },
            { status: 409 }
          );
        }

        supabaseUserId = data.user?.id;
        if (data.session || data.user?.email_confirmed_at) {
          isAutoConfirmed = true;
        }

        // Stamp authoritative role in app_metadata via Service Role client if available
        const adminClient = getSupabaseAdmin();
        if (adminClient && supabaseUserId) {
          await adminClient.auth.admin.updateUserById(supabaseUserId, {
            app_metadata: {
              role: accountType,
              ...(accountType === "employer" ? { org_role: "org_admin" } : {}),
            },
          });
        }
      }
    }

    const confirmationToken = generateRandomToken(24);
    const passwordHash = hashPassword(password);

    // 6. Create employer or candidate domain record
    let employerId: string | undefined;
    if (accountType === "employer" && companyName) {
      const rolesInterested = Array.isArray(body.rolesInterested)
        ? body.rolesInterested
        : String(body.rolesInterested || "Remote Operations, Tech & Data")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

      const empRecord = saveEmployerRegistration({
        userId: supabaseUserId,
        companyName,
        contactPerson: fullName,
        email: normalizedEmail,
        website: String(body.website || "").trim(),
        industry: String(body.industry || "Technology & SaaS").trim(),
        rolesInterested,
        hiringModel: String(body.hiringModel || "100% Remote Contract"),
        estimatedHires: Number(body.estimatedHires) || 1,
        timezoneOverlapNeeded: String(
          body.timezoneOverlapNeeded || "CAT (GMT+2) / UK-EU overlap"
        ),
        additionalNotes: String(body.additionalNotes || "").trim(),
        verificationStatus: "pending",
      });
      employerId = empRecord.id;
    } else {
      const city = String(body.city || "Harare");
      const highestQualification = String(
        body.qualification || body.highestQualification || "Bachelors Degree"
      ) as CandidateProfile["highestQualification"];
      const fieldOfStudy = String(
        body.fieldOfStudy || "Computer Science & IT"
      ).trim();

      registerOrUpdateCandidate({
        fullName,
        email: normalizedEmail,
        phone: String(body.phone || ""),
        city,
        highestQualification,
        fieldOfStudy,
        yearsExperience: Number(body.yearsExperience) || 0,
        employmentStatus: "Unemployed",
        monthlyIncomeBracket: "$0 (Zero Income)",
        hasDedicatedLaptop: false,
        primaryDevice: "Smartphone Only",
        internetAccessType: "Mobile Data Bundles Only",
        powerReliabilityHours: 6,
        hasGlobalPaymentRail: false,
        primaryGoal: "International Remote Work",
        currentSkills: fieldOfStudy ? [fieldOfStudy] : [],
      });

      // Sync candidate profile to live Supabase Postgres
      const sb = getSupabaseServer();
      if (sb) {
        try {
          await sb.from("candidate_profiles").upsert(
            {
              user_id: supabaseUserId,
              full_name: fullName,
              email: normalizedEmail,
              phone: String(body.phone || ""),
              city,
              highest_qualification: highestQualification,
              field_of_study: fieldOfStudy,
              years_experience: Number(body.yearsExperience) || 0,
              employment_status: "Unemployed",
              monthly_income_bracket: "$0 (Zero Income)",
              has_dedicated_laptop: false,
              primary_device: "Smartphone Only",
              internet_access_type: "Mobile Data Bundles Only",
              power_reliability_hours: 6,
              has_global_payment_rail: false,
              primary_goal: "International Remote Work",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );
        } catch {}
      }
    }

    // 7. Persist AuthUser with hashed password and confirmation token
    const assignedRole = resolveBootstrapRole(normalizedEmail, accountType);
    const authUser = createAuthUser({
      id: supabaseUserId,
      email: normalizedEmail,
      name: fullName,
      role: assignedRole,
      passwordHash,
      emailConfirmed: isAutoConfirmed,
      confirmationToken,
      employerId,
      orgRole: accountType === "employer" ? "org_admin" : undefined,
      companyName,
      city: body.city,
      qualification: body.qualification,
      fieldOfStudy: body.fieldOfStudy,
    });

    // Sync auth user to live Supabase Postgres auth_users table
    const sbAuth = getSupabaseServer();
    if (sbAuth) {
      try {
        await sbAuth.from("auth_users").upsert(
          {
            id: supabaseUserId || authUser.id,
            email: normalizedEmail,
            name: fullName,
            role: assignedRole,
            password_hash: passwordHash,
            email_confirmed: isAutoConfirmed,
            confirmation_token: confirmationToken,
            employer_id: employerId || null,
            org_role: accountType === "employer" ? "org_admin" : null,
            company_name: companyName || null,
          },
          { onConflict: "email" }
        );
      } catch {}
    }

    const confirmationPath = `/auth/callback?token=${encodeURIComponent(
      confirmationToken
    )}&email=${encodeURIComponent(normalizedEmail)}`;

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: !isAutoConfirmed,
      email: authUser.email,
      role: authUser.role,
      // When Supabase cloud SMTP is not configured or bypassed, expose confirmation link / auto-confirm
      confirmationPath: !isSupabaseConfigured || isAutoConfirmed ? confirmationPath : undefined,
      message: isAutoConfirmed
        ? accountType === "employer"
          ? "Employer account created successfully! You can sign in immediately."
          : "Candidate account created successfully! You can sign in immediately."
        : accountType === "employer"
        ? "Employer account created! Please confirm your email address to access your Employer Portal."
        : "Candidate account created! Please confirm your email address before signing in.",
    });
  } catch (error) {
    console.error("[API /api/auth/signup POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 }
    );
  }
}
