// =============================================================================
// UTARE ZISEDU AI — CV Writer
// =============================================================================
// Builds an ATS-friendly CV for a specific target role.
//
// Integrity rule: structural facts (employers, roles, dates, institutions,
// qualifications) are ALWAYS copied from the candidate's input. The model is
// only allowed to write the headline, summary, skills ordering and bullet
// wording. That makes fabricated jobs or degrees impossible by construction.
// =============================================================================

import { Type } from "@google/genai";
import {
  CandidateProfile,
  CvSourceDetails,
  GeneratedCv,
  TargetRole,
} from "@/types";
import { generateJson } from "@/lib/gemini/client";
import { HUMAN_WRITING_GUIDE, humanize, humanizeList } from "./humanizer";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function buildContactLine(
  profile: CandidateProfile,
  details?: Pick<CvSourceDetails, "linkedinOrPortfolio">
): string {
  return [
    `${profile.city}, Zimbabwe`,
    profile.phone,
    profile.email,
    details?.linkedinOrPortfolio,
  ]
    .filter(Boolean)
    .join(" · ");
}

const DEGREE_LEVELS = new Set([
  "Masters Degree",
  "Bachelors Degree",
  "HND / Higher National Diploma",
  "National Diploma (ND) / TVET / Polytech",
]);

/** Turns free-text notes ("I did X; handled Y") into clean CV bullets. */
export function notesToBullets(notes: string, max = 5): string[] {
  return notes
    .split(/\n|;|(?<=\.)\s+/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-•*·]\s*/, "")
        .replace(/^I was responsible for\s+/i, "Responsible for ")
        .replace(/^I (am|was)\s+/i, "")
        .replace(/^I\s+/i, "")
        .replace(/\.$/, "")
        .trim()
    )
    .filter((line) => line.split(/\s+/).length >= 2)
    .map((line) => line.charAt(0).toUpperCase() + line.slice(1))
    .slice(0, max);
}

/** Orders the candidate's own skills so ones relevant to the target come first. */
export function rankSkills(
  skills: string[],
  target: TargetRole,
  max = 10
): string[] {
  const targetText = `${target.title} ${target.description} ${target.requiredSkills.join(" ")}`.toLowerCase();
  const scored = Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean))).map(
    (skill) => {
      const words = skill.toLowerCase().split(/[\s/&,]+/).filter((w) => w.length > 2);
      const hits = words.filter((w) => targetText.includes(w)).length;
      return { skill, hits };
    }
  );
  return scored
    .sort((a, b) => b.hits - a.hits)
    .map((s) => s.skill)
    .slice(0, max);
}

/** True when a skill is evidenced somewhere in what the candidate told us. */
function isEvidenced(skill: string, corpus: string): boolean {
  const words = skill.toLowerCase().split(/[\s/&,()-]+/).filter((w) => w.length > 2);
  if (!words.length) return false;
  return words.some((w) => corpus.includes(w));
}

function candidateCorpus(profile: CandidateProfile, details: CvSourceDetails): string {
  return [
    profile.fieldOfStudy,
    profile.currentSkills.join(" "),
    details.aboutMe,
    details.headline,
    ...details.workHistory.map((w) => `${w.role} ${w.notes}`),
    ...details.projects.map((p) => `${p.name} ${p.notes}`),
    ...details.certifications,
    ...details.education.map((e) => `${e.qualification} ${e.details || ""}`),
  ]
    .join(" ")
    .toLowerCase();
}

function formatDates(start: string, end: string): string {
  if (!start && !end) return "";
  if (!end) return start;
  return `${start} – ${end}`;
}

// ---------------------------------------------------------------------------
// Built-in writer (no API key needed)
// ---------------------------------------------------------------------------

function fallbackHeadline(profile: CandidateProfile, details: CvSourceDetails, target: TargetRole): string {
  if (details.headline?.trim()) return details.headline.trim();
  const top = rankSkills(profile.currentSkills, target, 2);
  return [profile.fieldOfStudy, ...top].filter(Boolean).join(" | ");
}

