import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/auth-guard";
import {
  findCandidateByEmailAsync,
  readStore,
  submitJobApplicationToStore,
  toggleApplicationSharing,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const state = readStore();
  const session = await getSessionFromRequest(req);
  const showAll = req.nextUrl.searchParams.get("all") === "1";
  const isAdmin = showAll && (await isAdminRequest(req));

  let activeCandidate = null;
  if (session) {
    activeCandidate = await findCandidateByEmailAsync(session.email);
  }

  // Regular candidate/public users see only approved jobs (never pending_review, reported, or archived)
  const jobs =
    showAll && isAdmin
      ? state.jobs
      : state.jobs.filter(
          (j) =>
            j.status !== "pending_review" &&
            j.status !== "reported" &&
            j.status !== "archived"
        );

  // Return applications strictly scoped to the authenticated session user or authorized admin
  let applications: typeof state.applications = [];
  if (showAll && isAdmin) {
    applications = state.applications;
  } else if (session) {
    applications = state.applications.filter(
      (a) =>
        (activeCandidate && a.candidateId === activeCandidate.id) ||
        a.candidateId === session.sub ||
        (a.candidateEmail &&
          a.candidateEmail.toLowerCase() === session.email.toLowerCase())
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
    const session = await getSessionFromRequest(req);
    if (!session) {
      return unauthorizedResponse("Please sign in to submit a job application.");
    }

    const body = await req.json();
    if (!body.jobId || !body.tailoredResumePitch) {
      return NextResponse.json(
        { error: "jobId and tailoredResumePitch are required." },
        { status: 400 }
      );
    }

    if (body.sharedWithEmployer !== true) {
      return NextResponse.json(
        {
          error:
            "Please toggle on consent to share your application and profile summary with the employer before submitting.",
        },
        { status: 400 }
      );
    }

    const state = readStore();
    const targetJob = state.jobs.find((j) => j.id === body.jobId);
    if (
      !targetJob ||
      targetJob.status === "reported" ||
      targetJob.status === "pending_review" ||
      targetJob.status === "archived"
    ) {
      return NextResponse.json(
        { error: "Target remote job not found or no longer accepting applications." },
        { status: 404 }
      );
    }

    const application = submitJobApplicationToStore({
      jobId: body.jobId,
      tailoredResumePitch: body.tailoredResumePitch,
      candidateId: session.sub,
      candidateName: body.candidateName || session.name,
      candidateEmail: session.email,
      generatedCv: body.generatedCv,
      generatedCoverLetter: body.generatedCoverLetter,
      sharedWithEmployer: true,
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return unauthorizedResponse("Please sign in to manage application sharing.");
    }

    const body = await req.json();
    if (!body.applicationId || typeof body.sharedWithEmployer !== "boolean") {
      return NextResponse.json(
        { error: "applicationId and sharedWithEmployer boolean are required." },
        { status: 400 }
      );
    }

    const updated = toggleApplicationSharing({
      applicationId: String(body.applicationId),
      candidateEmail: session.email,
      sharedWithEmployer: body.sharedWithEmployer,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Application not found for your account." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error) {
    console.error("[API /api/jobs PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update application sharing preference." },
      { status: 500 }
    );
  }
}
