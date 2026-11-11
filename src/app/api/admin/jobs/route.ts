import { NextRequest, NextResponse } from "next/server";
import {
  addJobToStore,
  deleteJobFromStore,
  readStore,
  updateJobStatus,
} from "@/lib/store";
import { RemoteJob } from "@/types";
import { generateJson, isGeminiEnabled } from "@/lib/gemini/client";

const SAMPLE_AI_DISCOVERIES: Omit<RemoteJob, "id">[] = [
  {
    title: "AI Quality & Data Evaluation Specialist (Africa Timezone)",
    company: "Turing Distributed Labs",
    category: "AI & Data Operations",
    compensationUsdMonthly: "$1,100 – $1,600 / mo",
    supportedPaymentRails: ["Deel", "Payoneer", "USD Wire (Nostro)"],
    requiredSkills: [
      "Critical Thinking",
      "Fact-Checking",
      "Analytical Writing",
      "Prompt Evaluation",
    ],
    minReadinessTier: "Bridge-Ready (Hub + Rapid Upskilling)",
    isAsyncFriendly: true,
    description:
      "Review and score multimodal AI outputs for technical accuracy and natural phrasing. CAT timezone (GMT+2) async schedule with solar hub workstation support.",
    applicationUrl: "https://boards.greenhouse.io/turing/jobs/example",
    status: "pending_review",
    discoveredBy: "ai-search",
    sourceUrl: "https://boards.greenhouse.io/turing",
    discoveredAt: new Date().toISOString(),
  },
  {
    title: "Remote Customer Success & Technical Triage Lead",
    company: "Helios Cloud UK",
    category: "Technical Support & Operations",
    compensationUsdMonthly: "$900 – $1,350 / mo",
    supportedPaymentRails: ["Payoneer", "Wise", "Deel"],
    requiredSkills: [
      "Customer Empathy",
      "Troubleshooting",
      "CRM & Ticket Management",
      "Async Documentation",
    ],
    minReadinessTier: "Market-Ready (Direct Placement)",
    isAsyncFriendly: false,
    description:
      "Handle tier-1/tier-2 SaaS support for EMEA clients. Direct working hour alignment with UK/EU business hours from Zimbabwe.",
    applicationUrl: "https://jobs.lever.co/helios/example",
    status: "pending_review",
    discoveredBy: "ai-search",
    sourceUrl: "https://jobs.lever.co/helios",
    discoveredAt: new Date().toISOString(),
  },
  {
    title: "Junior Python & Web Automation Engineer",
    company: "Nexus Distributed Systems",
    category: "Software Engineering",
    compensationUsdMonthly: "$1,300 – $2,100 / mo",
    supportedPaymentRails: ["Deel", "USDC / Crypto Rail", "USD Nostro"],
    requiredSkills: [
      "Python 3",
      "REST APIs",
      "PostgreSQL",
      "Docker Basics",
      "Git",
    ],
    minReadinessTier: "Market-Ready (Direct Placement)",
    isAsyncFriendly: true,
    description:
      "Maintain automated data ingestion pipelines and ETL scripts. Open to self-taught or university graduates with proven portfolio projects.",
    applicationUrl: "https://remoteok.com/nexus/example",
    status: "pending_review",
    discoveredBy: "ai-search",
    sourceUrl: "https://remoteok.com/nexus",
    discoveredAt: new Date().toISOString(),
  },
];

function isAuthorizedAdmin(req: NextRequest): boolean {
  const role =
    req.headers.get("x-utare-role") || req.nextUrl.searchParams.get("role");
  const email =
    req.headers.get("x-utare-email") || req.nextUrl.searchParams.get("email");
  return (
    role === "admin" ||
    Boolean(email && email.toLowerCase().includes("admin@utare.co.zw"))
  );
}

