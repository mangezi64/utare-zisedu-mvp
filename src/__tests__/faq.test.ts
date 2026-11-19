import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  FaqCategoryId,
  filterFaqItems,
  getJourneyFaqsForPath,
} from "@/lib/faq-data";

const PROJECT_ROOT = process.cwd();

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf-8");
}

const VALID_APP_ROUTES = new Set([
  "/",
  "/login",
  "/account",
  "/assessment",
  "/pathway",
  "/jobs",
  "/opportunities",
  "/skills",
  "/hubs",
  "/employers",
  "/employer",
  "/data-policy",
  "/contact",
  "/how-it-works",
  "/about",
  "/faq",
]);

describe("Frequently Asked Questions (FAQ) Data, Filtering & Web App Integration", () => {
  it("defines all 7 expected categories and valid FAQ items with unique IDs and valid internal links", () => {
    const expectedCategoryIds: FaqCategoryId[] = [
      "login-accounts",
      "diagnostic-pathway",
      "cv-applications",
      "hubs-payments",
      "safety-privacy",
      "employers",
      "accessibility-navigation",
    ];

    expect(FAQ_CATEGORIES.map((c) => c.id)).toEqual(expectedCategoryIds);
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(20);

    const categorySet = new Set(FAQ_CATEGORIES.map((c) => c.id));
    const seenIds = new Set<string>();

    for (const item of FAQ_ITEMS) {
      expect(item.id.trim().length).toBeGreaterThan(0);
      expect(seenIds.has(item.id)).toBe(false);
      seenIds.add(item.id);

      expect(categorySet.has(item.category)).toBe(true);
      expect(item.question.trim().length).toBeGreaterThan(5);
      expect(item.answer.length).toBeGreaterThan(0);
      for (const paragraph of item.answer) {
        expect(paragraph.trim().length).toBeGreaterThan(0);
      }

      if (item.links) {
        for (const link of item.links) {
          const basePath = link.href.split("?")[0].split("#")[0];
          expect(VALID_APP_ROUTES.has(basePath)).toBe(true);
        }
      }
    }
  });

  it("filters accurately by category, keyword search, and combined category + query", () => {
    const allItems = filterFaqItems(FAQ_ITEMS, "all", "");
    expect(allItems.length).toBe(FAQ_ITEMS.length);

    const loginItems = filterFaqItems(FAQ_ITEMS, "login-accounts", "");
    expect(loginItems.length).toBeGreaterThanOrEqual(5);
    expect(loginItems.every((i) => i.category === "login-accounts")).toBe(true);

    const sampleKeywords = [
      "password",
      "verification",
      "resend",
      "POTRAZ",
      "delete",
      "scam",
      "Deel",
      "load-shedding",
      "audio",
      "Bheki",
      "Stewart",
    ];
    for (const kw of sampleKeywords) {
      const hits = filterFaqItems(FAQ_ITEMS, "all", kw);
      expect(hits.length).toBeGreaterThan(0);
    }

    const combined = filterFaqItems(FAQ_ITEMS, "safety-privacy", "POTRAZ");
    expect(combined.length).toBeGreaterThan(0);
    expect(combined.every((i) => i.category === "safety-privacy")).toBe(true);

    const noMatches = filterFaqItems(FAQ_ITEMS, "all", "zzzz-nonexistent-query-xyz");
    expect(noMatches).toEqual([]);
  });

  it("covers key feedback iterations and login/safety/UX topics", () => {
    const fullText = FAQ_ITEMS.map((item) =>
      [
        item.question,
        ...item.answer,
        ...(item.bullets || []),
        ...item.keywords,
      ].join(" ")
    )
      .join("\n")
      .toLowerCase();

    expect(fullText).toContain("resend");
    expect(fullText).toContain("disposable");
    expect(fullText).toContain("8 characters");
    expect(fullText).toContain("forgot password");
    expect(fullText).toContain("6 sliders");
    expect(fullText).toContain("market-ready");
    expect(fullText).toContain("bheki ndlovu");
    expect(fullText).toContain("stewart mangezi");
    expect(fullText).toContain("anti-ai-slop");
    expect(fullText).toContain("versioned credential vault");
    expect(fullText).toContain("include my profile photo");
    expect(fullText).toContain("report listing");
    expect(fullText).toContain("chapter 12:07");
    expect(fullText).toContain("365 days");
    expect(fullText).toContain("3 reminder emails");
    expect(fullText).toContain("audio overview");
    expect(fullText).toContain("flow demo");
  });

  it("exposes /faq route with Suspense boundary and cross-links across key web app surfaces", () => {
    const faqPagePath = path.join(PROJECT_ROOT, "src/app/faq/page.tsx");
    expect(fs.existsSync(faqPagePath)).toBe(true);
    const faqPage = readProjectFile("src/app/faq/page.tsx");
    expect(faqPage).toContain("Suspense");
    expect(faqPage).toContain("FaqExplorer");

    const layout = readProjectFile("src/app/layout.tsx");
    expect(layout).toContain('href="/faq"');

    const navbar = readProjectFile("src/components/Navbar.tsx");
    expect(navbar).toContain('href="/faq"');

    const loginPage = readProjectFile("src/app/login/page.tsx");
    expect(loginPage).toContain('href="/faq?category=login-accounts"');

    const howItWorks = readProjectFile("src/app/how-it-works/page.tsx");
    expect(howItWorks).toContain('href="/faq"');

    const contactPage = readProjectFile("src/app/contact/page.tsx");
    expect(contactPage).toContain('href="/faq"');
  });

  it("provides route-aware bottom journey FAQs across user journey pages while hiding duplicate strip on /faq", () => {
    expect(getJourneyFaqsForPath("/faq")).toBeNull();
    expect(getJourneyFaqsForPath("/faq/")).toBeNull();

    const routeExpectations: Array<{ path: string; expectedHref: string }> = [
      { path: "/", expectedHref: "/faq" },
      { path: "/login", expectedHref: "/faq?category=login-accounts" },
      { path: "/assessment", expectedHref: "/faq?category=diagnostic-pathway" },
      { path: "/pathway", expectedHref: "/faq?category=diagnostic-pathway" },
      { path: "/jobs", expectedHref: "/faq?category=cv-applications" },
      { path: "/account", expectedHref: "/faq?category=cv-applications" },
      { path: "/hubs", expectedHref: "/faq?category=hubs-payments" },
      { path: "/employer", expectedHref: "/faq?category=employers" },
      { path: "/data-policy", expectedHref: "/faq?category=safety-privacy" },
      { path: "/contact", expectedHref: "/faq?category=safety-privacy" },
    ];

    for (const { path: routePath, expectedHref } of routeExpectations) {
      const group = getJourneyFaqsForPath(routePath);
      expect(group).not.toBeNull();
      expect(group!.categoryHref).toBe(expectedHref);
      expect(group!.items.length).toBeGreaterThan(0);
    }

    const layout = readProjectFile("src/app/layout.tsx");
    const stripIndex = layout.indexOf("<JourneyFaqStrip />");
    const footerIndex = layout.indexOf("<footer");
    expect(stripIndex).toBeGreaterThan(-1);
    expect(footerIndex).toBeGreaterThan(stripIndex);
    expect(layout).toContain("Frequently Asked Questions (FAQ)");

    const stripComponent = readProjectFile("src/components/JourneyFaqStrip.tsx");
    expect(stripComponent).toContain("no-print");
    expect(stripComponent).toContain("getJourneyFaqsForPath");

    const assistiveToolbar = readProjectFile("src/components/AssistiveToolbar.tsx");
    expect(assistiveToolbar).toContain('href="/faq"');
    expect(assistiveToolbar).toContain("Quick Answers (FAQ)");
  });
});
