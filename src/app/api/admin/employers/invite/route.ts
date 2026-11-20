import { NextRequest, NextResponse } from "next/server";
import {
  adminUnauthorizedResponse,
  getSessionFromRequest,
  isAdminRequest,
} from "@/lib/auth-guard";
import { generateRandomToken } from "@/lib/password-hash";
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  findEmployerByEmailAsync,
  saveEmployerRegistration,
  setUserResetToken,
  updateOrgMemberAccess,
} from "@/lib/store";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/client";
import { isValidUuid, safeSupabaseUpsert } from "@/lib/supabase/safe-write";
import { validateEmail } from "@/lib/validation";
import { OrgRole } from "@/types";

export const runtime = "nodejs";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }

  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const companyName = String(body.companyName || "").trim();
    const contactPerson = String(body.contactPerson || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const industry = String(body.industry || "Technology & SaaS").trim();
    const hiringModel = String(
      body.hiringModel || "100% Remote Contract"
    ).trim();
    const autoVerify = body.autoVerify !== false;

    const rawOrgRole = body.orgRole;
    let orgRole: OrgRole = "org_admin";
    if (rawOrgRole !== undefined && rawOrgRole !== null && rawOrgRole !== "") {
      if (rawOrgRole !== "org_admin" && rawOrgRole !== "org_member") {
        return NextResponse.json(
          { error: 'Invalid orgRole. Must be "org_admin" or "org_member".' },
          { status: 400 }
        );
      }
      orgRole = rawOrgRole;
    }

    if (!companyName || !contactPerson || !email) {
      return NextResponse.json(
        {
          error:
            "Company name, contact person, and email address are required.",
        },
        { status: 400 }
      );
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      return NextResponse.json(
        { error: emailCheck.error || "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const existingEmployer = await findEmployerByEmailAsync(email);
    const employer = saveEmployerRegistration({
      id: existingEmployer?.id,
      userId: existingEmployer?.userId,
      companyName,
      contactPerson,
      email,
      website: existingEmployer?.website || "",
      industry: industry || existingEmployer?.industry || "Technology & SaaS",
      rolesInterested:
        existingEmployer?.rolesInterested &&
        existingEmployer.rolesInterested.length > 0
          ? existingEmployer.rolesInterested
          : ["Remote Operations, Tech & Data"],
      hiringModel:
        hiringModel || existingEmployer?.hiringModel || "100% Remote Contract",
      estimatedHires: existingEmployer?.estimatedHires || 1,
      timezoneOverlapNeeded:
        existingEmployer?.timezoneOverlapNeeded || "CAT (GMT+2) / UK-EU overlap",
      additionalNotes: existingEmployer?.additionalNotes || "",
      verificationStatus: autoVerify
        ? "verified"
        : existingEmployer?.verificationStatus || "pending",
    });

    const sb = getSupabaseServer();
    if (sb) {
      await safeSupabaseUpsert(
        sb,
        "employer_registrations",
        {
          ...(isValidUuid(employer.id) ? { id: employer.id } : {}),
          user_id: employer.userId || null,
          company_name: employer.companyName,
          contact_person: employer.contactPerson,
          email: employer.email,
          website: employer.website || "",
          industry: employer.industry || "Technology & SaaS",
          roles_interested: employer.rolesInterested,
          hiring_model: employer.hiringModel,
          estimated_hires: employer.estimatedHires,
          timezone_overlap_needed: employer.timezoneOverlapNeeded,
          additional_notes: employer.additionalNotes || "",
          verification_status: employer.verificationStatus,
          updated_at: new Date().toISOString(),
        },
        "email"
      );
    }

    const invitedBy = session?.email || "admin";
    const invitedAt = new Date().toISOString();

    let authUser =
      findAuthUserByEmail(email) || (await findAuthUserByEmailFromDb(email));

    if (authUser) {
      authUser =
        updateOrgMemberAccess(email, {
          role: "employer",
          orgRole,
          employerId: employer.id,
          companyName: employer.companyName,
          invitedBy,
          invitedAt,
          isActive: true,
        }) || authUser;
    } else {
      authUser = createAuthUser({
        email,
        name: contactPerson,
        role: "employer",
        orgRole,
        employerId: employer.id,
        companyName: employer.companyName,
        passwordHash: "pending_invite",
        emailConfirmed: false,
        invitedBy,
        invitedAt,
        isActive: true,
      });
    }

    const token = generateRandomToken(24);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
    await setUserResetToken(authUser.email, token, expiresAt);

    const origin = req.nextUrl.origin;
    const inviteUrl = `${origin}/auth/callback?reset_token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}&type=invite`;

    let emailSent = false;
    const adminClient = getSupabaseAdmin();
    if (adminClient) {
      try {
        const { data: inviteData, error: inviteErr } =
          await adminClient.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${origin}/auth/callback`,
            data: {
              full_name: contactPerson,
              account_type: "employer",
              company_name: employer.companyName,
            },
          });

        if (!inviteErr && inviteData?.user) {
          emailSent = true;
          try {
            await adminClient.auth.admin.updateUserById(inviteData.user.id, {
              app_metadata: {
                ...(inviteData.user.app_metadata || {}),
                role: "employer",
                org_role: orgRole,
                employer_id: employer.id,
              },
            });
          } catch {}
        } else {
          // User may already exist in Supabase Auth; try generating an invite/recovery link
          await adminClient.auth.admin.generateLink({
            type: "invite",
            email,
            options: {
              redirectTo: `${origin}/auth/callback`,
            },
          });
        }
      } catch (err) {
        console.warn("[Admin Employer Invite Supabase Warning]:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      employer,
      inviteUrl,
      emailSent,
      expiresAt,
    });
  } catch (error) {
    console.error("[API /api/admin/employers/invite POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to invite employer." },
      { status: 500 }
    );
  }
}
