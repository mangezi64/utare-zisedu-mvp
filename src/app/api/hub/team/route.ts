import { NextRequest, NextResponse } from "next/server";
import { requireRoles, unauthorizedResponse } from "@/lib/auth-guard";
import { SessionPayload } from "@/lib/auth-session";
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  findHubById,
  findHubByOwnerEmail,
  listOrgMembers,
  recordAuditLog,
  setUserResetToken,
  updateOrgMemberAccess,
} from "@/lib/store";
import { validateEmail } from "@/lib/validation";
import { generateRandomToken, hashPassword } from "@/lib/password-hash";
import {
  getSupabaseAdmin,
  getSupabaseServer,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { isValidUuid, safeSupabaseUpsert } from "@/lib/supabase/safe-write";
import { OrgRole } from "@/types";

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

function isHubOrgAdminSession(session: SessionPayload): boolean {
  if (session.role === "admin" || session.role === "superuser") return true;
  if (session.role !== "hub") return false;
  return (session.orgRole || "org_admin") === "org_admin";
}

function resolveHubContext(
  session: SessionPayload,
  requestedHubId?: string | null
) {
  const isPlatformAdmin =
    session.role === "admin" || session.role === "superuser";
  if (isPlatformAdmin && requestedHubId) {
    const hub = findHubById(requestedHubId);
    return {
      hubId: hub?.id || requestedHubId,
      hub,
    };
  }
  const hub =
    (session.hubId ? findHubById(session.hubId) : null) ||
    findHubByOwnerEmail(session.email);

  return {
    hubId: hub?.id || session.hubId || null,
    hub,
  };
}

async function syncSupabaseHubMetadata(
  userId: string,
  email: string,
  appMetadata: Record<string, unknown>
) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) return;
  try {
    let targetId = isValidUuid(userId) ? userId : undefined;
    if (!targetId) {
      const { data } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const match = data?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      targetId = match?.id;
    }
    if (targetId) {
      await adminClient.auth.admin.updateUserById(targetId, {
        app_metadata: appMetadata,
      });
    }
  } catch (err) {
    console.warn("[Hub Team Supabase Metadata Sync Warning]:", err);
  }
}

