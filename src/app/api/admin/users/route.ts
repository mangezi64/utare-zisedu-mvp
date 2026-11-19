import { NextRequest, NextResponse } from "next/server";
import {
  adminUnauthorizedResponse,
  getSessionFromRequest,
  resolveBootstrapRole,
} from "@/lib/auth-guard";
import {
  createAuthUser,
  deleteAllUserData,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  listAuthUsers,
  listInactivityRetentionStatus,
  purgeInactiveAccountAfterNotices,
  recordInactivityNoticeEmail,
  updateUserRole,
} from "@/lib/store";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { UserRole } from "@/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== "admin" && session.role !== "superuser")) {
    return adminUnauthorizedResponse();
  }

  const users = [...listAuthUsers()];
  const existingEmails = new Set(users.map((u) => u.email.trim().toLowerCase()));

  // Hydrate from live Supabase Auth users
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data: supaAuthData, error } =
        await adminClient.auth.admin.listUsers();
      if (!error && supaAuthData?.users) {
        for (const su of supaAuthData.users) {
          const emailNorm = (su.email || "").trim().toLowerCase();
          if (emailNorm && !existingEmails.has(emailNorm)) {
            existingEmails.add(emailNorm);
            const rawRole: UserRole =
              (su.app_metadata?.role as UserRole) ||
              (su.user_metadata?.account_type as UserRole) ||
              "candidate";
            const assignedRole = resolveBootstrapRole(emailNorm, rawRole);
            users.push({
              id: su.id,
              email: su.email || "",
              name:
                (su.user_metadata?.full_name as string) ||
                su.email?.split("@")[0] ||
                "User",
              role: assignedRole,
              emailConfirmed: Boolean(su.email_confirmed_at),
              createdAt: su.created_at,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Admin Users Supabase Fetch Warning]:", err);
    }
  }

  const retentionStatuses = listInactivityRetentionStatus();
  return NextResponse.json({
    total: users.length,
    users,
    retentionStatuses,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== "admin" && session.role !== "superuser")) {
    return adminUnauthorizedResponse();
  }

  try {
    const body = await req.json();
    const emailOrId = String(body.email || body.userId || "").trim();
    const role = body.role as UserRole;
    const validRoles: UserRole[] = [
      "candidate",
      "employer",
      "admin",
      "superuser",
    ];

    if (!emailOrId || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Valid user email/id and target role are required." },
        { status: 400 }
      );
    }

    // Hydrate target from DB or Supabase Auth if not in local store yet
    let existingTarget =
      findAuthUserByEmail(emailOrId) ||
      (await findAuthUserByEmailFromDb(emailOrId));

    const adminClient = getSupabaseAdmin();
    if (!existingTarget && adminClient) {
      try {
        const { data: supaAuthData } = await adminClient.auth.admin.listUsers();
        const su = supaAuthData?.users?.find(
          (u) =>
            u.id === emailOrId ||
            (u.email && u.email.toLowerCase() === emailOrId.toLowerCase())
        );
        if (su && su.email) {
          existingTarget = createAuthUser({
            id: su.id,
            email: su.email,
            name:
              (su.user_metadata?.full_name as string) ||
              su.email.split("@")[0] ||
              "User",
            role:
              (su.app_metadata?.role as UserRole) ||
              (su.user_metadata?.account_type as UserRole) ||
              "candidate",
            passwordHash: "supabase_managed",
            emailConfirmed: Boolean(su.email_confirmed_at),
          });
        }
      } catch {}
    }

    // Regular admins can upgrade normal users to 'admin', 'employer', or 'candidate'.
    // Only a 'superuser' can grant or modify the 'superuser' role.
    const targetEffectiveRole = existingTarget
      ? resolveBootstrapRole(existingTarget.email, existingTarget.role)
      : resolveBootstrapRole(emailOrId, "candidate");
    if (
      session.role !== "superuser" &&
      (role === "superuser" || targetEffectiveRole === "superuser")
    ) {
      return NextResponse.json(
        {
          error:
            "Only a Superuser can assign or modify the Superuser role. Admins can upgrade users to Admin.",
        },
        { status: 403 }
      );
    }

    const updated = updateUserRole(emailOrId, role);
    if (!updated) {
      return NextResponse.json(
        {
          error:
            "No registered account found for that email. Ask your teammate to create an account on /login first, then upgrade them here.",
        },
        { status: 404 }
      );
    }

    // Also sync role to Supabase Auth app_metadata if configured
    if (adminClient && updated.id) {
      try {
        await adminClient.auth.admin.updateUserById(updated.id, {
          app_metadata: { role },
        });
      } catch {
        // Non-fatal if user ID is local
      }
    }

    const { passwordHash: _p, confirmationToken: _c, resetToken: _r, ...safeUser } =
      updated;
    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("[API /api/admin/users PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update user role." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return adminUnauthorizedResponse();
  }
  if (session.role !== "superuser") {
    return NextResponse.json(
      {
        error:
          "Forbidden. Only a Superuser can manage inactivity notices or retention deletions.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const targetEmail = String(body.email || "").trim().toLowerCase();

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Target user email is required." },
        { status: 400 }
      );
    }

    if (action === "send_inactivity_notice") {
      const updated = recordInactivityNoticeEmail({
        emailOrId: targetEmail,
        actorEmail: session.email,
        channel: "email",
      });
      if (!updated) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        noticesSent: updated.inactivityNoticesSent ?? 0,
        message: `Inactivity login-to-remain email #${updated.inactivityNoticesSent} recorded for ${updated.email}.`,
      });
    }

    if (action === "purge_inactive") {
      const res = await purgeInactiveAccountAfterNotices({
        targetEmail,
        actorEmail: session.email,
      });
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        deleted: res.deleted,
        message: `Inactive account ${targetEmail} permanently deleted after 1+ year inactivity and 3 warning emails.`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[API /api/admin/users POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to process retention action." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return adminUnauthorizedResponse();
  }
  if (session.role !== "superuser") {
    return NextResponse.json(
      {
        error:
          "Forbidden. Only a Superuser can delete another user's account and data on request.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = String(
      body.email || req.nextUrl.searchParams.get("email") || ""
    )
      .trim()
      .toLowerCase();
    const targetUserId = String(
      body.userId || req.nextUrl.searchParams.get("userId") || ""
    ).trim();
    const confirmationText = String(body.confirmationText || "")
      .trim()
      .toLowerCase();
    const reason = String(
      body.reason || "Superuser on-request deletion (e.g. deceased or special circumstances)"
    ).trim();

    if (!targetEmail && !targetUserId) {
      return NextResponse.json(
        { error: "Target user email or userId is required." },
        { status: 400 }
      );
    }

    if (confirmationText !== "delete") {
      return NextResponse.json(
        { error: 'Please type "delete" to confirm permanent user data erasure.' },
        { status: 400 }
      );
    }

    if (targetEmail && targetEmail === session.email.toLowerCase()) {
      return NextResponse.json(
        {
          error:
            "To delete your own account, please use the self-service Delete My Account option in Account Settings.",
        },
        { status: 400 }
      );
    }

    const result = await deleteAllUserData({
      targetEmail,
      targetUserId,
      actorEmail: session.email,
      actorRole: session.role,
      reason,
    });

    if (!result.deleted) {
      return NextResponse.json(
        { error: "No matching user account or records found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: true,
      removedCounts: result.removedCounts,
      message: `All platform and database records for ${targetEmail || targetUserId} have been permanently deleted.`,
    });
  } catch (error) {
    console.error("[API /api/admin/users DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete user data." },
      { status: 500 }
    );
  }
}
