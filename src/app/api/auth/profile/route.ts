import { NextRequest, NextResponse } from "next/server";
import {
  readStore,
  registerOrUpdateCandidate,
  findCandidateByEmail,
} from "@/lib/store";
import { CandidateProfile } from "@/types";
import { validateEmail } from "@/lib/validation";
import { checkEmailDomain } from "@/lib/email-domain-check";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth-guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ candidate: null });
  }

  const state = readStore();
  const isAdmin = session.role === "admin" || session.role === "superuser";
  const emailParam = req.nextUrl.searchParams.get("email");
  const idParam = req.nextUrl.searchParams.get("id");

  // Candidates can only fetch their own profile; admins can inspect any candidate
  const targetEmail = isAdmin && emailParam ? emailParam : session.email;
  let candidate = findCandidateByEmail(targetEmail);

  if (!candidate && isAdmin && idParam) {
    candidate = state.candidates.find((c) => c.id === idParam) || null;
  }

  return NextResponse.json({
    candidate,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();
    const rawProfile = (body.profile || body) as Record<string, unknown>;
    const fullName = (rawProfile.fullName || rawProfile.name) as
      | string
      | undefined;
    const email = (rawProfile.email || session?.email) as string | undefined;

    if (!rawProfile || !fullName || !email) {
      return NextResponse.json(
        {
          error: "Full name and email are required to create or save a profile.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // If not registering via legacy mode, require authenticated session matching email (or admin)
    if (body.mode !== "register") {
      if (!session) {
        return unauthorizedResponse();
      }
      const isAdmin = session.role === "admin" || session.role === "superuser";
      if (!isAdmin && session.email.toLowerCase() !== normalizedEmail) {
        return NextResponse.json(
          { error: "Forbidden. You may only update your own profile." },
          { status: 403 }
        );
      }
    } else {
      const formatCheck = validateEmail(normalizedEmail);
      if (!formatCheck.isValid) {
        return NextResponse.json({ error: formatCheck.error }, { status: 400 });
      }

      if ((await checkEmailDomain(normalizedEmail)) === "undeliverable") {
        return NextResponse.json(
          {
            error:
              "This email domain doesn't exist or can't receive mail. Please use a real email address.",
          },
          { status: 400 }
        );
      }

      if (findCandidateByEmail(normalizedEmail)) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }
    }

    const profile = {
      ...rawProfile,
      fullName,
      email: normalizedEmail,
    } as unknown as CandidateProfile;

    const record = registerOrUpdateCandidate(profile);
    return NextResponse.json({
      success: true,
      candidate: record,
      message: "Candidate account & profile saved successfully.",
    });
  } catch (error) {
    console.error("[API /api/auth/profile POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to save profile." },
      { status: 500 }
    );
  }
}
