import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth-guard";
import { reportJobListing } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorizedResponse("Please sign in to report a suspicious or unsafe listing.");
  }

  try {
    const body = await req.json();
    const jobId = String(body.jobId || "").trim();
    const reason = String(body.reason || "").trim();
    const details = String(body.details || "").trim();

    if (!jobId || !reason) {
      return NextResponse.json(
        { error: "Job ID and a reason for reporting are required." },
        { status: 400 }
      );
    }

    const updated = reportJobListing({
      jobId,
      reason,
      details,
      reportedByEmail: session.email,
      reportedByName: session.name,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: updated.id,
      status: updated.status,
      message:
        "Thank you. This listing has been immediately removed from the platform and escalated to Superusers for safety evaluation.",
    });
  } catch (error) {
    console.error("[API /api/jobs/report POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to submit safety report." },
      { status: 500 }
    );
  }
}
