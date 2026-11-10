// =============================================================================
// UTARE ZISEDU AI — Application (Cover) Letter Writer
// =============================================================================
// Produces a short, specific letter (about 220–320 words) that sounds like a
// real person: one concrete reason for applying, one or two pieces of evidence
// from the candidate's actual history, and a plain close.
// =============================================================================

import { Type } from "@google/genai";
import {
  CandidateProfile,
  CvSourceDetails,
  GeneratedCoverLetter,
  TargetRole,
} from "@/types";
import { generateJson } from "@/lib/gemini/client";
import { HUMAN_WRITING_GUIDE, humanize, humanizeList } from "./humanizer";
import { buildContactLine, notesToBullets, rankSkills } from "./cv-writer";

export function formatLetterDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function lowerFirst(s: string): string {
  if (!s) return s;
  const lowered = s.charAt(0).toLowerCase() + s.slice(1);
  // "Responsible for X" must read "I was responsible for X" inside a sentence.
  return /^responsible for\b/.test(lowered) ? `was ${lowered}` : lowered;
}

// ---------------------------------------------------------------------------
// Built-in writer
// ---------------------------------------------------------------------------

export function buildFallbackCoverLetter(
  profile: CandidateProfile,
  details: CvSourceDetails,
  target: TargetRole,
  hubName?: string
): GeneratedCoverLetter {
  const latest = details.workHistory[0];
  const evidence = latest ? notesToBullets(latest.notes, 2) : [];
  const project = details.projects[0];
  const projectEvidence = project ? notesToBullets(project.notes, 1)[0] : undefined;
  const matching = rankSkills(profile.currentSkills, target, 3);
  const isRemote = /remote|async|online|virtual|freelance/i.test(
    `${target.title} ${target.description}`
  );

  const p1 = `I'd like to apply for the ${target.title} role at ${target.company}. I trained in ${profile.fieldOfStudy} (${profile.highestQualification}), and the work described in your listing is close to what I already do day to day.`;

  let p2: string;
  if (latest && evidence.length) {
    const second = evidence[1] ? ` I also ${lowerFirst(evidence[1])}.` : "";
    p2 = `As ${latest.role} at ${latest.organization}, I ${lowerFirst(evidence[0])}.${second} That experience taught me to work carefully, keep good records and deliver on time.`;
  } else if (project && projectEvidence) {
    p2 = `In a recent project, ${project.name}, I ${lowerFirst(projectEvidence)}. It gave me practical, hands-on experience that I can bring straight into this role.`;
  } else {
    p2 = `My training gave me a solid base in ${profile.fieldOfStudy}, and I have kept building practical skills on my own since then.`;
  }

  const skillsSentence = matching.length
    ? `The skills I would use most in this role are ${matching.length > 1 ? `${matching.slice(0, -1).join(", ")} and ${matching[matching.length - 1]}` : matching[0]}.`
    : "";
  const setupSentence =
    isRemote && hubName
      ? ` I work from ${hubName} in ${profile.city}, which has backup power and reliable internet, and I'm on Central Africa Time (GMT+2), which overlaps well with European working hours.`
      : "";
  const p3 = `${skillsSentence}${setupSentence}`.trim();

  const p4 = `I've attached my CV with more detail. I would welcome a short call to talk about how I could help ${target.company}, and I can start a trial task if that is useful.`;

  return {
    fullName: profile.fullName,
    contactLine: buildContactLine(profile, details),
    date: formatLetterDate(),
    recipient: `Hiring Team\n${target.company}`,
    subject: `Application: ${target.title}`,
    greeting: "Dear Hiring Team,",
    paragraphs: humanizeList([p1, p2, p3, p4].filter(Boolean)),
    signOff: "Kind regards,",
    generatedBy: "utare-deterministic-engine",
  };
}

// ---------------------------------------------------------------------------
// Live Gemini writer
// ---------------------------------------------------------------------------

const LETTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    greeting: { type: Type.STRING },
    paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
    signOff: { type: Type.STRING },
  },
  required: ["subject", "greeting", "paragraphs", "signOff"],
};

interface AiLetterDraft {
  subject: string;
  greeting: string;
  paragraphs: string[];
  signOff: string;
}

const LETTER_SYSTEM_INSTRUCTION = `
You write job application letters for Zimbabwean candidates applying to local and international employers.
The letter must sound like the candidate wrote it themselves on a good day: warm, direct and specific.

${HUMAN_WRITING_GUIDE}

LETTER RULES:
- 3 or 4 paragraphs, 220 to 320 words total. First person.
- Paragraph 1: name the role and give ONE specific, believable reason this candidate fits (from their facts). Do not open with "I am writing to".
- Paragraph 2: one or two concrete examples from their work history or projects, told plainly. Only facts provided.
- Paragraph 3: connect their skills to what the employer asked for. If the role is remote, mention the time zone and workspace in one sentence, no more.
- Final paragraph: short, polite close offering a call or trial task. No begging, no "I look forward to hearing from you at your earliest convenience".
- subject: "Application: <role title>".
- greeting: "Dear Hiring Team," unless a named person is provided.
- signOff: "Kind regards,".
`.trim();

export async function generateCoverLetter(
  profile: CandidateProfile,
  details: CvSourceDetails,
  target: TargetRole,
  hubName?: string
): Promise<GeneratedCoverLetter> {
  const fallback = buildFallbackCoverLetter(profile, details, target, hubName);

  const facts = {
    name: profile.fullName,
    location: `${profile.city}, Zimbabwe (GMT+2)`,
    highestQualification: profile.highestQualification,
    fieldOfStudy: profile.fieldOfStudy,
    yearsExperience: profile.yearsExperience,
    listedSkills: profile.currentSkills,
    aboutMe: details.aboutMe || "",
    workHistory: details.workHistory.map((w) => ({
      role: w.role,
      organization: w.organization,
      dates: `${w.startDate} – ${w.endDate}`,
      notes: w.notes,
    })),
    projects: details.projects,
    education: details.education,
    certifications: details.certifications,
    workspace: hubName ? `${hubName} (backup power, reliable internet)` : "",
  };

  const draft = await generateJson<AiLetterDraft>({
    label: "cover-letter",
    systemInstruction: LETTER_SYSTEM_INSTRUCTION,
    schema: LETTER_SCHEMA,
    temperature: 0.75,
    prompt: `TARGET ROLE\nTitle: ${target.title}\nCompany: ${target.company}\nDescription: ${target.description}\nKey skills wanted: ${target.requiredSkills.join(", ")}\n\nCANDIDATE FACTS (the only source of truth)\n${JSON.stringify(facts, null, 2)}\n\nWrite the letter now.`,
  });

  if (!draft?.paragraphs?.length) return fallback;

  return {
    ...fallback,
    subject: humanize(draft.subject || fallback.subject),
    greeting: draft.greeting?.trim() || fallback.greeting,
    paragraphs: humanizeList(draft.paragraphs).slice(0, 5),
    signOff: draft.signOff?.trim() || fallback.signOff,
    generatedBy: "gemini-live",
  };
}

export function coverLetterToPlainText(letter: GeneratedCoverLetter): string {
  return [
    letter.fullName,
    letter.contactLine,
    "",
    letter.date,
    "",
    letter.recipient,
    "",
    letter.subject,
    "",
    letter.greeting,
    "",
    ...letter.paragraphs.flatMap((p) => [p, ""]),
    letter.signOff,
    letter.fullName,
  ].join("\n");
}
