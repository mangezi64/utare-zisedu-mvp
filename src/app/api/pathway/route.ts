import { NextRequest, NextResponse } from "next/server";
import {
  computeAssessmentScores,
  generateAICareerPathway,
} from "@/lib/gemini/pathway-engine";
import { CandidateProfile } from "@/types";
import { getSupabaseServer } from "@/lib/supabase/client";
import {
  readStore,
  saveCandidateEndToEnd,
  updateCandidateProgress,
  findCandidateByEmailAsync,
} from "@/lib/store";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const state = readStore();
  const session = await getSessionFromRequest(req);
  const isAdmin =
    session?.role === "admin" || session?.role === "superuser";
  const emailParam = req.nextUrl.searchParams.get("email");
  const idParam = req.nextUrl.searchParams.get("id");
  let activeCandidate = null;

  if (session) {
    const targetEmail = isAdmin && emailParam ? emailParam : session.email;
    activeCandidate = await findCandidateByEmailAsync(targetEmail);
    if (!activeCandidate && isAdmin && idParam) {
      activeCandidate =
        state.candidates.find((c) => c.id === idParam) || null;
    }
  }

  return NextResponse.json({
    activeCandidate,
    totalCandidates: state.candidates.length,
    totalApplications: state.applications.length,
    totalHubs: state.hubs.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();
    const profile: CandidateProfile = body.profile;
    const quizAnswers: Record<string, number> = body.quizAnswers || {
      domainProblemSolving: 80,
      digitalTools: 70,
      asyncWorkflow: 75,
      clientComms: 80,
    };

    if (!profile || !profile.fullName || !profile.fieldOfStudy) {
      return NextResponse.json(
        { error: "Candidate name and field of study are required." },
        { status: 400 }
      );
    }

    // Bind profile email to authenticated non-admin session; only persist for signed-in candidates/admins
    const isAdmin =
      session?.role === "admin" || session?.role === "superuser";
    const canPersist =
      Boolean(session) &&
      (session?.role === "candidate" || isAdmin);

    if (session && !isAdmin) {
      profile.email = session.email;
    }

    // 1. Compute multi-dimensional diagnostic assessment
    const assessment = computeAssessmentScores(profile, quizAnswers);

    // 2. Generate AI Career Pathway + Human Coach Pairing + Hub Match
    const pathway = await generateAICareerPathway(profile, assessment);

    if (!canPersist) {
      return NextResponse.json({
        record: null,
        assessment,
        pathway,
        savedToDatabase: false,
        savedToSupabase: false,
      });
    }

    // 3. Persist to Unified End-to-End Store
    const savedRecord = saveCandidateEndToEnd(profile, assessment, pathway);

    // 4. Also sync to Supabase if cloud credentials are configured
    let savedToSupabase = false;
    const sb = getSupabaseServer();
    if (sb) {
      try {
        const { data: candidateRow, error: candidateErr } = await sb
          .from("candidate_profiles")
          .upsert(
            {
              full_name: profile.fullName,
              email: profile.email,
              phone: profile.phone,
              city: profile.city,
              highest_qualification: profile.highestQualification,
              field_of_study: profile.fieldOfStudy,
              years_experience: profile.yearsExperience,
              employment_status: profile.employmentStatus,
              monthly_income_bracket: profile.monthlyIncomeBracket,
              has_dedicated_laptop: profile.hasDedicatedLaptop,
              primary_device: profile.primaryDevice,
              internet_access_type: profile.internetAccessType,
              power_reliability_hours: profile.powerReliabilityHours,
              has_global_payment_rail: profile.hasGlobalPaymentRail,
              primary_goal: profile.primaryGoal,
            },
            { onConflict: "email" }
          )
          .select("id")
          .single();

        if (!candidateErr && candidateRow?.id) {
          savedToSupabase = true;
        }
      } catch (dbErr) {
        console.warn("[Supabase Sync Non-Fatal Warning]:", dbErr);
      }
    }

    return NextResponse.json({
      record: savedRecord,
      assessment,
      pathway,
      savedToDatabase: true,
      savedToSupabase,
    });
  } catch (error) {
    console.error("[API /api/pathway POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate career pathway." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return unauthorizedResponse();
    }
    const isAdmin =
      session.role === "admin" || session.role === "superuser";
    const body = await req.json();
    const updated = updateCandidateProgress({
      candidateId: isAdmin && body.candidateId ? body.candidateId : session.email,
      toggleMilestonePhase: body.toggleMilestonePhase,
      confirmCoaching: body.confirmCoaching,
      coachingPreferredDate: body.coachingPreferredDate,
      bookHubId: body.bookHubId,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "No active candidate profile found to update." },
        { status: 404 }
      );
    }

    return NextResponse.json({ record: updated });
  } catch (error) {
    console.error("[API /api/pathway PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update candidate pathway progress." },
      { status: 500 }
    );
  }
}