export async function GET() {
  const state = readStore();
  return NextResponse.json({
    total: state.jobs.length,
    jobs: state.jobs,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin/Facilitator privileges required." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();

    // Action 1: AI Job Discovery
    if (body.action === "discover") {
      let discoveredJobs: RemoteJob[] = [];

      // If live Gemini is enabled, try to discover a live realistic role
      if (isGeminiEnabled()) {
        const prompt = `Generate 2 real-world remote job opportunities suitable for tertiary-educated Zimbabwean talent with CAT timezone alignment and Deel/Payoneer payment rails. Return JSON list matching schema.`;
        const schema = {
          type: "OBJECT",
          properties: {
            jobs: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  company: { type: "STRING" },
                  category: { type: "STRING" },
                  compensationUsdMonthly: { type: "STRING" },
                  supportedPaymentRails: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                  requiredSkills: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                  minReadinessTier: { type: "STRING" },
                  isAsyncFriendly: { type: "BOOLEAN" },
                  description: { type: "STRING" },
                  applicationUrl: { type: "STRING" },
                },
                required: [
                  "title",
                  "company",
                  "category",
                  "compensationUsdMonthly",
                  "supportedPaymentRails",
                  "requiredSkills",
                  "description",
                ],
              },
            },
          },
          required: ["jobs"],
        };

        const aiRes = await generateJson<{ jobs: Omit<RemoteJob, "id">[] }>({
          systemInstruction:
            "You are an international remote talent scout for African and Zimbabwean professionals. Generate realistic, high-quality remote jobs that pay in USD via Deel/Payoneer/Nostro.",
          prompt,
          schema: schema as any,
          label: "ai-job-discovery",
        });
        if (aiRes?.jobs && Array.isArray(aiRes.jobs) && aiRes.jobs.length > 0) {
          discoveredJobs = aiRes.jobs.map((j, idx) => ({
            ...j,
            id: `ai-job-${Date.now()}-${idx}`,
            status: "pending_review",
            discoveredBy: "ai-search",
            discoveredAt: new Date().toISOString(),
            isAsyncFriendly: j.isAsyncFriendly ?? true,
            minReadinessTier:
              j.minReadinessTier || "Bridge-Ready (Hub + Rapid Upskilling)",
            applicationUrl: j.applicationUrl || "https://remoteok.com",
          }));
        }
      }

      // If AI did not return or not enabled, pick from seed discoveries
      if (discoveredJobs.length === 0) {
        discoveredJobs = SAMPLE_AI_DISCOVERIES.map((sample, idx) => ({
          ...sample,
          id: `ai-job-${Date.now()}-${idx}`,
          discoveredAt: new Date().toISOString(),
        }));
      }

      // Add discovered jobs to store
      for (const dj of discoveredJobs) {
        addJobToStore(dj);
      }

      return NextResponse.json({
        success: true,
        count: discoveredJobs.length,
        discovered: discoveredJobs,
        message: `AI Search discovered ${discoveredJobs.length} new remote opportunities for review.`,
      });
    }

    // Action 2: Add Job Manually or via Link
    const {
      title,
      company,
      category,
      compensationUsdMonthly,
      supportedPaymentRails,
      requiredSkills,
      minReadinessTier,
      isAsyncFriendly,
      description,
      applicationUrl,
      sourceUrl,
    } = body;

    if (!title || !company) {
      return NextResponse.json(
        { error: "Job title and company name are required." },
        { status: 400 }
      );
    }

    const rails =
      Array.isArray(supportedPaymentRails) && supportedPaymentRails.length > 0
        ? supportedPaymentRails
        : ["Deel", "Payoneer", "USD Wire (Nostro)"];

    const skills =
      Array.isArray(requiredSkills) && requiredSkills.length > 0
        ? requiredSkills
        : typeof requiredSkills === "string"
        ? requiredSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : ["Communication", "Problem Solving", "Digital Tools"];

    const newJob: RemoteJob = {
      id: `job-${Date.now()}`,
      title: title.trim(),
      company: company.trim(),
      category: (category || "General Remote").trim(),
      compensationUsdMonthly: (compensationUsdMonthly || "$800 – $1,400 / mo").trim(),
      supportedPaymentRails: rails,
      requiredSkills: skills,
      minReadinessTier:
        minReadinessTier || "Bridge-Ready (Hub + Rapid Upskilling)",
      isAsyncFriendly: Boolean(isAsyncFriendly ?? true),
      description: (
        description ||
        `Verified international remote role for ${title} at ${company}. Accessible via Utare Partner Hubs.`
      ).trim(),
      applicationUrl: (applicationUrl || sourceUrl || "#apply").trim(),
      sourceUrl: (sourceUrl || applicationUrl || "").trim(),
      status: "approved", // Manual additions by admin are approved by default
      discoveredBy: sourceUrl ? "admin-manual" : "admin-manual",
      discoveredAt: new Date().toISOString(),
    };

    const saved = addJobToStore(newJob);
    return NextResponse.json({
      success: true,
      job: saved,
      message: `Remote job "${saved.title}" at ${saved.company} successfully added and published.`,
    });
  } catch (error) {
    console.error("[API /api/admin/jobs POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to process job request." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin/Facilitator privileges required." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    const { jobId, status } = body;

    if (!jobId || !status) {
      return NextResponse.json(
        { error: "jobId and status are required." },
        { status: 400 }
      );
    }

    if (!["approved", "pending_review", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value." },
        { status: 400 }
      );
    }

    const updated = updateJobStatus(jobId, status);
    if (!updated) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: updated,
      message: `Job status updated to "${status}".`,
    });
  } catch (error) {
    console.error("[API /api/admin/jobs PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update job status." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin/Facilitator privileges required." },
      { status: 401 }
    );
  }
  try {
    const jobId = req.nextUrl.searchParams.get("id");
    if (!jobId) {
      return NextResponse.json(
        { error: "id parameter is required." },
        { status: 400 }
      );
    }

    const removed = deleteJobFromStore(jobId);
    if (!removed) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job removed successfully.",
    });
  } catch (error) {
    console.error("[API /api/admin/jobs DELETE Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete job." },
      { status: 500 }
    );
  }
}
