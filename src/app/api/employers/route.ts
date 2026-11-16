import { NextRequest, NextResponse } from "next/server";
import {
  createAuthUser,
  findAuthUserByEmail,
  getEmployerRegistrations,
  saveEmployerRegistration,
  updateEmployerVerificationStatus,
} from "@/lib/store";
import { isAdminRequest, adminUnauthorizedResponse } from "@/lib/auth-guard";
import { validateEmail, validatePassword } from "@/lib/validation";
import { checkEmailDomain } from "@/lib/email-domain-check";
import { generateRandomToken, hashPassword } from "@/lib/password-hash";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { EmployerRegistration, EmployerVerificationStatus } from "@/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }

  const employers = [...getEmployerRegistrations()];
  const existingEmails = new Set(employers.map((e) => e.email.trim().toLowerCase()));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbEmployers, error } = await supabase
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
      if (findAuthUserByEmail(normalizedEmail)) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in to your Employer Portal.",
          },
          { status: 409 }
        );
      }
    }

    const record = saveEmployerRegistration({
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

    let confirmationPath: string | undefined;
    if (password) {
      const confirmationToken = generateRandomToken(24);
      createAuthUser({
        email: normalizedEmail,
        name: String(contactPerson).trim(),
        role: "employer",
        passwordHash: hashPassword(String(password)),
        emailConfirmed: false,
        confirmationToken,
        employerId: record.id,
        orgRole: "org_admin",
        companyName: record.companyName,
      });
      if (!isSupabaseConfigured) {
        confirmationPath = `/auth/callback?token=${encodeURIComponent(
          confirmationToken
        )}&email=${encodeURIComponent(normalizedEmail)}`;
      }
    }

    return NextResponse.json({
      success: true,
      registration: record,
      confirmationPath,
      message: password
        ? `Employer account created for ${record.companyName}! Confirm your email to open your Employer Portal and post roles.`
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
