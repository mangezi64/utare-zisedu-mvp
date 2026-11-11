import { NextRequest, NextResponse } from "next/server";
import { readStore, submitJobApplicationToStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const state = readStore();
  const showAll = req.nextUrl.searchParams.get("all") === "1";
  const activeCandidate =
    state.candidates.find((c) => c.id === state.activeCandidateId) ||
    state.candidates[0] ||
    null;

  // Regular candidate users see only approved jobs; admins can pass ?all=1
  const jobs = showAll
    ? state.jobs
    : state.jobs.filter(
        (j) => j.status !== "pending_review" && j.status !== "archived"
      );

  return NextResponse.json({
    jobs,
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
