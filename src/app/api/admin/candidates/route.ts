import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedResponse } from "@/lib/auth-guard";
import { JobApplicationRecord, readStore, StoredCandidateRecord } from "@/lib/store";
import { getSupabaseServer } from "@/lib/supabase/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return adminUnauthorizedResponse();
  }

  const state = readStore();
  const candidateList: StoredCandidateRecord[] = [...state.candidates];
  const applicationList: JobApplicationRecord[] = [...state.applications];

  // Hydrate from live Supabase Postgres using Service-Role client (bypasses RLS)
  const sb = getSupabaseServer();
  if (sb) {
    try {
      const { data: dbProfiles, error } = await sb
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
                upskillingMilestones: [
                  {
                    phase: "Phase 1: Hardware & Baseline",
                    durationWeeks: 2,
                    title: "Hardware Access & Payment Rail Setup",
                    objective: "Secure reliable workstation at partner hub and configure Payoneer/Deel.",
                    deliverable: "Active Deel account + verified Hub workstation booking",
                    resources: ["Hub Onboarding Guide", "Global Payment Rails Primer"],
                    lowBandwidthFriendly: true,
                  },
                ],
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

      // Also hydrate job applications from Supabase
      const { data: dbApps, error: appErr } = await sb
        .from("job_applications")
        .select("*")
        .order("applied_at", { ascending: false });

      if (!appErr && dbApps && dbApps.length > 0) {
        const existingAppIds = new Set(applicationList.map((a) => a.id));
        for (const a of dbApps) {
          if (a.id && !existingAppIds.has(a.id)) {
            existingAppIds.add(a.id);
            applicationList.unshift({
              id: a.id,
              candidateId: a.candidate_id,
              candidateName: a.candidate_name,
              candidateEmail: a.candidate_email,
              jobId: a.job_id,
              jobTitle: a.job_title,
              company: a.company,
              tailoredResumePitch: a.tailored_resume_pitch,
              appliedAt: a.applied_at || new Date().toISOString(),
              status: a.status || "submitted",
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
    applications: applicationList,
  });
}
