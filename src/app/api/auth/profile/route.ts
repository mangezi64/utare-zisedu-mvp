import { NextRequest, NextResponse } from "next/server";
import { readStore, registerOrUpdateCandidate, findCandidateByEmail } from "@/lib/store";
import { CandidateProfile } from "@/types";

export async function GET(req: NextRequest) {
  const state = readStore();
  const emailParam = req.nextUrl.searchParams.get("email");
  const idParam = req.nextUrl.searchParams.get("id");

  let candidate = null;
  if (emailParam) {
    candidate = findCandidateByEmail(emailParam);
  } else if (idParam) {
    candidate = state.candidates.find((c) => c.id === idParam) || null;
  }

  return NextResponse.json({
    candidate,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawProfile = (body.profile || body) as Record<string, unknown>;
    const fullName = (rawProfile.fullName || rawProfile.name) as string | undefined;
    const email = rawProfile.email as string | undefined;

    if (!rawProfile || !fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required to create or save a profile." },
        { status: 400 }
      );
    }

    const profile = {
      ...rawProfile,
      fullName,
      email,
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