function fallbackSummary(
  profile: CandidateProfile,
  details: CvSourceDetails,
  target: TargetRole,
  hubName?: string
): string {
  const parts: string[] = [];
  const latest = details.workHistory[0];
  const topSkills = rankSkills(profile.currentSkills, target, 3);

  if (DEGREE_LEVELS.has(profile.highestQualification)) {
    parts.push(`${profile.fieldOfStudy} graduate (${profile.highestQualification}) based in ${profile.city}, Zimbabwe.`);
  } else if (profile.highestQualification.startsWith("Vocational")) {
    parts.push(`Qualified tradesperson in ${profile.fieldOfStudy}, based in ${profile.city}, Zimbabwe.`);
  } else if (profile.highestQualification.startsWith("Self-Taught")) {
    parts.push(`Self-taught in ${profile.fieldOfStudy}, based in ${profile.city}, Zimbabwe.`);
  } else {
    parts.push(`${profile.highestQualification} from ${profile.city}, Zimbabwe, building practical skills in ${profile.fieldOfStudy}.`);
  }

  if (latest) {
    parts.push(`Most recently worked as ${latest.role} at ${latest.organization}.`);
  } else if (profile.yearsExperience > 0) {
    parts.push(`${profile.yearsExperience} year${profile.yearsExperience === 1 ? "" : "s"} of hands-on work in the field.`);
  }

  if (topSkills.length) {
    const list =
      topSkills.length === 1
        ? topSkills[0]
        : `${topSkills.slice(0, -1).join(", ")} and ${topSkills[topSkills.length - 1]}`;
    parts.push(`Strongest in ${list}.`);
  }

  parts.push(`Applying for the ${target.title} role at ${target.company}.`);

  if (hubName && /remote|async|online|virtual|freelance/i.test(`${target.title} ${target.description}`)) {
    parts.push(`Works on Central Africa Time (GMT+2) from ${hubName}, which has backup power and fibre/Starlink internet.`);
  }

  return parts.join(" ");
}

export function buildFallbackCv(
  profile: CandidateProfile,
  details: CvSourceDetails,
  target: TargetRole,
  hubName?: string
): GeneratedCv {
  return {
    fullName: profile.fullName,
    headline: humanize(fallbackHeadline(profile, details, target)),
    contactLine: buildContactLine(profile, details),
    summary: humanize(fallbackSummary(profile, details, target, hubName)),
    coreSkills: rankSkills(profile.currentSkills, target),
    experience: details.workHistory.map((w) => ({
      role: w.role,
      organization: w.organization,
      location: w.location,
      dates: formatDates(w.startDate, w.endDate),
      bullets: humanizeList(notesToBullets(w.notes)),
    })),
    projects: details.projects.map((p) => ({
      name: p.name,
      bullets: humanizeList(notesToBullets(p.notes, 3)),
    })),
    education: details.education.map((e) => ({ ...e })),
    certifications: [...details.certifications],
    languages: [...details.languages],
    generatedBy: "utare-deterministic-engine",
  };
}

// ---------------------------------------------------------------------------
// Live Gemini writer
// ---------------------------------------------------------------------------

const CV_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    summary: { type: Type.STRING },
    coreSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["index", "bullets"],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["index", "bullets"],
      },
    },
  },
  required: ["headline", "summary", "coreSkills", "experience", "projects"],
};

interface AiCvDraft {
  headline: string;
  summary: string;
  coreSkills: string[];
  experience: { index: number; bullets: string[] }[];
  projects: { index: number; bullets: string[] }[];
}

const CV_SYSTEM_INSTRUCTION = `
You are an experienced CV editor who helps Zimbabwean job seekers apply for local and international roles.
You rewrite the candidate's own notes into a clear, credible, ATS-friendly CV tailored to one target role.

${HUMAN_WRITING_GUIDE}

CV RULES:
- headline: 4 to 10 words describing what the person does. No adjectives like "passionate" or "dynamic".
- summary: 2 to 4 sentences, written without "I" (implied first person). Mention qualification, most relevant experience, 2 or 3 strongest skills and the target role. Mention location/time zone only if the role is remote.
- coreSkills: 6 to 10 items, taken ONLY from skills the candidate listed or clearly demonstrated in their notes. Put skills that match the target role first. Short labels, no sentences.
- experience: one object per work history entry, using the same zero-based "index". 3 to 5 bullets each. Each bullet starts with a past-tense verb (present tense for a current role), is under 22 words, and is grounded in the notes for that entry. Vary the opening verbs.
- projects: one object per project with the same zero-based "index", 1 to 3 bullets each.
- Do not add employers, dates, qualifications, certifications, numbers or tools that are not in the facts.
`.trim();

