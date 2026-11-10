// =============================================================================
// UTARE ZISEDU AI — Humanizer & Style Checker
// =============================================================================
// Recruiters bin CVs that read like generic AI output. This module:
//   1. Lists phrases that mark text as machine-written or cliché (BANNED_PHRASES).
//      The same list is injected into model prompts so Gemini avoids them.
//   2. `humanize()` rewrites any that slip through into plain English.
//   3. `analyzeStyle()` scores text so the UI can show how "human" it reads.
// =============================================================================

import { StyleReport } from "@/types";

interface Rule {
  pattern: RegExp;
  replacement: string;
  label: string;
}

// Order matters: longer phrases first so they win over shorter overlaps.
const RULES: Rule[] = [
  { label: "I am writing to express my interest", pattern: /\bI am writing to express my (strong |keen )?interest in\b/gi, replacement: "I'd like to apply for" },
  { label: "I am writing to apply", pattern: /\bI am writing to apply for\b/gi, replacement: "I'd like to apply for" },
  { label: "in today's fast-paced world", pattern: /\bin today'?s (fast-paced|ever-changing|ever-evolving|competitive|digital) (world|landscape|environment|market)\b,?\s*/gi, replacement: "" },
  { label: "proven track record", pattern: /\b(a )?proven track record (of|in)\b/gi, replacement: "experience in" },
  { label: "hit the ground running", pattern: /\bhit the ground running\b/gi, replacement: "start contributing quickly" },
  { label: "think outside the box", pattern: /\bthink(ing)? outside the box\b/gi, replacement: "solve problems creatively" },
  { label: "I am confident that", pattern: /\bI am confident that\b/gi, replacement: "I believe" },
  { label: "I believe I would be a great fit", pattern: /\bI (believe|feel) (that )?I would be (a )?(great|perfect|ideal|excellent) (fit|asset|addition)( for| to)?( your team| your company| the team)?\b/gi, replacement: "I think my experience fits this role" },
  { label: "thank you for considering", pattern: /\bThank you for (your time and )?consideration\b/gi, replacement: "Thank you for reading" },
  { label: "passionate about", pattern: /\b(deeply |truly |highly )?passionate about\b/gi, replacement: "focused on" },
  { label: "results-driven", pattern: /\bresults[- ]driven\s*/gi, replacement: "" },
  { label: "detail-oriented", pattern: /\bdetail[- ]oriented\s*/gi, replacement: "careful " },
  { label: "highly motivated", pattern: /\bhighly[- ]motivated\s*/gi, replacement: "" },
  { label: "self-starter", pattern: /\b(a )?self[- ]starter\b/gi, replacement: "someone who works independently" },
  { label: "team player", pattern: /\b(a )?team player\b/gi, replacement: "someone who works well with others" },
  { label: "go-getter", pattern: /\b(a )?go[- ]getter\b/gi, replacement: "someone who follows through" },
  { label: "dynamic", pattern: /\bdynamic\s+/gi, replacement: "" },
  { label: "cutting-edge", pattern: /\bcutting[- ]edge\b/gi, replacement: "modern" },
  { label: "state-of-the-art", pattern: /\bstate[- ]of[- ]the[- ]art\b/gi, replacement: "modern" },
  { label: "game-changer", pattern: /\bgame[- ]chang(er|ing)\b/gi, replacement: "significant" },
  { label: "synergy", pattern: /\bsynerg(y|ies|istic)\b/gi, replacement: "collaboration" },
  { label: "spearheaded", pattern: /\bspearhead(ed|ing|s)?\b/gi, replacement: "led" },
  { label: "leveraged", pattern: /\bleveraged\b/gi, replacement: "used" },
  { label: "leveraging", pattern: /\bleveraging\b/gi, replacement: "using" },
  { label: "leverage", pattern: /\bleverage\b/gi, replacement: "use" },
  { label: "utilized", pattern: /\butili[sz]ed\b/gi, replacement: "used" },
  { label: "utilizing", pattern: /\butili[sz]ing\b/gi, replacement: "using" },
  { label: "utilize", pattern: /\butili[sz]e\b/gi, replacement: "use" },
  { label: "seamlessly", pattern: /\bseamless(ly)?\s*/gi, replacement: "" },
  { label: "robust", pattern: /\brobust\b/gi, replacement: "reliable" },
  { label: "delve", pattern: /\bdelv(e|ed|ing)( into)?\b/gi, replacement: "look into" },
  { label: "tapestry", pattern: /\b(rich )?tapestry of\b/gi, replacement: "mix of" },
  { label: "testament to", pattern: /\b(a )?testament to\b/gi, replacement: "evidence of" },
  { label: "navigate the complexities", pattern: /\bnavigat(e|ing) the complexities of\b/gi, replacement: "handling" },
  { label: "fostered", pattern: /\bfostered\b/gi, replacement: "built" },
  { label: "fostering", pattern: /\bfostering\b/gi, replacement: "building" },
  { label: "foster", pattern: /\bfoster\b/gi, replacement: "build" },
  { label: "ever-evolving", pattern: /\bever[- ](evolving|changing)\b/gi, replacement: "changing" },
  { label: "unwavering", pattern: /\bunwavering\s*/gi, replacement: "" },
  { label: "esteemed", pattern: /\b(your )?esteemed\s+/gi, replacement: "your " },
  { label: "furthermore", pattern: /\bFurthermore,\s*/g, replacement: "" },
  { label: "moreover", pattern: /\bMoreover,\s*/g, replacement: "" },
  { label: "additionally", pattern: /\bAdditionally,\s*/g, replacement: "" },
];

/** Phrases the model is told to avoid (derived from the rules above). */
export const BANNED_PHRASES: string[] = RULES.map((r) => r.label);

function fixArticles(text: string): string {
  return text.replace(/\b(a|an) ([A-Za-z])/g, (match, article: string, letter: string) => {
    const startsWithVowel = /[aeiou]/i.test(letter);
    const correct = startsWithVowel ? "an" : "a";
    const cased = article[0] === article[0].toUpperCase()
      ? correct[0].toUpperCase() + correct.slice(1)
      : correct;
    return `${cased} ${letter}`;
  });
}

function capitalizeSentences(text: string): string {
  return text
    .replace(/^\s*([a-z])/, (m, c: string) => m.replace(c, c.toUpperCase()))
    .replace(/([.!?]\s+)([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase());
}

/** Rewrites clichés and AI tells into plain English. Safe to run repeatedly. */
export function humanize(input: string): string {
  if (!input) return input;
  let text = input;

  for (const rule of RULES) {
    text = text.replace(rule.pattern, rule.replacement);
  }

  text = text
    // Em-dash overuse is a strong AI tell in prose; keep en-dashes for date ranges.
    .replace(/\s*—\s*/g, ", ")
    .replace(/!+/g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*\./g, ".")
    .replace(/,\s*\./g, ".")
    .trim();

  return capitalizeSentences(fixArticles(text));
}

export function humanizeList(items: string[]): string[] {
  return items.map(humanize).filter((s) => s.length > 0);
}

/** Scores text for how natural it reads. Higher is better. */
export function analyzeStyle(text: string): StyleReport {
  const flagged = new Set<string>();
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) flagged.add(rule.label);
    rule.pattern.lastIndex = 0;
  }

  const emDashes = (text.match(/—/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;

  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 2);
  const wordCounts = sentences.map((s) => s.split(/\s+/).length);
  const avgSentenceLength = wordCounts.length
    ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
    : 0;

  const starters = sentences.map((s) => s.split(/\s+/)[0].toLowerCase());
  const iStarts = starters.filter((w) => w === "i").length;

  const notes: string[] = [];
  let score = 100;

  score -= flagged.size * 8;
  if (flagged.size) notes.push(`Contains ${flagged.size} cliché/AI-style phrase(s).`);

  if (emDashes > 2) {
    score -= 5;
    notes.push("Heavy em-dash use reads as machine-written.");
  }
  if (exclamations > 0) {
    score -= 4;
    notes.push("Avoid exclamation marks in professional documents.");
  }
  if (avgSentenceLength > 28) {
    score -= 8;
    notes.push("Sentences are long; aim for under 25 words.");
  }
  if (sentences.length >= 5 && iStarts / sentences.length > 0.5) {
    score -= 6;
    notes.push('Too many sentences start with "I"; vary the openings.');
  }
  if (!notes.length) notes.push("Reads naturally. No cliché phrases detected.");

  return {
    score: Math.max(0, Math.min(100, score)),
    flaggedPhrases: Array.from(flagged),
    avgSentenceLength,
    notes,
  };
}

/** Shared writing rules injected into every document-generation prompt. */
export const HUMAN_WRITING_GUIDE = `
WRITING STYLE (follow strictly):
- Write like a capable person describing their own work to a hiring manager: plain, specific, confident, not salesy.
- Prefer short sentences (under 22 words). Vary sentence openings.
- Use concrete nouns and strong past-tense verbs (built, ran, fixed, trained, cut, sold, wrote, installed, reconciled, managed).
- Only use numbers, tools, employers, dates and results that appear in the candidate facts. NEVER invent metrics, clients, awards or employers.
- If a fact is missing, write around it honestly rather than guessing.
- No buzzwords, no hype, no exclamation marks, no em-dashes.
- Never use any of these phrases: ${BANNED_PHRASES.map((p) => `"${p}"`).join(", ")}.
- British/Commonwealth spelling (organise, programme, labour) to match Zimbabwean professional norms.
`.trim();
