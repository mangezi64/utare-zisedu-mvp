// =============================================================================
// UTARE ZEM AI — Server-Side Session & Role Authorization Guard (v2)
// =============================================================================
// Verifies the cryptographically signed `utare_session` HTTP-only cookie (or
// Supabase Auth JWT when configured) and looks up the authoritative backend
// user role (`candidate` | `employer` | `admin` | `superuser`).
// Never trusts client headers, email patterns, or localStorage.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  verifySessionToken,
} from "@/lib/auth-session";
import { findAuthUserByEmail } from "@/lib/store";
import { getSupabaseAdmin, isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { UserRole } from "@/types";

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  // 1. Check signed HTTP-only session cookie or Bearer header
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const rawToken = cookieToken || bearerToken;
  if (rawToken) {
    const verified = await verifySessionToken(rawToken);
    if (verified) {
      // Refresh authoritative role from backend store if present
      const storedUser = findAuthUserByEmail(verified.email);
      if (storedUser) {
        return {
          ...verified,
          role: storedUser.role,
          emailConfirmed: storedUser.emailConfirmed,
          companyName: storedUser.companyName || verified.companyName,
        };
      }
      return verified;
    }

    // 2. If Supabase is configured and a Supabase JWT was passed, verify via Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.getUser(rawToken);
        if (!error && data?.user && data.user.email) {
          let role: UserRole =
            (data.user.app_metadata?.role as UserRole) || "candidate";
          const adminClient = getSupabaseAdmin();
          if (adminClient) {
            const { data: adminUser } = await adminClient.auth.admin.getUserById(
              data.user.id
            );
            if (adminUser?.user?.app_metadata?.role) {
              role = adminUser.user.app_metadata.role as UserRole;
            }
          }
          const now = Math.floor(Date.now() / 1000);
          return {
            sub: data.user.id,
            email: data.user.email.toLowerCase(),
            name:
              (data.user.user_metadata?.full_name as string) ||
              data.user.email.split("@")[0],
            role,
            emailConfirmed: Boolean(data.user.email_confirmed_at),
            companyName: data.user.user_metadata?.company_name as
              | string
              | undefined,
            iat: now,
            exp: now + 3600,
          };
        }
      } catch {
        // Ignore invalid token
      }
    }
  }

  return null;
}

export async function requireRoles(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<SessionPayload | null> {
  const session = await getSessionFromRequest(req);
  if (!session) return null;
  if (!allowedRoles.includes(session.role)) return null;
  return session;
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const session = await requireRoles(req, ["admin", "superuser"]);
  return session !== null;
}

export async function isSuperuserRequest(req: NextRequest): Promise<boolean> {
  const session = await requireRoles(req, ["superuser"]);
  return session !== null;
}

export function adminUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized. Admin or Superuser privileges required." },
    { status: 401 }
  );
}

export function unauthorizedResponse(message = "Authentication required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
