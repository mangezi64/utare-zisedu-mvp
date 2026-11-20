import { NextRequest, NextResponse } from "next/server";
import { requireRoles, unauthorizedResponse } from "@/lib/auth-guard";
import {
  addJobToStore,
  findEmployerByEmail,
  findEmployerById,
  getEmployerApplicants,
  getEmployerJobs,
  recordAuditLog,
  saveEmployerRegistration,
  updateApplicationStatus,
  updateJobStatus,
} from "@/lib/store";
import { ApplicationStatus, OrgRole, RemoteJob } from "@/types";
import { SessionPayload } from "@/lib/auth-session";

export const runtime = "nodejs";

function resolveEffectiveOrgRole(session: SessionPayload): OrgRole {
  if (session.role === "admin" || session.role === "superuser") {
    return "org_admin";
  }
  return session.orgRole || "org_admin";
}

function resolveEmployerForSession(session: SessionPayload) {
  return (
    (session.employerId ? findEmployerById(session.employerId) : null) ||
    findEmployerByEmail(session.email) ||
    findEmployerById(session.sub)
  );
}

export async function GET(req: NextRequest) {
  const session = await requireRoles(req, ["employer", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Employer authentication required.");
  }

  const orgRole = resolveEffectiveOrgRole(session);
  let employer = resolveEmployerForSession(session);

  if (!employer && session.role === "employer" && orgRole === "org_admin") {
    employer = saveEmployerRegistration({
      userId: session.sub,
      companyName: session.companyName || `${session.name} Organization`,
      contactPerson: session.name,
      email: session.email,
      industry: "Technology & Operations",
      rolesInterested: ["Remote Operations"],
      hiringModel: "100% Remote Contract",
      estimatedHires: 1,
      timezoneOverlapNeeded: "CAT (GMT+2)",
      verificationStatus: "pending",
    });
  }

  const lookup = {
    id: employer?.id || session.employerId || session.sub,
    email: employer?.email || session.email,
    companyName: employer?.companyName || session.companyName,
  };

  const jobs = getEmployerJobs(lookup);
  // Strictly scoped applicant DTOs (never includes private candidate fields)
  const applicants = getEmployerApplicants(lookup);

  return NextResponse.json({
    employer,
    jobs,
    applicants,
    orgRole,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireRoles(req, ["employer", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Employer authentication required.");
  }

  try {
    const body = await req.json();
    const orgRole = resolveEffectiveOrgRole(session);
    let employer = resolveEmployerForSession(session);

    if (!employer) {
      if (orgRole !== "org_admin") {
        return NextResponse.json(
          {
            error:
              "No organization profile is linked to your team member account. Please contact your Organization Admin.",
          },
          { status: 403 }
        );
      }
      employer = saveEmployerRegistration({
        userId: session.sub,
        companyName:
          String(body.companyName || session.companyName || session.name).trim(),
        contactPerson: session.name,
        email: session.email,
        industry: String(body.industry || "Technology & SaaS"),
        rolesInterested: [],
        hiringModel: "100% Remote Contract",
        estimatedHires: 1,
        timezoneOverlapNeeded: "CAT (GMT+2)",
        verificationStatus:
          session.role === "admin" || session.role === "superuser"
            ? "verified"
            : "pending",
      });
    }

    if (employer.verificationStatus === "rejected") {
      return NextResponse.json(
        {
          error:
            "Your employer account was not approved for job posting. Please contact partnerships support.",
        },
        { status: 403 }
      );
    }

    const title = String(body.title || "").trim();
    const category = String(body.category || "Operations").trim();
    const compensationUsdMonthly = String(
      body.compensationUsdMonthly || "$800 – $1,400 / mo"
    ).trim();
    const description = String(body.description || "").trim();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Job title and description are required." },
        { status: 400 }
      );
    }

    const requiredSkills = Array.isArray(body.requiredSkills)
      ? body.requiredSkills
      : String(body.requiredSkills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const supportedPaymentRails = Array.isArray(body.supportedPaymentRails)
      ? body.supportedPaymentRails
      : String(body.supportedPaymentRails || "Deel, Payoneer, USD Wire (Nostro)")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    // Verified employers publish straight away; unverified employers' jobs
    // wait in pending_review and auto-approve once an admin verifies the employer.
    const isVerified =
      employer.verificationStatus === "verified" ||
      session.role === "admin" ||
      session.role === "superuser";

    const nowIso = new Date().toISOString();
    const newJob: RemoteJob = {
      id: `job-emp-${Date.now()}`,
      title,
      company: employer.companyName,
      employerId: employer.id,
      employerEmail: employer.email,
      companyWebsite: String(body.companyWebsite || employer.website || "").trim() || undefined,
      externalRoleUrl: String(body.externalRoleUrl || body.sourceUrl || "").trim() || undefined,
      attachmentDocuments: Array.isArray(body.attachmentDocuments)
        ? body.attachmentDocuments
        : undefined,
      category,
      industry: String(body.industry || employer.industry || "Technology"),
      level: body.level || "Entry",
      arrangement: body.arrangement || "Remote",
      compensationUsdMonthly,
      supportedPaymentRails:
        supportedPaymentRails.length > 0 ? supportedPaymentRails : ["Deel", "Payoneer"],
      requiredSkills:
        requiredSkills.length > 0
          ? requiredSkills
          : ["English Fluency", "Async Communication"],
      minReadinessTier: String(
        body.minReadinessTier || "Bridge-Ready (Hub + Rapid Upskilling)"
      ),
      isAsyncFriendly: body.isAsyncFriendly !== false,
      description,
      applicationUrl: String(body.applicationUrl || "#apply-platform"),
      status: isVerified ? "approved" : "pending_review",
      discoveredBy: "employer-posted",
      discoveredAt: nowIso,
      updatedAt: nowIso,
      updatedBy: session.email,
    };

    const savedJob = addJobToStore(newJob);

    recordAuditLog({
      entityType: "job",
      entityId: savedJob.id,
      action: "job_posted",
      actorEmail: session.email,
      actorRole: session.role,
      newValue: savedJob.status,
      summary: `Employer ${employer.companyName} posted role "${savedJob.title}" (${savedJob.status}).`,
    });

    return NextResponse.json({
      success: true,
      job: savedJob,
      publishedImmediately: isVerified,
      message: isVerified
        ? "Job published live on the Utare ZEM Opportunities board."
        : "Job saved! It will go live automatically as soon as a Facilitator verifies your employer account.",
    });
  } catch (error) {
    console.error("[API /api/employer/portal POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to post job." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireRoles(req, ["employer", "admin", "superuser"]);
  if (!session) {
    return unauthorizedResponse("Employer authentication required.");
  }

  try {
    const body = await req.json();
    const orgRole = resolveEffectiveOrgRole(session);
    const employer = resolveEmployerForSession(session);
    const lookup = {
      id: employer?.id || session.employerId || session.sub,
      email: employer?.email || session.email,
      companyName: employer?.companyName || session.companyName,
    };

    if (body.action === "update_employer_profile") {
      if (orgRole !== "org_admin") {
        return NextResponse.json(
          {
            error:
              "Only Organization Admins can update company profile and settings.",
          },
          { status: 403 }
        );
      }
      if (!employer) {
        return NextResponse.json(
          { error: "Employer profile not found." },
          { status: 404 }
        );
      }
      const updatedEmp = saveEmployerRegistration({
        ...employer,
        website:
          body.website !== undefined ? String(body.website).trim() : employer.website,
        careerPageUrl:
          body.careerPageUrl !== undefined
            ? String(body.careerPageUrl).trim()
            : employer.careerPageUrl,
        sharedDocuments: Array.isArray(body.sharedDocuments)
          ? body.sharedDocuments
          : employer.sharedDocuments,
        updatedAt: new Date().toISOString(),
        updatedBy: session.email,
      });

      recordAuditLog({
        entityType: "employer",
        entityId: updatedEmp.id,
        action: "employer_profile_updated",
        actorEmail: session.email,
        actorRole: session.role,
        summary: `Updated company website, career links & shared documents for ${updatedEmp.companyName}.`,
      });

      return NextResponse.json({
        success: true,
        employer: updatedEmp,
      });
    }

    if (body.action === "update_application_status") {
      const validStatuses: ApplicationStatus[] = [
        "submitted",
        "under_review",
        "shortlisted",
        "rejected",
        "hired",
      ];
      const nextStatus = body.status as ApplicationStatus;
      if (!body.applicationId || !validStatuses.includes(nextStatus)) {
        return NextResponse.json(
          { error: "Valid applicationId and status are required." },
          { status: 400 }
        );
      }

      if (
        orgRole !== "org_admin" &&
        (nextStatus === "hired" || nextStatus === "rejected")
      ) {
        return NextResponse.json(
          {
            error:
              "Only Organization Admins can make final hired or rejected decisions. Team members may move applicants to Under Review or Shortlisted.",
          },
          { status: 403 }
        );
      }

      const updated = updateApplicationStatus({
        applicationId: String(body.applicationId),
        status: nextStatus,
        employer: lookup,
        isAdmin: session.role === "admin" || session.role === "superuser",
        actorEmail: session.email,
        feedbackNote:
          typeof body.feedbackNote === "string" ? body.feedbackNote : undefined,
      });

      if (!updated) {
        return NextResponse.json(
          { error: "Application not found or not owned by your organization." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        applicant: updated,
      });
    }

    if (body.action === "update_job_status") {
      const ownedJobs = getEmployerJobs(lookup);
      const targetJob = ownedJobs.find((j) => j.id === body.jobId);
      if (
        !targetJob &&
        session.role !== "admin" &&
        session.role !== "superuser"
      ) {
        return NextResponse.json(
          { error: "Job not found or not owned by your organization." },
          { status: 404 }
        );
      }

      if (targetJob?.status === "reported" && session.role !== "superuser") {
        return NextResponse.json(
          {
            error:
              "This listing was reported for safety review. Only a Superuser may evaluate or restore it.",
          },
          { status: 403 }
        );
      }

      const requestedStatus =
        body.status === "archived"
          ? "archived"
          : employer?.verificationStatus === "verified"
          ? "approved"
          : "pending_review";

      const updatedJob = updateJobStatus(String(body.jobId), requestedStatus);
      return NextResponse.json({
        success: true,
        job: updatedJob,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[API /api/employer/portal PATCH Error]:", error);
    return NextResponse.json(
      { error: "Failed to update employer resource." },
      { status: 500 }
    );
  }
}
