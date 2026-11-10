import { NextRequest, NextResponse } from "next/server";
import { readStore, submitJobApplicationToStore } from "@/lib/store";

export async function GET() {
  const state = readStore();
  const activeCandidate =
    state.candidates.find((c) => c.id === state.activeCandidateId) ||
    state.candidates[0] ||
    null;

  return NextResponse.json({
    jobs: state.jobs,
    applications: state.applications,
    activeCandidate,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.jobId || !body.tailoredResumePitch) {
      return NextResponse.json(
        { error: "jobId and tailoredResumePitch are required." },
        { status: 400 }
      );
    }

    const application = submitJobApplicationToStore({
      jobId: body.jobId,
      tailoredResumePitch: body.tailoredResumePitch,
    });

    if (!application) {
      return NextResponse.json(
        { error: "Target remote job not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ application, status: "submitted" });
  } catch (error) {
    console.error("[API /api/jobs POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to submit remote job application." },
      { status: 500 }
    );
  }
}
