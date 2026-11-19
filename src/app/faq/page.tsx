import { Suspense } from "react";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import FaqExplorer from "@/components/FaqExplorer";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | UTARE ZEM AI",
  description:
    "Answers to common questions about signing in, email verification, passwords, AI readiness tiers, grounded CV Studio, solar Partner Hubs, anti-scam protection, and Zimbabwe Data Policy compliance.",
};

export default function FaqPage() {
  return (
    <div className="w-full min-h-screen">
      <PageBreadcrumb current="FAQ" />

      <section className="page-hero">
        <span className="eyebrow">FREQUENTLY ASKED QUESTIONS · HELP CENTER</span>
        <h1>Clear answers on accounts, safety &amp; getting started.</h1>
        <p>
          Everything you need to know about login, email confirmation, password
          rules, AI career pathways, CV Studio, solar Partner Hubs, employer
          portals, and data protection across UTARE ZEM AI.
        </p>
      </section>

      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-700 animate-spin" />
            <span>Loading frequently asked questions...</span>
          </div>
        }
      >
        <FaqExplorer />
      </Suspense>
    </div>
  );
}
