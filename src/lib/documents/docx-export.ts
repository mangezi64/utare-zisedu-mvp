// =============================================================================
// UTARE ZISEDU AI — Word (.docx) Export
// =============================================================================
// Single-column layout with real text (no tables, images or text boxes) so
// applicant-tracking systems can parse every line.
// =============================================================================

import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from "docx";
import { GeneratedCoverLetter, GeneratedCv } from "@/types";

const FONT = "Calibri";
const ACCENT = "1F4E46"; // deep green, prints well in greyscale
const MUTED = "555555";

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 2 },
    },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: ACCENT, font: FONT }),
    ],
  });
}

function body(text: string, opts: { after?: number; italics?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: opts.after ?? 80, line: 276 },
    children: [new TextRun({ text, size: 21, font: FONT, italics: opts.italics })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40, line: 264 },
    children: [new TextRun({ text, size: 21, font: FONT })],
  });
}

/** Role/organisation on the left, dates right-aligned on the same line. */
function roleLine(left: string, sub: string, right: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: left, bold: true, size: 22, font: FONT }),
      ...(sub ? [new TextRun({ text: ` | ${sub}`, size: 22, font: FONT })] : []),
      ...(right ? [new TextRun({ text: `\t${right}`, size: 20, color: MUTED, font: FONT })] : []),
    ],
  });
}

const PAGE = {
  properties: {
    page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } },
  },
};

export async function cvToDocxBuffer(cv: GeneratedCv): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: cv.fullName, bold: true, size: 40, font: FONT, color: "111111" })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: cv.headline, size: 24, font: FONT, color: ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: cv.contactLine, size: 19, font: FONT, color: MUTED })],
    }),
    sectionHeading("Profile"),
    body(cv.summary),
  ];

  if (cv.coreSkills.length) {
    children.push(sectionHeading("Core Skills"), body(cv.coreSkills.join("  ·  ")));
  }

  if (cv.experience.length) {
    children.push(sectionHeading("Experience"));
    for (const e of cv.experience) {
      const org = e.location ? `${e.organization}, ${e.location}` : e.organization;
      children.push(roleLine(e.role, org, e.dates));
      e.bullets.forEach((b) => children.push(bullet(b)));
    }
  }

  if (cv.projects.length) {
    children.push(sectionHeading("Projects"));
    for (const p of cv.projects) {
      children.push(roleLine(p.name, "", ""));
      p.bullets.forEach((b) => children.push(bullet(b)));
    }
  }

  if (cv.education.length) {
    children.push(sectionHeading("Education"));
    for (const ed of cv.education) {
      children.push(roleLine(ed.qualification, ed.institution, ed.year));
      if (ed.details) children.push(body(ed.details));
    }
  }

  if (cv.certifications.length) {
    children.push(sectionHeading("Certifications"));
    cv.certifications.forEach((c) => children.push(bullet(c)));
  }

  if (cv.languages.length) {
    children.push(sectionHeading("Languages"), body(cv.languages.join("  ·  ")));
  }

  children.push(
    new Paragraph({
      spacing: { before: 240 },
      children: [new TextRun({ text: "References available on request.", size: 19, italics: true, color: MUTED, font: FONT })],
    })
  );

  const doc = new Document({
    creator: "UTARE ZISEDU AI",
    title: `${cv.fullName} CV`,
    sections: [{ ...PAGE, children }],
  });
  return Packer.toBuffer(doc);
}

export async function coverLetterToDocxBuffer(letter: GeneratedCoverLetter): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 20 },
      children: [new TextRun({ text: letter.fullName, bold: true, size: 28, font: FONT })],
    }),
    new Paragraph({
      spacing: { after: 280 },
      children: [new TextRun({ text: letter.contactLine, size: 19, color: MUTED, font: FONT })],
    }),
    body(letter.date, { after: 200 }),
    ...letter.recipient.split("\n").map((line, i, arr) => body(line, { after: i === arr.length - 1 ? 200 : 0 })),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: letter.subject, bold: true, size: 22, font: FONT })],
    }),
    body(letter.greeting, { after: 160 }),
    ...letter.paragraphs.map(
      (p) =>
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 160, line: 288 },
          children: [new TextRun({ text: p, size: 22, font: FONT })],
        })
    ),
    body(letter.signOff, { after: 360 }),
    body(letter.fullName),
  ];

  const doc = new Document({
    creator: "UTARE ZISEDU AI",
    title: `${letter.fullName} Application Letter`,
    sections: [{ ...PAGE, children }],
  });
  return Packer.toBuffer(doc);
}

export function safeFileName(...parts: string[]): string {
  return parts
    .join("_")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
