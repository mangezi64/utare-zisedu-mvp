import { NextRequest, NextResponse } from "next/server";
import {
  CandidateProfile,
  CvSourceDetails,
  GeneratedCoverLetter,
  GeneratedCv,
  TargetRole,
} from "@/types";
import { generateCv, cvToPlainText } from "@/lib/documents/cv-writer";
import {
  generateCoverLetter,
  coverLetterToPlainText,
} from "@/lib/documents/cover-letter-writer";
import { analyzeStyle } from "@/lib/documents/humanizer";
import {
  coverLetterToDocxBuffer,
  cvToDocxBuffer,
  safeFileName,
} from "@/lib/documents/docx-export";
import { buildDefaultCvDetails } from "@/lib/documents/sample-cv-details";
import { matchNearestHub } from "@/lib/gemini/pathway-engine";
import { saveCandidateCvArtifact } from "@/lib/store";
import { getSessionFromRequest } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();
    const format: "json" | "cv-docx" | "letter-docx" = body.format || "json";

    // If caller already has a generated CV / Cover Letter and wants to download .docx
    if (format === "cv-docx" && body.cv) {
      const cv: GeneratedCv = body.cv;
      const buffer = await cvToDocxBuffer(cv);
      const filename = `${safeFileName(cv.fullName, "CV")}.docx`;
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "letter-docx" && body.coverLetter) {
      const letter: GeneratedCoverLetter = body.coverLetter;
      const buffer = await coverLetterToDocxBuffer(letter);
      const filename = `${safeFileName(
        letter.fullName,
        "Application_Letter"
      )}.docx`;
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Generate structured CV + Cover Letter + Anti-Slop Style Audit
    const profile: CandidateProfile = body.profile;
    const target: TargetRole = body.target;
    if (!profile || !profile.fullName || !target || !target.title) {
      return NextResponse.json(
        { error: "Candidate profile and target role are required." },
        { status: 400 }
      );
    }

    const details: CvSourceDetails =
      body.details || buildDefaultCvDetails(profile);
    const hubName: string =
      body.hubName || matchNearestHub(profile.city).name;

    const [rawCv, coverLetter] = await Promise.all([
      generateCv(profile, details, target, hubName),
      generateCoverLetter(profile, details, target, hubName),
    ]);

    const cv: GeneratedCv = {
      ...rawCv,
      ...(profile.avatarDataUrl ? { avatarDataUrl: profile.avatarDataUrl } : {}),
      ...(profile.includePhotoOnCv !== undefined
        ? { includePhotoOnCv: Boolean(profile.includePhotoOnCv) }
        : {}),
    };

    const cvPlain = cvToPlainText(cv);
    const letterPlain = coverLetterToPlainText(coverLetter);

    const cvStyle = analyzeStyle(cvPlain);
    const letterStyle = analyzeStyle(letterPlain);

    let artifact = null;
    if (session && body.saveVersion !== false) {
      const isAdmin =
        session.role === "admin" || session.role === "superuser";
      const targetEmail =
        isAdmin && profile.email ? profile.email : session.email;
      artifact = await saveCandidateCvArtifact({
        userId: session.sub,
        candidateEmail: targetEmail,
        jobId: body.jobId,
        jobTitle: target.title,
        company: target.company,
        generatedCv: cv,
        generatedCoverLetter: coverLetter,
        sourceDetails: details,
        avatarDataUrl: profile.avatarDataUrl,
        includePhoto: Boolean(profile.includePhotoOnCv),
      });
    }

    return NextResponse.json({
      cv,
      coverLetter,
      cvPlain,
      letterPlain,
      styleReport: {
        cv: cvStyle,
        coverLetter: letterStyle,
      },
      detailsUsed: details,
      artifact,
    });
  } catch (error) {
    console.error("[API /api/documents POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate CV and application letter." },
      { status: 500 }
    );
  }
}