export async function GET(req: NextRequest) {
  const session = await requireRoles(req, ["hub", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Hub Partner authentication required.");
  }
  if (!isHubOrgAdminSession(session)) {
    return NextResponse.json(
      { error: "Hub Admin privileges required to view team members." },
      { status: 403 }
    );
  }

  const requestedHubId = req.nextUrl.searchParams.get("hubId");
  const { hubId } = resolveHubContext(session, requestedHubId);
  if (!hubId) {
    return NextResponse.json(
      { error: "No Innovation Hub is linked to your account." },
      { status: 404 }
    );
  }

  const members = listOrgMembers({ hubId }).filter(
    (m) => m.isActive !== false
  );
  return NextResponse.json({
    hubId,
    total: members.length,
    members,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireRoles(req, ["hub", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Hub Partner authentication required.");
  }
  if (!isHubOrgAdminSession(session)) {
    return NextResponse.json(
      { error: "Hub Admin privileges required to invite staff members." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { hubId, hub } = resolveHubContext(
      session,
      body.hubId ? String(body.hubId) : null
    );
    if (!hubId) {
      return NextResponse.json(
        { error: "No Innovation Hub is linked to your account." },
        { status: 404 }
      );
    }

    const origin = resolveOrigin(req);

    // Action: generate one-time reset link for an existing hub staff member
    if (body.action === "reset_link") {
      const targetKey = String(body.email || body.userId || "")
        .trim()
        .toLowerCase();
      if (!targetKey) {
        return NextResponse.json(
          { error: "Member email or userId is required." },
          { status: 400 }
        );
      }

      const orgMembers = listOrgMembers({ hubId });
      const member = orgMembers.find(
        (m) =>
          m.id === body.userId || m.email.trim().toLowerCase() === targetKey
      );
      if (!member) {
        return NextResponse.json(
          { error: "Team member not found in your Innovation Hub." },
          { status: 404 }
        );
      }

      const token = generateRandomToken(24);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await setUserResetToken(member.email, token, expiresAt);

      const adminClient = getSupabaseAdmin();
      if (isSupabaseConfigured && adminClient) {
        try {
          await adminClient.auth.admin.generateLink({
            type: "recovery",
            email: member.email,
            options: {
              redirectTo: `${origin}/auth/callback?type=recovery`,
            },
          });
        } catch (err) {
          console.warn("[Hub Team Reset Link Supabase Warning]:", err);
        }
      }

      const resetUrl = `${origin}/auth/callback?reset_token=${encodeURIComponent(
        token
      )}&email=${encodeURIComponent(member.email)}&type=recovery`;

      recordAuditLog({
        entityType: "user",
        entityId: member.id,
        action: "hub_member_reset_link_created",
        actorEmail: session.email,
        actorRole: session.role,
        summary: `Generated one-time password reset link for ${member.email} in hub ${hubId}.`,
      });

      return NextResponse.json({
        ok: true,
        resetUrl,
        inviteUrl: resetUrl,
        expiresAt,
      });
    }

    // Invite a new hub staff member
    const fullName = String(body.fullName || body.name || "").trim();
    const rawEmail = String(body.email || "").trim().toLowerCase();
    const targetOrgRole: OrgRole =
      body.orgRole === "org_admin" ? "org_admin" : "org_member";

    if (!fullName || !rawEmail) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const emailCheck = validateEmail(rawEmail);
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    const existing =
      findAuthUserByEmail(rawEmail) ||
      (await findAuthUserByEmailFromDb(rawEmail));

    if (existing) {
      if (
        existing.role === "candidate" ||
        existing.role === "employer" ||
        existing.role === "admin" ||
        existing.role === "superuser"
      ) {
        return NextResponse.json(
          {
            error: `This email is already registered as a ${existing.role} account and cannot be added to a Hub team.`,
          },
          { status: 409 }
        );
      }
      if (existing.employerId) {
        return NextResponse.json(
          {
            error:
              "This email is already linked to an employer organization.",
          },
          { status: 409 }
        );
      }
      if (existing.hubId && existing.hubId !== hubId) {
        return NextResponse.json(
          {
            error:
              "This email already belongs to another Innovation Hub.",
          },
          { status: 409 }
        );
      }
      if (existing.hubId === hubId && existing.isActive !== false) {
        return NextResponse.json(
          {
            error: "This user is already an active member of your Hub team.",
          },
          { status: 409 }
        );
      }
    }

    const nowIso = new Date().toISOString();
    let supabaseUserId: string | undefined = existing?.id;
    let emailSent = false;

    const adminClient = getSupabaseAdmin();
    if (isSupabaseConfigured && adminClient) {
      try {
        const { data: inviteData, error: inviteErr } =
          await adminClient.auth.admin.inviteUserByEmail(rawEmail, {
            redirectTo: `${origin}/auth/callback?type=invite`,
            data: {
              full_name: fullName,
              account_type: "hub",
              company_name: hub?.orgName || hub?.name || session.companyName,
            },
          });
        if (!inviteErr && inviteData?.user) {
          supabaseUserId = inviteData.user.id;
          emailSent = true;
          await adminClient.auth.admin.updateUserById(supabaseUserId, {
            app_metadata: {
              role: "hub",
              org_role: targetOrgRole,
              hub_id: hubId,
            },
          });
        }
      } catch (err) {
        console.warn("[Hub Team Supabase Invite Warning]:", err);
      }
    }

    const authUser = createAuthUser({
      id: supabaseUserId,
      email: rawEmail,
      name: fullName,
      role: "hub",
      passwordHash:
        existing?.passwordHash || hashPassword(generateRandomToken(24)),
      emailConfirmed: existing?.emailConfirmed ?? false,
      hubId,
      orgRole: targetOrgRole,
      companyName: hub?.orgName || hub?.name || session.companyName,
      invitedBy: session.email,
      invitedAt: nowIso,
      isActive: true,
    });

    const token = generateRandomToken(24);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await setUserResetToken(rawEmail, token, expiresAt);

    const sb = getSupabaseServer();
    if (sb) {
      await safeSupabaseUpsert(
        sb,
        "auth_users",
        {
          id: supabaseUserId || authUser.id,
          email: rawEmail,
          name: fullName,
          role: "hub",
          password_hash: authUser.passwordHash,
          email_confirmed: authUser.emailConfirmed,
          hub_id: hubId,
          org_role: targetOrgRole,
          company_name: authUser.companyName || null,
          invited_by: session.email,
          invited_at: nowIso,
          reset_token: token,
          reset_token_expires_at: expiresAt,
          is_active: true,
          last_active_at: nowIso,
        },
        "email"
      );
    }

    const inviteUrl = `${origin}/auth/callback?reset_token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(rawEmail)}&type=invite`;

    recordAuditLog({
      entityType: "user",
      entityId: authUser.id,
      action: "hub_member_invited",
      actorEmail: session.email,
      actorRole: session.role,
      newValue: `${rawEmail} (${targetOrgRole})`,
      summary: `Invited ${rawEmail} as ${targetOrgRole} to hub ${hubId}.`,
    });

    const {
      passwordHash: _p,
      confirmationToken: _c,
      resetToken: _r,
      ...safeMember
    } = authUser;

    return NextResponse.json({
      ok: true,
      member: safeMember,
      inviteUrl,
      expiresAt,
      emailSent,
    });
  } catch (error) {
    console.error("[API /api/hub/team POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to invite Hub staff member." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireRoles(req, ["hub", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Hub Partner authentication required.");
  }
  if (!isHubOrgAdminSession(session)) {
    return NextResponse.json(
      { error: "Hub Admin privileges required to update team roles." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { hubId } = resolveHubContext(
      session,
      body.hubId ? String(body.hubId) : null
    );
    if (!hubId) {
      return NextResponse.json(
        { error: "No Innovation Hub is linked to your account." },
        { status: 404 }
      );
    }

    const nextOrgRole = body.orgRole as OrgRole;
    if (nextOrgRole !== "org_admin" && nextOrgRole !== "org_member") {
      return NextResponse.json(
        { error: "Valid orgRole ('org_admin' or 'org_member') is required." },
        { status: 400 }
      );
    }

    const orgMembers = listOrgMembers({ hubId }).filter(
      (m) => m.isActive !== false
    );
    const targetKey = String(body.email || body.userId || "")
      .trim()
      .toLowerCase();
    const target = orgMembers.find(
      (m) => m.id === body.userId || m.email.trim().toLowerCase() === targetKey
    );
    if (!target) {
      return NextResponse.json(
        { error: "Team member not found in your Innovation Hub." },
        { status: 404 }
      );
    }

    const currentRole: OrgRole = target.orgRole || "org_admin";
    if (currentRole === "org_admin" && nextOrgRole === "org_member") {
      const adminCount = orgMembers.filter(
        (m) => (m.orgRole || "org_admin") === "org_admin"
      ).length;
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot demote the last remaining Hub Admin. Promote another staff member first.",
          },
          { status: 400 }
        );
      }
    }

    const updated = updateOrgMemberAccess(target.id, { orgRole: nextOrgRole });
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update Hub team member." },
        { status: 500 }
      );
    }

    await syncSupabaseHubMetadata(updated.id, updated.email, {
      role: "hub",
      org_role: nextOrgRole,
      hub_id: hubId,
    });

    recordAuditLog({
      entityType: "user",
      entityId: updated.id,
      action: "hub_member_role_updated",
      actorEmail: session.email,
      actorRole: session.role,
      previousValue: currentRole,
      newValue: nextOrgRole,
      summary: `Updated ${updated.email} Hub orgRole from ${currentRole} to ${nextOrgRole}.`,
    });

    const {
      passwordHash: _p,
      confirmationToken: _c,
      resetToken: _r,
      ...safeMember
    } = updated;

    return NextResponse.json({ ok: true, member: safeMember });
  } catch (error) {
    console.error("[API /api/hub/team PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update Hub team member role." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireRoles(req, ["hub", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Hub Partner authentication required.");
  }
  if (!isHubOrgAdminSession(session)) {
    return NextResponse.json(
      { error: "Hub Admin privileges required to remove team members." },
      { status: 403 }
    );
  }

  try {
    let body: { userId?: string; email?: string; hubId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Query params may be used instead of JSON body
    }

    const requestedHubId =
      req.nextUrl.searchParams.get("hubId") || body.hubId || null;
    const { hubId } = resolveHubContext(session, requestedHubId);
    if (!hubId) {
      return NextResponse.json(
        { error: "No Innovation Hub is linked to your account." },
        { status: 404 }
      );
    }

    const userIdParam = req.nextUrl.searchParams.get("userId") || body.userId;
    const emailParam = req.nextUrl.searchParams.get("email") || body.email;
    const targetKey = String(emailParam || userIdParam || "")
      .trim()
      .toLowerCase();

    if (!targetKey) {
      return NextResponse.json(
        { error: "userId or email is required." },
        { status: 400 }
      );
    }

    const orgMembers = listOrgMembers({ hubId }).filter(
      (m) => m.isActive !== false
    );
    const target = orgMembers.find(
      (m) =>
        (userIdParam && m.id === userIdParam) ||
        m.email.trim().toLowerCase() === targetKey
    );
    if (!target) {
      return NextResponse.json(
        { error: "Team member not found in your Innovation Hub." },
        { status: 404 }
      );
    }

    if (target.email.trim().toLowerCase() === session.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the Innovation Hub." },
        { status: 400 }
      );
    }

    const targetRole: OrgRole = target.orgRole || "org_admin";
    if (targetRole === "org_admin") {
      const adminCount = orgMembers.filter(
        (m) => (m.orgRole || "org_admin") === "org_admin"
      ).length;
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last remaining Hub Admin." },
          { status: 400 }
        );
      }
    }

    // Pass empty string for hubId so updateOrgMemberAccess clears it to undefined
    const updated = updateOrgMemberAccess(target.id, {
      isActive: false,
      hubId: "",
    });

    await syncSupabaseHubMetadata(target.id, target.email, {
      role: "hub",
      org_role: null,
      hub_id: null,
      is_active: false,
    });

    const sb = getSupabaseServer();
    if (sb) {
      try {
        await sb
          .from("auth_users")
          .update({ is_active: false, hub_id: null })
          .ilike("email", target.email.toLowerCase());
      } catch {}
    }

    recordAuditLog({
      entityType: "user",
      entityId: target.id,
      action: "hub_member_removed",
      actorEmail: session.email,
      actorRole: session.role,
      previousValue: hubId,
      summary: `Removed ${target.email} from hub ${hubId}.`,
    });

    return NextResponse.json({
      ok: true,
      removedId: updated?.id || target.id,
    });
  } catch (error) {
    console.error("[API /api/hub/team DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to remove Hub team member." },
      { status: 500 }
    );
  }
}
