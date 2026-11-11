import { NextRequest, NextResponse } from "next/server";
import {
  computeAssessmentScores,
  generateAICareerPathway,
} from "@/lib/gemini/pathway-engine";
import { CandidateProfile } from "@/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  readStore,
  saveCandidateEndToEnd,
  updateCandidateProgress,
  findCandidateByEmail,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const state = readStore();
  const emailParam = req.nextUrl.searchParams.get("email");
  const idParam = req.nextUrl.searchParams.get("id");
  let activeCandidate = null;

  if (emailParam) {
    activeCandidate = findCandidateByEmail(emailParam);
  } else if (idParam) {
    activeCandidate =
      state.candidates.find((c) => c.id === idParam) || null;
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

    // 1. Compute multi-dimensional diagnostic assessment
    const assessment = computeAssessmentScores(profile, quizAnswers);

    // 2. Generate AI Career Pathway + Human Coach Pairing + Hub Match
    const pathway = await generateAICareerPathway(profile, assessment);

    // 3. Persist to Unified End-to-End Store
    const savedRecord = saveCandidateEndToEnd(profile, assessment, pathway);

    // 4. Also sync to Supabase if cloud credentials are configured in .env.local
    let savedToSupabase = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: candidateRow, error: candidateErr } = await supabase
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
    const body = await req.json();
    const updated = updateCandidateProgress({
      candidateId: body.candidateId,
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
