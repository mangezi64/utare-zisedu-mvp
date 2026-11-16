import { NextRequest, NextResponse } from "next/server";
import {
  adminUnauthorizedResponse,
  getSessionFromRequest,
  resolveBootstrapRole,
} from "@/lib/auth-guard";
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  listAuthUsers,
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

  return NextResponse.json({ total: users.length, users });
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
    if (
      session.role !== "superuser" &&
      (role === "superuser" || existingTarget?.role === "superuser")
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
