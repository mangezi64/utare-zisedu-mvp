import { NextRequest, NextResponse } from "next/server";
import {
  adminUnauthorizedResponse,
  isAdminRequest,
  isSuperuserRequest,
} from "@/lib/auth-guard";
import { listAuthUsers, updateUserRole } from "@/lib/store";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { UserRole } from "@/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }
  const users = listAuthUsers();
  return NextResponse.json({ total: users.length, users });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperuserRequest(req))) {
    return NextResponse.json(
      {
        error:
          "Forbidden. Only Superuser accounts can promote or demote user roles.",
      },
      { status: 403 }
    );
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

    const updated = updateUserRole(emailOrId, role);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Also sync role to Supabase Auth app_metadata if configured
    const adminClient = getSupabaseAdmin();
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
