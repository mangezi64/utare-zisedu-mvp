import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Enforce strict role gates on /admin and /employer routes when a session is present
  if (pathname.startsWith("/admin")) {
    if (session && session.role !== "admin" && session.role !== "superuser") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/employer") && !pathname.startsWith("/employers")) {
    if (
      session &&
      session.role !== "employer" &&
      session.role !== "admin" &&
      session.role !== "superuser"
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