export async function generateCv(
  profile: CandidateProfile,
  details: CvSourceDetails,
  target: TargetRole,
  hubName?: string
): Promise<GeneratedCv> {
  const fallback = buildFallbackCv(profile, details, target, hubName);

  const facts = {
    name: profile.fullName,
    location: `${profile.city}, Zimbabwe (GMT+2)`,
    highestQualification: profile.highestQualification,
    fieldOfStudy: profile.fieldOfStudy,
    yearsExperience: profile.yearsExperience,
    currentSituation: profile.employmentStatus,
    listedSkills: profile.currentSkills,
    aboutMe: details.aboutMe || "",
    preferredHeadline: details.headline || "",
    workHistory: details.workHistory.map((w, index) => ({
      index,
      role: w.role,
      organization: w.organization,
      dates: formatDates(w.startDate, w.endDate),
      notes: w.notes,
    })),
    projects: details.projects.map((p, index) => ({ index, name: p.name, notes: p.notes })),
    education: details.education,
    certifications: details.certifications,
    workspace: hubName ? `${hubName} (backup power, fibre/Starlink internet)` : "",
  };

  const draft = await generateJson<AiCvDraft>({
    label: "cv",
    systemInstruction: CV_SYSTEM_INSTRUCTION,
    schema: CV_SCHEMA,
    temperature: 0.6,
    prompt: `TARGET ROLE\nTitle: ${target.title}\nCompany: ${target.company}\nDescription: ${target.description}\nKey skills wanted: ${target.requiredSkills.join(", ")}\n\nCANDIDATE FACTS (the only source of truth)\n${JSON.stringify(facts, null, 2)}\n\nWrite the CV content now.`,
  });

  if (!draft) return fallback;

  const corpus = candidateCorpus(profile, details);
  const aiSkills = (draft.coreSkills || [])
    .map((s) => s.trim())
    .filter((s) => s && isEvidenced(s, corpus))
    .slice(0, 10);

  return {
    ...fallback,
    headline: humanize(draft.headline || fallback.headline),
    summary: humanize(draft.summary || fallback.summary),
    coreSkills: aiSkills.length >= 3 ? aiSkills : fallback.coreSkills,
    experience: fallback.experience.map((entry, i) => {
      const ai = draft.experience?.find((e) => e.index === i);
      const bullets = ai?.bullets?.length ? humanizeList(ai.bullets).slice(0, 5) : entry.bullets;
      return { ...entry, bullets };
    }),
    projects: fallback.projects.map((entry, i) => {
      const ai = draft.projects?.find((p) => p.index === i);
      const bullets = ai?.bullets?.length ? humanizeList(ai.bullets).slice(0, 3) : entry.bullets;
      return { ...entry, bullets };
    }),
    generatedBy: "gemini-live",
  };
}

/** Flattens a CV into one string for style analysis and plain-text export. */
export function cvToPlainText(cv: GeneratedCv): string {
  const lines: string[] = [cv.fullName.toUpperCase(), cv.headline, cv.contactLine, ""];
  lines.push("PROFILE", cv.summary, "");
  if (cv.coreSkills.length) lines.push("CORE SKILLS", cv.coreSkills.join(" · "), "");
  if (cv.experience.length) {
    lines.push("EXPERIENCE");
    for (const e of cv.experience) {
      lines.push(`${e.role} | ${e.organization}${e.location ? `, ${e.location}` : ""}${e.dates ? ` | ${e.dates}` : ""}`);
      e.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    }
  }
  if (cv.projects.length) {
    lines.push("PROJECTS");
    for (const p of cv.projects) {
      lines.push(p.name);
      p.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    }
  }
  if (cv.education.length) {
    lines.push("EDUCATION");
    cv.education.forEach((e) =>
      lines.push(`${e.qualification}, ${e.institution}${e.year ? ` (${e.year})` : ""}${e.details ? `. ${e.details}` : ""}`)
    );
    lines.push("");
  }
  if (cv.certifications.length) lines.push("CERTIFICATIONS", ...cv.certifications.map((c) => `- ${c}`), "");
  if (cv.languages.length) lines.push("LANGUAGES", cv.languages.join(" · "), "");
  lines.push("References available on request.");
  return lines.join("\n");
}
