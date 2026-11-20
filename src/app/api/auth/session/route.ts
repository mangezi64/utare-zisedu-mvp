import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-guard";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth-session";
import { findCandidateByEmailAsync, findEmployerByEmailAsync } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  const candidate = await findCandidateByEmailAsync(session.email);
  const employer = await findEmployerByEmailAsync(session.email);

  const res = NextResponse.json({
    authenticated: true,
    user: {
      id: session.sub,
      email: session.email,
      name:
        candidate?.profile.fullName ||
        employer?.contactPerson ||
        session.name,
      role: session.role,
      orgRole: session.orgRole,
      employerId: session.employerId,
      hubId: session.hubId,
      emailConfirmed: session.emailConfirmed,
      companyName: employer?.companyName || session.companyName,
      employerVerificationStatus: employer?.verificationStatus,
      city: candidate?.profile.city || session.city,
      qualification:
        candidate?.profile.highestQualification || session.qualification,
      fieldOfStudy:
        candidate?.profile.fieldOfStudy || session.fieldOfStudy,
      avatar: candidate?.profile.avatarDataUrl || undefined,
    },
  });

  // If the cookie had an older unprivileged role, re-issue a freshly signed cookie
  // with the elevated role so Edge middleware and future requests stay in sync
  const cookieVal = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieVal) {
    const verified = await verifySessionToken(cookieVal);
    if (
      verified &&
      (verified.role !== session.role ||
        verified.orgRole !== session.orgRole ||
        verified.employerId !== session.employerId ||
        verified.hubId !== session.hubId)
    ) {
      const refreshedToken = await signSessionToken({
        ...verified,
        role: session.role,
        orgRole: session.orgRole,
        employerId: session.employerId,
        hubId: session.hubId,
      });
      res.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  return res;
}
