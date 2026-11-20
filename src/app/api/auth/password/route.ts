import { NextRequest, NextResponse } from "next/server";
import {
  adminUnauthorizedResponse,
  getSessionFromRequest,
  isAdminRequest,
  resolveBootstrapRole,
  unauthorizedResponse,
} from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth-session";
import { resolvePostLoginDestination } from "@/lib/bootstrap-roles";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import {
  confirmUserEmailByAddressAsync,
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserByEmailFromDb,
  findCandidateByEmailAsync,
  updateUserPassword,
  verifyAndConsumeResetToken,
} from "@/lib/store";
import {
  getSupabaseAdmin,
  getSupabaseServer,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase/client";
import { isValidUuid, safeSupabaseUpdate } from "@/lib/supabase/safe-write";
import { validateEmail, validatePassword } from "@/lib/validation";
import { UserRole } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode: "change" | "reset" | "admin-reset" | "set-password" =
      body.mode || "change";
    const newPassword = String(body.newPassword || "");

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) {
      return NextResponse.json(
        { error: pwCheck.error || "Please choose a stronger password (min 8 characters with uppercase, lowercase, and number)." },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdmin();
    const sb = getSupabaseServer();
    const passwordHash = hashPassword(newPassword);

    // -------------------------------------------------------------------------
    // MODE 1: Admin / Superuser Password Override (from /admin)
    // -------------------------------------------------------------------------
    if (mode === "admin-reset") {
      if (!(await isAdminRequest(req))) {
        return adminUnauthorizedResponse();
      }
      const targetEmail = String(body.email || "").trim().toLowerCase();
      if (!targetEmail || !validateEmail(targetEmail).isValid) {
        return NextResponse.json(
          { error: "Valid target user email is required." },
          { status: 400 }
        );
      }

      let targetUser =
        findAuthUserByEmail(targetEmail) ||
        (await findAuthUserByEmailFromDb(targetEmail));

      if (adminClient) {
        try {
          const { data: listData } = await adminClient.auth.admin.listUsers();
          const supaUser = listData?.users?.find(
            (u) => u.email?.toLowerCase() === targetEmail
          );
          if (supaUser) {
            await adminClient.auth.admin.updateUserById(supaUser.id, {
              password: newPassword,
              email_confirm: true,
            });
            if (!targetUser) {
              targetUser = createAuthUser({
                id: supaUser.id,
                email: targetEmail,
                name:
                  (supaUser.user_metadata?.full_name as string) ||
                  targetEmail.split("@")[0],
                role:
                  (supaUser.app_metadata?.role as UserRole) ||
                  (supaUser.user_metadata?.account_type as UserRole) ||
                  "candidate",
                passwordHash,
                emailConfirmed: true,
              });
            }
          }
        } catch (err) {
          console.warn("[Admin Password Reset Supabase Warning]:", err);
        }
      }

      if (targetUser) {
        updateUserPassword(targetEmail, passwordHash);
      }
      if (sb) {
        safeSupabaseUpdate(
          sb,
          "auth_users",
          { password_hash: passwordHash, email_confirmed: true },
          "email",
          targetEmail,
          { caseInsensitive: true }
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Password for ${targetEmail} has been updated and verified.`,
      });
    }

    // -------------------------------------------------------------------------
    // MODE 1.5: Set Password via One-Time Invite/Reset Token or Callback Session
    // -------------------------------------------------------------------------
    if (mode === "set-password") {
      const resetToken = String(body.resetToken || body.token || "").trim();
      const rawEmail = String(body.email || "").trim().toLowerCase();

      let targetEmail = rawEmail;
      let targetUser = null;

      if (resetToken) {
        if (!targetEmail || !validateEmail(targetEmail).isValid) {
          return NextResponse.json(
            { error: "Valid email address is required with reset token." },
            { status: 400 }
          );
        }
        targetUser = await verifyAndConsumeResetToken(targetEmail, resetToken);
        if (!targetUser) {
          return NextResponse.json(
            {
              error:
                "Invalid or expired password setup link. Please request a new invite or reset link.",
            },
            { status: 400 }
          );
        }
        targetEmail = targetUser.email.toLowerCase();
      } else {
        const session = await getSessionFromRequest(req);
        if (!session) {
          return unauthorizedResponse(
            "Missing reset token or active verification session."
          );
        }
        targetEmail = session.email.toLowerCase();
        targetUser =
          findAuthUserByEmail(targetEmail) ||
          (await findAuthUserByEmailFromDb(targetEmail));
        if (!targetUser) {
          targetUser = createAuthUser({
            id: session.sub,
            email: targetEmail,
            name: session.name,
            role: session.role,
            orgRole: session.orgRole,
            employerId: session.employerId,
            hubId: session.hubId,
            companyName: session.companyName,
            passwordHash,
            emailConfirmed: true,
          });
        }
      }

      if (adminClient) {
        try {
          let supaUserId: string | null = isValidUuid(targetUser.id)
            ? targetUser.id
            : null;
          if (!supaUserId) {
            const { data: listData } = await adminClient.auth.admin.listUsers();
            const su = listData?.users?.find(
              (u) => u.email?.toLowerCase() === targetEmail
            );
            if (su) supaUserId = su.id;
          }
          if (supaUserId) {
            await adminClient.auth.admin.updateUserById(supaUserId, {
              password: newPassword,
              email_confirm: true,
            });
          }
        } catch (err) {
          console.warn("[Set Password Supabase Warning]:", err);
        }
      }

      updateUserPassword(targetEmail, passwordHash);
      const confirmedUser =
        (await confirmUserEmailByAddressAsync(targetEmail)) || targetUser;

      if (sb) {
        safeSupabaseUpdate(
          sb,
          "auth_users",
          {
            password_hash: passwordHash,
            email_confirmed: true,
            reset_token: null,
            reset_token_expires_at: null,
          },
          "email",
          targetEmail,
          { caseInsensitive: true }
        ).catch(() => {});
      }

      const finalRole = resolveBootstrapRole(targetEmail, confirmedUser.role);
      const redirectTo = resolvePostLoginDestination(finalRole);
      const sessionToken = await signSessionToken({
        sub: confirmedUser.id,
        email: targetEmail,
        name: confirmedUser.name,
        role: finalRole,
        orgRole: confirmedUser.orgRole,
        employerId: confirmedUser.employerId,
        hubId: confirmedUser.hubId,
        emailConfirmed: true,
        companyName: confirmedUser.companyName,
        city: confirmedUser.city,
        qualification: confirmedUser.qualification,
        fieldOfStudy: confirmedUser.fieldOfStudy,
      });

      const res = NextResponse.json({
        success: true,
        role: finalRole,
        redirectTo,
        message: "Password set successfully! Redirecting to your workspace...",
        user: {
          id: confirmedUser.id,
          email: targetEmail,
          name: confirmedUser.name,
          role: finalRole,
          orgRole: confirmedUser.orgRole,
          employerId: confirmedUser.employerId,
          hubId: confirmedUser.hubId,
          emailConfirmed: true,
          companyName: confirmedUser.companyName,
        },
      });

      res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    // -------------------------------------------------------------------------
    // MODE 2: Self-Service Password Reset (from /login)
    // -------------------------------------------------------------------------
    if (mode === "reset") {
      const targetEmail = String(body.email || "").trim().toLowerCase();
      const fullNameVerify = String(body.fullName || "").trim().toLowerCase();

      if (!targetEmail || !fullNameVerify) {
        return NextResponse.json(
          { error: "Please enter your registered email address and full name to verify your account." },
          { status: 400 }
        );
      }

      let targetUser =
        findAuthUserByEmail(targetEmail) ||
        (await findAuthUserByEmailFromDb(targetEmail));
      const candidate = await findCandidateByEmailAsync(targetEmail);

      let supaUserMatch: { id: string; name: string; role: UserRole } | null = null;
      if (adminClient) {
        try {
          const { data: listData } = await adminClient.auth.admin.listUsers();
          const su = listData?.users?.find(
            (u) => u.email?.toLowerCase() === targetEmail
          );
          if (su) {
            supaUserMatch = {
              id: su.id,
              name:
                (su.user_metadata?.full_name as string) ||
                su.email?.split("@")[0] ||
                "",
              role:
                (su.app_metadata?.role as UserRole) ||
                (su.user_metadata?.account_type as UserRole) ||
                "candidate",
            };
          }
        } catch {}
      }

      if (!targetUser && !candidate && !supaUserMatch) {
        return NextResponse.json(
          { error: "No account found matching that email address." },
          { status: 404 }
        );
      }

      const effectiveRole = resolveBootstrapRole(
        targetEmail,
        targetUser?.role || supaUserMatch?.role || "candidate"
      );
      if (effectiveRole === "admin" || effectiveRole === "superuser") {
        return NextResponse.json(
          {
            error:
              "Privileged accounts cannot be reset via self-service name verification. Please contact a Superuser.",
          },
          { status: 403 }
        );
      }

      const knownNames = [
        targetUser?.name,
        candidate?.profile.fullName,
        supaUserMatch?.name,
      ]
        .filter(Boolean)
        .map((n) => String(n).trim().toLowerCase());

      const nameMatches =
        fullNameVerify.length >= 2 &&
        knownNames.some((kn) => kn === fullNameVerify);

      if (!nameMatches) {
        return NextResponse.json(
          { error: "Full name verification did not match the registered account name." },
          { status: 403 }
        );
      }

      if (adminClient && supaUserMatch) {
        await adminClient.auth.admin.updateUserById(supaUserMatch.id, {
          password: newPassword,
          email_confirm: true,
        });
      }

      if (!targetUser) {
        createAuthUser({
          id: supaUserMatch?.id,
          email: targetEmail,
          name:
            candidate?.profile.fullName ||
            supaUserMatch?.name ||
            body.fullName,
          role: supaUserMatch?.role || "candidate",
          passwordHash,
          emailConfirmed: true,
        });
      } else {
        updateUserPassword(targetEmail, passwordHash);
      }

      if (sb) {
        safeSupabaseUpdate(
          sb,
          "auth_users",
          { password_hash: passwordHash, email_confirmed: true },
          "email",
          targetEmail,
          { caseInsensitive: true }
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: "Your password has been reset! You can now sign in with your new password.",
      });
    }

    // -------------------------------------------------------------------------
    // MODE 3: Authenticated Password Change (from /account)
    // -------------------------------------------------------------------------
    const session = await getSessionFromRequest(req);
    if (!session) {
      return unauthorizedResponse("Please sign in to change your password.");
    }

    const currentPassword = String(body.currentPassword || "");
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Please enter your current password." },
        { status: 400 }
      );
    }

    const userEmail = session.email.toLowerCase();
    let userRecord =
      findAuthUserByEmail(userEmail) ||
      (await findAuthUserByEmailFromDb(userEmail));

    let currentVerified = false;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (!error) {
        currentVerified = true;
      }
    }

    if (
      !currentVerified &&
      userRecord &&
      userRecord.passwordHash &&
      userRecord.passwordHash !== "supabase_managed"
    ) {
      currentVerified = verifyPassword(currentPassword, userRecord.passwordHash);
    }

    if (!currentVerified) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    if (adminClient) {
      try {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const su = listData?.users?.find(
          (u) => u.email?.toLowerCase() === userEmail || u.id === session.sub
        );
        if (su) {
          await adminClient.auth.admin.updateUserById(su.id, {
            password: newPassword,
          });
        }
      } catch {}
    }

    if (userRecord) {
      updateUserPassword(userEmail, passwordHash);
    } else {
      userRecord = createAuthUser({
        id: session.sub,
        email: userEmail,
        name: session.name,
        role: session.role,
        passwordHash,
        emailConfirmed: true,
      });
    }

    if (sb) {
      safeSupabaseUpdate(
        sb,
        "auth_users",
        { password_hash: passwordHash },
        "email",
        userEmail,
        { caseInsensitive: true }
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been updated successfully!",
    });
  } catch (error) {
    console.error("[API /api/auth/password POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }
}
