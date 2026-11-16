import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedResponse } from "@/lib/auth-guard";
import { readStore } from "@/lib/store";

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedResponse } from "@/lib/auth-guard";
import { readStore, StoredCandidateRecord } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }

  const state = readStore();
  let candidateList: StoredCandidateRecord[] = [...state.candidates];

  // Hydrate from live Supabase Postgres candidate_profiles
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbProfiles, error } = await supabase
        .from("candidate_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && dbProfiles && dbProfiles.length > 0) {
        const existingEmails = new Set(
          candidateList.map((c) => (c.profile?.email || "").trim().toLowerCase())
        );

        for (const p of dbProfiles) {
          const emailNorm = (p.email || "").trim().toLowerCase();
          if (emailNorm && !existingEmails.has(emailNorm)) {
            existingEmails.add(emailNorm);
            candidateList.unshift({
              id: p.id || `cand-${p.user_id || Date.now()}`,
              profile: {
                fullName: p.full_name || "Candidate",
                email: p.email,
                phone: p.phone || "",
                city: p.city || "Harare",
                highestQualification: p.highest_qualification || "Bachelors Degree",
                fieldOfStudy: p.field_of_study || "Information Technology",
                yearsExperience: Number(p.years_experience) || 0,
                employmentStatus: p.employment_status || "Unemployed",
                monthlyIncomeBracket: p.monthly_income_bracket || "$0 (Zero Income)",
                hasDedicatedLaptop: Boolean(p.has_dedicated_laptop),
                primaryDevice: p.primary_device || "Smartphone Only",
                internetAccessType: p.internet_access_type || "Mobile Data Bundles Only",
                powerReliabilityHours: Number(p.power_reliability_hours) || 6,
                hasGlobalPaymentRail: Boolean(p.has_global_payment_rail),
                primaryGoal: p.primary_goal || "International Remote Work",
                currentSkills: p.field_of_study ? [p.field_of_study] : [],
              },
              assessment: {
                domainCompetencyScore: 78,
                digitalReadinessScore: 72,
                remoteWorkLiteracyScore: 75,
                infrastructureIndexScore: p.has_dedicated_laptop ? 80 : 45,
                overallScore: 72,
                readinessTier: p.has_dedicated_laptop
                  ? "Market-Ready (Direct Placement)"
                  : "Bridge-Ready (Hub + Rapid Upskilling)",
                strengths: [
                  "Strong foundational tertiary education",
                  "High motivation for remote economic mobility",
                ],
                criticalGaps: p.has_dedicated_laptop
                  ? []
                  : ["Requires Partner Hub solar workstation access"],
              },
              pathway: {
                recommendedTrack: p.primary_goal || "International Remote Work",
                executiveDiagnosis: `${p.full_name || "Candidate"} is prepared for remote delivery with localized hardware support.`,
                infrastructureBridgePlan:
                  "Pairing with solar & Starlink hub to eliminate daily power & connectivity constraints.",
                recommendedHub: state.hubs[0],
                assignedCoach: state.coaches[0],
                coachingAgenda: [
                  "1. Remote Workflow & International Payment Setup",
                  "2. Portfolio & Verified Competency Review",
                  "3. Live Interview & Technical Practice",
                ],
                upskillingMilestones: [],
                targetRemoteRoles: [
                  {
                    role: "Remote Associate",
                    estimatedMonthlyUsd: "$800 - $1,400 / mo",
                    matchReason: "Strong educational alignment.",
                  },
                ],
                paymentRailGuidance:
                  "Configure Deel or Payoneer for direct USD transfers.",
                tailoredResumeSummary: `Dedicated ${p.field_of_study || "professional"} prepared for high-impact remote delivery.`,
                generatedBy: "utare-deterministic-engine",
              },
              completedMilestones: [],
              coachingStatus: "Pending Booking",
              createdAt: p.created_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Admin Candidates Supabase Fetch Warning]:", err);
    }
  }

  return NextResponse.json({
    total: candidateList.length,
    candidates: candidateList,
    applications: state.applications,
  });
}
