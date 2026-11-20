import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { LANGUAGE_OPTIONS } from "@/lib/language-context";
import { AUDIO_CHAPTERS_BY_LANG } from "@/components/AudioExplainer";
import { FAQ_ITEMS, filterFaqItems } from "@/lib/faq-data";

const PROJECT_ROOT = process.cwd();

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf-8");
}

describe("Feedback 2: Mobile/Low-Data Resilience, Shona/Ndebele & Screen-Reader Inclusion", () => {
  it("provides English, ChiShona, and isiNdebele language options and audio chapters", () => {
    expect(LANGUAGE_OPTIONS.map((o) => o.code)).toEqual(["en", "sn", "nd"]);
    expect(AUDIO_CHAPTERS_BY_LANG.en.length).toBe(4);
    expect(AUDIO_CHAPTERS_BY_LANG.sn.length).toBe(4);
    expect(AUDIO_CHAPTERS_BY_LANG.nd.length).toBe(4);
  });

  it("highlights mobile, low-data, offline/power-cut resilience, and inclusion up front on the homepage", () => {
    const home = readProjectFile("src/components/HomePageContent.tsx");
    const langCtx = readProjectFile("src/lib/language-context.tsx");

    expect(home).toContain("t.hero.mobileBadgeTitle");
    expect(home).toContain("t.hero.offlineBadgeTitle");
    expect(home).toContain("t.hero.inclusionBadgeTitle");

    expect(langCtx).toContain("Works on any phone & low data");
    expect(langCtx).toContain("Power or data cuts out? Progress is saved");
    expect(langCtx).toContain("NVDA, JAWS, VoiceOver, TalkBack");
    expect(langCtx).toContain("ChiShona");
    expect(langCtx).toContain("isiNdebele");
  });

  it("auto-saves assessment drafts locally and mounts NetworkStatusBanner in layout", () => {
    const assessment = readProjectFile("src/app/assessment/page.tsx");
    const layout = readProjectFile("src/app/layout.tsx");

    expect(assessment).toContain("utare_assessment_draft_v1");
    expect(assessment).toContain("Draft Saved on Device");
    expect(layout).toContain("NetworkStatusBanner");
    expect(layout).toContain("LanguageProvider");
  });

  it("includes Shona, Ndebele, screen-reader, and low-data/offline coverage in FAQ", () => {
    for (const kw of ["shona", "ndebele", "nvda", "talkback", "offline"]) {
      const hits = filterFaqItems(FAQ_ITEMS, "all", kw);
      expect(hits.length).toBeGreaterThan(0);
    }
  });
});
