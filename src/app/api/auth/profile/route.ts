import { NextRequest, NextResponse } from "next/server";
import {
  readStore,
  registerOrUpdateCandidate,
  findCandidateByEmailAsync,
} from "@/lib/store";
import { CandidateProfile } from "@/types";
import { validateEmail } from "@/lib/validation";
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
  let candidate = await findCandidateByEmailAsync(targetEmail);

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
    if (!session) {
      return unauthorizedResponse("Please sign in to update your profile.");
    }

    const body = await req.json();
    const rawProfile = (body.profile || body) as Record<string, unknown>;
    const fullName = (rawProfile.fullName || rawProfile.name) as
      | string
      | undefined;
    const isAdmin = session.role === "admin" || session.role === "superuser";
    const email = (rawProfile.email || session.email) as string | undefined;

    if (!rawProfile || !fullName || !email) {
      return NextResponse.json(
        {
          error: "Full name and email are required to create or save a profile.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isAdmin && session.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: "Forbidden. You may only update your own profile." },
        { status: 403 }
      );
    }

    const formatCheck = validateEmail(normalizedEmail);
    if (!formatCheck.isValid) {
      return NextResponse.json({ error: formatCheck.error }, { status: 400 });
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
