import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-guard";
import { findCandidateByEmail, findEmployerByEmail } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  const candidate = findCandidateByEmail(session.email);
  const employer = findEmployerByEmail(session.email);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.sub,
      email: session.email,
      name:
        candidate?.profile.fullName ||
        employer?.contactPerson ||
        session.name,
      role: session.role,
      emailConfirmed: session.emailConfirmed,
      companyName: employer?.companyName || session.companyName,
      employerVerificationStatus: employer?.verificationStatus,
      city: candidate?.profile.city || session.city,
      qualification:
        candidate?.profile.highestQualification || session.qualification,
      fieldOfStudy:
        candidate?.profile.fieldOfStudy || session.fieldOfStudy,
    },
  });
}
