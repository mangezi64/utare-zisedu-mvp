import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { resolveBootstrapRole } from "@/lib/bootstrap-roles";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const effectiveRole = session
    ? resolveBootstrapRole(session.email, session.role)
    : null;

  // Enforce strict role gates on /admin and /employer routes when a session is present
  if (pathname.startsWith("/admin")) {
    if (
      session &&
      effectiveRole !== "admin" &&
      effectiveRole !== "superuser"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/employer") && !pathname.startsWith("/employers")) {
    if (
      session &&
      effectiveRole !== "employer" &&
      effectiveRole !== "admin" &&
      effectiveRole !== "superuser"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employer/:path*", "/account/:path*", "/pathway/:path*"],
};
