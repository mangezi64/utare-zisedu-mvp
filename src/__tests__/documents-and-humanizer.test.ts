import { describe, it, expect } from "vitest";
import { analyzeStyle, humanize } from "@/lib/documents/humanizer";
import { generateCv, cvToPlainText } from "@/lib/documents/cv-writer";
import {
  generateCoverLetter,
  coverLetterToPlainText,
} from "@/lib/documents/cover-letter-writer";
import {
  cvToDocxBuffer,
  coverLetterToDocxBuffer,
} from "@/lib/documents/docx-export";
import { buildDefaultCvDetails } from "@/lib/documents/sample-cv-details";
import { CandidateProfile, TargetRole } from "@/types";

const SAMPLE_PROFILE: CandidateProfile = {
  fullName: "Chipo Nyamande",
  email: "chipo.nyamande@example.co.zw",
  phone: "+263 77 210 9876",
  city: "Harare",
  highestQualification: "Bachelors Degree",
  fieldOfStudy: "BSc Honours in Economics & Statistics",
  yearsExperience: 1,
  employmentStatus: "Unemployed",
  monthlyIncomeBracket: "$0 (Zero Income)",
  hasDedicatedLaptop: false,
  primaryDevice: "Smartphone Only",
  internetAccessType: "Mobile Data Bundles Only",
  powerReliabilityHours: 5,
  hasGlobalPaymentRail: false,
  primaryGoal: "International Remote Work",
  currentSkills: [
    "Statistical Analysis",
    "Academic Research",
    "Excel",
    "Report Writing",
  ],
};

const SAMPLE_TARGET: TargetRole = {
  title: "AI Training & Domain Data Analyst",
  company: "GlobalScale AI Partners",
  description:
    "Evaluate and benchmark domain-specific outputs in Economics and Finance. 100% remote async schedule.",
  requiredSkills: ["Analytical Writing", "Excel", "Research Synthesis"],
};

describe("Anti-AI-Slop Humanizer & Style Checker", () => {
  it("flags AI clichés and rewrites them into plain, natural English", () => {
    const sloppy =
      "In today's fast-paced world, I am writing to express my strong interest in the role! I spearheaded a cutting-edge project and leveraged a proven track record of synergy — furthermore, I am deeply passionate about data!";

    const beforeReport = analyzeStyle(sloppy);
    expect(beforeReport.score).toBeLessThan(65);
    expect(beforeReport.flaggedPhrases.length).toBeGreaterThanOrEqual(4);

    const cleaned = humanize(sloppy);
    expect(cleaned).not.toMatch(/fast-paced world/i);
    expect(cleaned).not.toMatch(/spearheaded/i);
    expect(cleaned).not.toMatch(/leveraged/i);
    expect(cleaned).not.toMatch(/passionate about/i);
    expect(cleaned).not.toContain("—");
    expect(cleaned).not.toContain("!");

    const afterReport = analyzeStyle(cleaned);
    expect(afterReport.score).toBeGreaterThanOrEqual(90);
    expect(afterReport.flaggedPhrases).toHaveLength(0);
  });
});

describe("Structured CV & Application Letter Generation + .docx Export", () => {
  it("builds a grounded, ATS-friendly CV with zero fabricated employers and a high human tone score", async () => {
    const details = buildDefaultCvDetails(SAMPLE_PROFILE);
    const cv = await generateCv(
      SAMPLE_PROFILE,
      details,
      SAMPLE_TARGET,
      "Impact Hub Harare — Utare Node"
    );

    expect(cv.fullName).toBe("Chipo Nyamande");
    expect(cv.experience.length).toBe(details.workHistory.length);
    expect(cv.experience[0].organization).toBe(
      details.workHistory[0].organization
    );
    expect(cv.education[0].institution).toContain("University of Zimbabwe");

    const plain = cvToPlainText(cv);
    const style = analyzeStyle(plain);
    expect(style.score).toBeGreaterThanOrEqual(90);
    expect(style.flaggedPhrases).toHaveLength(0);

    // Verify .docx Word export produces a valid OOXML zip buffer ("PK")
    const docxBuf = await cvToDocxBuffer(cv);
    expect(docxBuf.byteLength).toBeGreaterThan(2000);
    expect(docxBuf[0]).toBe(0x50); // 'P'
    expect(docxBuf[1]).toBe(0x4b); // 'K'
  });

  it("builds a humanized application letter and exports a valid .docx buffer", async () => {
    const details = buildDefaultCvDetails(SAMPLE_PROFILE);
    const letter = await generateCoverLetter(
      SAMPLE_PROFILE,
      details,
      SAMPLE_TARGET,
      "Impact Hub Harare — Utare Node"
    );

    expect(letter.subject).toContain(SAMPLE_TARGET.title);
    expect(letter.paragraphs.length).toBeGreaterThanOrEqual(3);

    const plain = coverLetterToPlainText(letter);
    expect(plain).toContain("GlobalScale AI Partners");
    const style = analyzeStyle(plain);
    expect(style.score).toBeGreaterThanOrEqual(90);
    expect(style.flaggedPhrases).toHaveLength(0);

    const docxBuf = await coverLetterToDocxBuffer(letter);
    expect(docxBuf.byteLength).toBeGreaterThan(2000);
    expect(docxBuf[0]).toBe(0x50);
    expect(docxBuf[1]).toBe(0x4b);
  });
});
