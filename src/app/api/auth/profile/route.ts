import { NextRequest, NextResponse } from "next/server";
import { readStore, registerOrUpdateCandidate } from "@/lib/store";
import { CandidateProfile } from "@/types";

export async function GET(req: NextRequest) {
  const state = readStore();
  const emailParam = req.nextUrl.searchParams.get("email");

  let candidate = null;
  if (emailParam) {
    candidate = state.candidates.find(
      (c) => c.profile.email.toLowerCase() === emailParam.toLowerCase()
    );
  } else if (state.activeCandidateId) {
    candidate = state.candidates.find((c) => c.id === state.activeCandidateId);
  }

  if (!candidate && state.candidates.length > 0) {
    candidate = state.candidates[0];
  }

  return NextResponse.json({
    candidate,
    activeCandidateId: state.activeCandidateId,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = (body.profile || body) as CandidateProfile;

    if (!profile || !profile.fullName || !profile.email) {
      return NextResponse.json(
        { error: "Full name and email are required to create or save a profile." },
        { status: 400 }
      );
    }

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
