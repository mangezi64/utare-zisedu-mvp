import { NextRequest, NextResponse } from "next/server";
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  findEmployerByEmail,
  getEmployerJobs,
  getEmployerRegistrations,
  saveEmployerRegistration,
  updateEmployerVerificationStatus,
} from "@/lib/store";
import {
  adminUnauthorizedResponse,
  getSessionFromRequest,
  isAdminRequest,
} from "@/lib/auth-guard";
import { validateEmail, validatePassword } from "@/lib/validation";
import { checkEmailDomain } from "@/lib/email-domain-check";
import { generateRandomToken, hashPassword } from "@/lib/password-hash";
import {
  getSupabaseAdmin,
  getSupabaseServer,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase/client";
import { isValidUuid, safeSupabaseUpsert } from "@/lib/supabase/safe-write";
import { EmployerVerificationStatus } from "@/types";

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

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const isAdmin =
    session?.role === "admin" || session?.role === "superuser";
  const isCandidate = session?.role === "candidate";
  const wantsDirectory = req.nextUrl.searchParams.get("directory") === "1";

  if (!isAdmin && !(isCandidate && wantsDirectory)) {
    return adminUnauthorizedResponse();
  }

  const employers = [...getEmployerRegistrations()];
  const existingEmails = new Set(employers.map((e) => e.email.trim().toLowerCase()));

  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data: dbEmployers, error } = await sb
        .from("employer_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && dbEmployers && dbEmployers.length > 0) {
        for (const emp of dbEmployers) {
          const emailNorm = (emp.email || "").trim().toLowerCase();
          if (emailNorm && !existingEmails.has(emailNorm)) {
            existingEmails.add(emailNorm);
            employers.unshift({
              id: emp.id,
              userId: emp.user_id,
              companyName: emp.company_name,
              contactPerson: emp.contact_person,
              email: emp.email,
              website: emp.website || "",
              careerPageUrl: emp.career_page_url || undefined,
              industry: emp.industry || "Technology & SaaS",
              rolesInterested: Array.isArray(emp.roles_interested)
                ? emp.roles_interested
                : [String(emp.roles_interested || "Remote Operations")],
              hiringModel: emp.hiring_model || "100% Remote Contract",
              estimatedHires: Number(emp.estimated_hires) || 1,
              timezoneOverlapNeeded:
                emp.timezone_overlap_needed || "CAT (GMT+2) / UK-EU overlap",
              additionalNotes: emp.additional_notes || "",
              verificationStatus:
                (emp.verification_status as EmployerVerificationStatus) || "pending",
              createdAt: emp.created_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Employers Supabase Fetch Warning]:", err);
    }
  }

  if (isCandidate && !isAdmin) {
    const verifiedPublicEmployers = employers
      .filter((emp) => emp.verificationStatus === "verified")
      .map((emp) => {
        const activeJobsCount = getEmployerJobs({
          id: emp.id,
          email: emp.email,
          companyName: emp.companyName,
        }).filter((j) => j.status === "approved").length;

        return {
          id: emp.id,
          companyName: emp.companyName,
          website: emp.website,
          careerPageUrl: emp.careerPageUrl,
          sharedDocuments: emp.sharedDocuments,
          industry: emp.industry,
          rolesInterested: emp.rolesInterested,
          hiringModel: emp.hiringModel,
          estimatedHires: emp.estimatedHires,
          timezoneOverlapNeeded: emp.timezoneOverlapNeeded,
          verificationStatus: emp.verificationStatus,
          verifiedAt: emp.verifiedAt,
          createdAt: emp.createdAt,
          activeJobsCount,
        };
      });

    return NextResponse.json({
      total: verifiedPublicEmployers.length,
      employers: verifiedPublicEmployers,
    });
  }

  return NextResponse.json({ total: employers.length, employers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      email,
      password,
      website,
      industry,
      rolesInterested,
      hiringModel,
      estimatedHires,
      timezoneOverlapNeeded,
      additionalNotes,
    } = body;

    if (!companyName || !contactPerson || !email) {
      return NextResponse.json(
        {
          error:
            "Company name, contact person, and work email are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailCheck = validateEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    if ((await checkEmailDomain(normalizedEmail)) === "undeliverable") {
      return NextResponse.json(
        {
          error:
            "This email domain doesn't exist or can't receive mail. Please use a valid work email address.",
        },
        { status: 400 }
      );
    }

    if (password) {
      const pwCheck = validatePassword(String(password));
      if (!pwCheck.isValid) {
        return NextResponse.json(
          { error: pwCheck.error || "Please choose a stronger password." },
          { status: 400 }
        );
      }
      if (
        findAuthUserByEmail(normalizedEmail) ||
        (await findAuthUserByEmailFromDb(normalizedEmail))
      ) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in to your Employer Portal.",
          },
          { status: 409 }
        );
      }
    }

    const existingEmployer = findEmployerByEmail(normalizedEmail);
    if (existingEmployer) {
      const session = await getSessionFromRequest(req);
      const isOwnerOrAdmin =
        session &&
        (session.role === "admin" ||
          session.role === "superuser" ||
          session.email.toLowerCase() === normalizedEmail);
      if (!isOwnerOrAdmin) {
        return NextResponse.json(
          {
            error:
              "An employer registration with this email already exists. Please sign in to update your organization.",
          },
          { status: 409 }
        );
      }
    }

    let supabaseUserId: string | undefined;
    let isAutoConfirmed = false;

    if (password && isSupabaseConfigured && supabase) {
      const origin = resolveOrigin(req);
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: String(password),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: String(contactPerson).trim(),
            account_type: "employer",
            company_name: String(companyName).trim(),
          },
        },
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          (error as { status?: number }).status === 429;
        const adminClient = getSupabaseAdmin();

        if (isRateLimit && adminClient) {
          const { data: adminData, error: adminErr } =
            await adminClient.auth.admin.createUser({
              email: normalizedEmail,
              password: String(password),
              email_confirm: true,
              user_metadata: {
                full_name: String(contactPerson).trim(),
                account_type: "employer",
                company_name: String(companyName).trim(),
              },
              app_metadata: {
                role: "employer",
                org_role: "org_admin",
              },
            });

          if (!adminErr && adminData?.user) {
            supabaseUserId = adminData.user.id;
            isAutoConfirmed = true;
          } else {
            return NextResponse.json(
              {
                error:
                  "Email rate limit exceeded while creating your employer account. Please wait a few minutes and try again.",
              },
              { status: 429 }
            );
          }
        } else if (isRateLimit) {
          return NextResponse.json(
            {
              error:
                "Email sending rate limit reached. Please wait a few minutes and try again.",
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
                "An account with this email already exists. Please sign in to your Employer Portal.",
            },
            { status: 409 }
          );
        }

        supabaseUserId = data.user?.id;
        if (data.session || data.user?.email_confirmed_at) {
          isAutoConfirmed = true;
        }

        const adminClient = getSupabaseAdmin();
        if (adminClient && supabaseUserId) {
          await adminClient.auth.admin.updateUserById(supabaseUserId, {
            app_metadata: {
              role: "employer",
              org_role: "org_admin",
            },
          });
        }
      }
    }

    const record = saveEmployerRegistration({
      userId: supabaseUserId,
      companyName: String(companyName).trim(),
      contactPerson: String(contactPerson).trim(),
      email: normalizedEmail,
      website: website ? String(website).trim() : "",
      industry: industry ? String(industry).trim() : "Technology & SaaS",
      rolesInterested: Array.isArray(rolesInterested)
        ? rolesInterested
        : typeof rolesInterested === "string"
        ? rolesInterested
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["Remote Operations"],
      hiringModel: hiringModel || "100% Remote Contract",
      estimatedHires: Number(estimatedHires) || 1,
      timezoneOverlapNeeded:
        timezoneOverlapNeeded || "CAT (GMT+2) / UK-EU overlap",
      additionalNotes: additionalNotes ? String(additionalNotes).trim() : "",
      verificationStatus: "pending",
    });

    const sb = getSupabaseServer();
    if (sb) {
      await safeSupabaseUpsert(
        sb,
        "employer_registrations",
        {
          ...(isValidUuid(record.id) ? { id: record.id } : {}),
          user_id: supabaseUserId || null,
          company_name: record.companyName,
          contact_person: record.contactPerson,
          email: record.email,
          website: record.website,
          industry: record.industry,
          roles_interested: record.rolesInterested,
          hiring_model: record.hiringModel,
          estimated_hires: record.estimatedHires,
          timezone_overlap_needed: record.timezoneOverlapNeeded,
          additional_notes: record.additionalNotes,
          verification_status: record.verificationStatus,
          updated_at: new Date().toISOString(),
        },
        "email"
      );
    }

    let confirmationPath: string | undefined;
    if (password) {
      const confirmationToken = generateRandomToken(24);
      const passwordHash = hashPassword(String(password));
      const authUser = createAuthUser({
        id: supabaseUserId,
        email: normalizedEmail,
        name: String(contactPerson).trim(),
        role: "employer",
        passwordHash,
        emailConfirmed: isAutoConfirmed,
        confirmationToken,
        employerId: record.id,
        orgRole: "org_admin",
        companyName: record.companyName,
      });
      if (sb) {
        await safeSupabaseUpsert(
          sb,
          "auth_users",
          {
            id: supabaseUserId || authUser.id,
            email: normalizedEmail,
            name: authUser.name,
            role: "employer",
            password_hash: passwordHash,
            email_confirmed: isAutoConfirmed,
            confirmation_token: confirmationToken,
            employer_id: record.id,
            org_role: "org_admin",
            company_name: record.companyName,
            last_active_at: authUser.lastActiveAt || new Date().toISOString(),
          },
          "email"
        );
      }
      if (!isSupabaseConfigured || isAutoConfirmed) {
        confirmationPath = `/auth/callback?token=${encodeURIComponent(
          confirmationToken
        )}&email=${encodeURIComponent(normalizedEmail)}`;
      }
    }

    const requiresEmailConfirmation = Boolean(password && !isAutoConfirmed);

    return NextResponse.json({
      success: true,
      registration: record,
      email: normalizedEmail,
      requiresEmailConfirmation,
      confirmationPath,
      message: password
        ? isAutoConfirmed
          ? `Employer account created for ${record.companyName}! You can sign in to your Employer Portal immediately.`
          : `Employer account created for ${record.companyName}! Please check your inbox (and Spam/Junk folder) to confirm your email and open your Employer Portal.`
        : `Thank you! ${record.companyName}'s hiring inquiry has been registered.`,
    });
  } catch (error) {
    console.error("[API /api/employers POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to save employer registration." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }

  try {
    const body = await req.json();
    const { employerId, verificationStatus } = body;
    const allowed: EmployerVerificationStatus[] = [
      "pending",
      "verified",
      "rejected",
    ];
    if (!employerId || !allowed.includes(verificationStatus)) {
      return NextResponse.json(
        { error: "Valid employerId and verificationStatus are required." },
        { status: 400 }
      );
    }

    const updated = updateEmployerVerificationStatus(
      String(employerId),
      verificationStatus as EmployerVerificationStatus
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Employer registration not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employer: updated,
    });
  } catch (error) {
    console.error("[API /api/employers PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update employer verification status." },
      { status: 500 }
    );
  }
}
