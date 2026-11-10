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

export async function POST(req: NextRequest) {
  try {
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

    const [cv, coverLetter] = await Promise.all([
      generateCv(profile, details, target, hubName),
      generateCoverLetter(profile, details, target, hubName),
    ]);

    const cvPlain = cvToPlainText(cv);
    const letterPlain = coverLetterToPlainText(coverLetter);

    const cvStyle = analyzeStyle(cvPlain);
    const letterStyle = analyzeStyle(letterPlain);

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
    });
  } catch (error) {
    console.error("[API /api/documents POST Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate CV and application letter." },
      { status: 500 }
    );
  }
}
