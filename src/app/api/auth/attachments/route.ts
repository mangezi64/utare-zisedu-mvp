import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth-guard";
import {
  addCandidateDocument,
  deleteCandidateDocument,
  findCandidateByEmailAsync,
  listAuditLogs,
  listCandidateCvArtifacts,
  listCandidateDocuments,
  recordAuditLog,
  registerOrUpdateCandidate,
  saveCandidateCvArtifact,
} from "@/lib/store";
import { CandidateDocumentCategory } from "@/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorizedResponse("Please sign in to access your documents and artifacts.");
  }

  const isAdmin = session.role === "admin" || session.role === "superuser";
  const emailParam = req.nextUrl.searchParams.get("email");
  const targetEmail = isAdmin && emailParam ? emailParam : session.email;
  const includeAudit = req.nextUrl.searchParams.get("audit") === "1" && isAdmin;

  const [documents, cvArtifacts, auditLogs] = await Promise.all([
    listCandidateDocuments(isAdmin && emailParam === "all" ? null : targetEmail),
    listCandidateCvArtifacts(isAdmin && emailParam === "all" ? null : targetEmail),
    includeAudit ? listAuditLogs(100) : Promise.resolve([]),
  ]);

  return NextResponse.json({
    documents,
    cvArtifacts,
    ...(includeAudit ? { auditLogs } : {}),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return unauthorizedResponse("Please sign in to upload documents or save artifacts.");
    }

    const body = await req.json();
    const type: "document" | "cv_artifact" | "avatar" = body.type || "document";
    const isAdmin = session.role === "admin" || session.role === "superuser";
    const targetEmail =
      isAdmin && body.candidateEmail
        ? String(body.candidateEmail).trim().toLowerCase()
        : session.email.toLowerCase();

    // 1. Update candidate profile picture & CV photo toggle
    if (type === "avatar") {
      const existing = await findCandidateByEmailAsync(targetEmail);
      const updated = registerOrUpdateCandidate({
        ...(existing?.profile || {
          fullName: session.name || "Candidate",
          email: targetEmail,
          phone: "",
          city: "Harare",
          highestQualification: "Bachelors Degree",
          fieldOfStudy: "Information Technology",
          yearsExperience: 1,
          employmentStatus: "Unemployed",
          monthlyIncomeBracket: "$0 (Zero Income)",
          hasDedicatedLaptop: false,
          primaryDevice: "Smartphone Only",
          internetAccessType: "Mobile Data Bundles Only",
          powerReliabilityHours: 6,
          hasGlobalPaymentRail: false,
          primaryGoal: "International Remote Work",
          currentSkills: [],
        }),
        avatarDataUrl:
          body.avatarDataUrl !== undefined
            ? body.avatarDataUrl
            : existing?.profile.avatarDataUrl,
        includePhotoOnCv:
          body.includePhotoOnCv !== undefined
            ? Boolean(body.includePhotoOnCv)
            : Boolean(existing?.profile.includePhotoOnCv),
      });

      recordAuditLog({
        entityType: "candidate",
        entityId: updated.id,
        action: "avatar_updated",
        actorEmail: session.email,
        actorRole: session.role,
        summary: `Updated profile portrait and CV photo preference for ${targetEmail}.`,
      });

      return NextResponse.json({
        success: true,
        candidate: updated,
        message: "Profile picture & CV photo settings saved.",
      });
    }

    // 2. Save versioned CV & Cover Letter artifact
    if (type === "cv_artifact") {
      if (!body.generatedCv || !body.generatedCoverLetter) {
        return NextResponse.json(
          { error: "generatedCv and generatedCoverLetter are required." },
          { status: 400 }
        );
      }

      const artifact = await saveCandidateCvArtifact({
        userId: session.sub,
        candidateEmail: targetEmail,
        jobId: body.jobId,
        jobTitle: String(body.jobTitle || "General Remote Role"),
        company: String(body.company || "Target Employer"),
        generatedCv: body.generatedCv,
        generatedCoverLetter: body.generatedCoverLetter,
        sourceDetails: body.sourceDetails,
        avatarDataUrl: body.avatarDataUrl,
        includePhoto: Boolean(body.includePhoto),
      });

      recordAuditLog({
        entityType: "cv_artifact",
        entityId: artifact.id,
        action: "cv_version_saved",
        actorEmail: session.email,
        actorRole: session.role,
        newValue: `v${artifact.version}`,
        summary: `Saved Tailored CV & Cover Letter (v${artifact.version}) for "${artifact.jobTitle}" at ${artifact.company}.`,
      });

      return NextResponse.json({
        success: true,
        artifact,
        message: `Saved Tailored CV & Cover Letter (Version v${artifact.version}).`,
      });
    }

    // 3. Upload versioned degree / certificate / supporting document
    const title = String(body.title || "").trim();
    const fileName = String(body.fileName || "").trim();
    const dataUrl = String(body.dataUrl || "");
    const category = (body.category || "certificate") as CandidateDocumentCategory;

    if (!title || !fileName || !dataUrl) {
      return NextResponse.json(
        { error: "Document title, file name, and file content are required." },
        { status: 400 }
      );
    }

    const doc = await addCandidateDocument({
      userId: session.sub,
      candidateEmail: targetEmail,
      category,
      title,
      issuer: body.issuer,
      issueYear: body.issueYear,
      fileName,
      mimeType: String(body.mimeType || "application/octet-stream"),
      fileSizeBytes: Number(body.fileSizeBytes) || 0,
      dataUrl,
    });

    recordAuditLog({
      entityType: "document",
      entityId: doc.id,
      action: "document_uploaded",
      actorEmail: session.email,
      actorRole: session.role,
      newValue: `v${doc.version}`,
      summary: `Uploaded ${doc.category} "${doc.title}" (v${doc.version}, ${doc.fileName}) for ${targetEmail}.`,
    });

    return NextResponse.json({
      success: true,
      document: doc,
      message: `Uploaded "${doc.title}" (Version v${doc.version}).`,
    });
  } catch (error) {
    console.error("[API /api/auth/attachments POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to save attachment." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return unauthorizedResponse();
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  }

  const isAdmin = session.role === "admin" || session.role === "superuser";
  const removed = await deleteCandidateDocument(id, session.email, isAdmin);
  if (!removed) {
    return NextResponse.json(
      { error: "Forbidden or document not found." },
      { status: 403 }
    );
  }

  recordAuditLog({
    entityType: "document",
    entityId: id,
    action: "document_deleted",
    actorEmail: session.email,
    actorRole: session.role,
    summary: `Deleted candidate document ${id}.`,
  });

  return NextResponse.json({ success: true });
}
