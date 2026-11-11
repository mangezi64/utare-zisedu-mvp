import { NextRequest, NextResponse } from "next/server";
import { findCandidateByEmail, readStore, submitJobApplicationToStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const state = readStore();
  const emailParam = req.nextUrl.searchParams.get("email");
  const showAll = req.nextUrl.searchParams.get("all") === "1";
  const roleParam =
    req.headers.get("x-utare-role") || req.nextUrl.searchParams.get("role");
  const isAdmin = roleParam === "admin";

  let activeCandidate = null;
  if (emailParam) {
    activeCandidate = findCandidateByEmail(emailParam);
  }

  // Regular candidate users see only approved jobs; admins see all jobs
  const jobs =
    showAll && isAdmin
      ? state.jobs
      : state.jobs.filter(
          (j) => j.status !== "pending_review" && j.status !== "archived"
        );

  // Return applications strictly scoped to the requesting candidate or authorized admin
  let applications: typeof state.applications = [];
  if (showAll && isAdmin) {
    applications = state.applications;
  } else if (activeCandidate) {
    applications = state.applications.filter(
      (a) =>
        a.candidateId === activeCandidate.id ||
        (a.candidateName &&
          activeCandidate.profile.fullName &&
          a.candidateName.toLowerCase() ===
            activeCandidate.profile.fullName.toLowerCase())
    );
  }

  return NextResponse.json({
    jobs,
    applications,
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
      candidateId: body.candidateId,
      candidateName: body.candidateName,
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
