// =============================================================================
// UTARE ZEM AI — Server-side Admin Authorization Guard
// =============================================================================
// Single place that decides whether an API request comes from an admin.
//
// INTERIM (pre-Supabase Auth): the legacy client-supplied `x-utare-role` header
// is trusted ONLY during local development. In production (Vercel / any
// non-development build) every admin request is refused until real
// session-based authentication is wired in.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

const isLocalDevelopment =
  process.env.NODE_ENV === "development" && !process.env.VERCEL;

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  if (!isLocalDevelopment) return false;
  const role = req.headers.get("x-utare-role") || req.nextUrl.searchParams.get("role");
  return role === "admin";
}

export function adminUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized. Admin/Facilitator privileges required." },
    { status: 401 }
  );
}
