import { NextRequest, NextResponse } from "next/server";
import {
  computeAssessmentScores,
  generateAICareerPathway,
} from "@/lib/gemini/pathway-engine";
import { CandidateProfile } from "@/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

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

    // 3. Persist to Supabase if credentials are configured in .env.local
    let savedToDatabase = false;
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
          savedToDatabase = true;
        }
      } catch (dbErr) {
        console.warn("[Supabase Persistence Non-Fatal Warning]:", dbErr);
      }
    }

    return NextResponse.json({
      assessment,
      pathway,
      savedToDatabase,
    });
  } catch (error) {
    console.error("[API /api/pathway Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate career pathway." },
      { status: 500 }
    );
  }
}
