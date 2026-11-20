"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  FaqCategoryId,
  filterFaqItems,
} from "@/lib/faq-data";

const CATEGORY_MAP = new Map(FAQ_CATEGORIES.map((c) => [c.id, c]));

export default function FaqExplorer() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");
  const validInitialCategory: FaqCategoryId | "all" =
    initialCategoryParam &&
    CATEGORY_MAP.has(initialCategoryParam as FaqCategoryId)
      ? (initialCategoryParam as FaqCategoryId)
      : "all";

  const [selectedCategory, setSelectedCategory] = useState<
    FaqCategoryId | "all"
  >(validInitialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set([FAQ_ITEMS[0]?.id].filter(Boolean))
  );

  // Sync category when ?category=... query param changes
  useEffect(() => {
    const param = searchParams.get("category");
    if (param && CATEGORY_MAP.has(param as FaqCategoryId)) {
      const cat = param as FaqCategoryId;
      setSelectedCategory(cat);
      const firstInCat = FAQ_ITEMS.find((item) => item.category === cat);
      if (firstInCat) {
        setOpenIds((prev) => new Set(prev).add(firstInCat.id));
      }
    }
  }, [searchParams]);

  // Open & scroll to item if URL hash targets a specific FAQ id
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hashId = window.location.hash.replace(/^#/, "").trim();
    if (!hashId) return;
    const matched = FAQ_ITEMS.find((item) => item.id === hashId);
    if (!matched) return;

    setSelectedCategory("all");
    setOpenIds((prev) => new Set(prev).add(matched.id));

    const timer = setTimeout(() => {
      document.getElementById(matched.id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);

    return () => clearTimeout(timer);
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FAQ_ITEMS.length };
    for (const cat of FAQ_CATEGORIES) {
      counts[cat.id] = FAQ_ITEMS.filter(
        (item) => item.category === cat.id
      ).length;
    }
    return counts;
  }, []);

  const filteredItems = useMemo(
    () => filterFaqItems(FAQ_ITEMS, selectedCategory, searchQuery),
    [selectedCategory, searchQuery]
  );

  const allFilteredOpen =
    filteredItems.length > 0 &&
    filteredItems.every((item) => openIds.has(item.id));

  function toggleItem(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleAll() {
    if (allFilteredOpen) {
      setOpenIds((prev) => {
        const next = new Set(prev);
        for (const item of filteredItems) {
          next.delete(item.id);
        }
        return next;
      });
    } else {
      setOpenIds((prev) => {
        const next = new Set(prev);
        for (const item of filteredItems) {
          next.add(item.id);
        }
        return next;
      });
    }
  }

  function handleResetFilters() {
    setSelectedCategory("all");
    setSearchQuery("");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Search & Filter Controls */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answers (e.g. verification, password, hub, Deel, delete, scam, audio)..."
              aria-label="Search frequently asked questions"
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear FAQ search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleAll}
            disabled={filteredItems.length === 0}
            className="min-h-[46px] shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50/50 disabled:opacity-40 transition"
          >
            {allFilteredOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        {/* Category Filter Pills */}
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter FAQs by category"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition min-h-[38px] ${
              selectedCategory === "all"
                ? "bg-emerald-700 text-white shadow-sm"
                : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60"
            }`}
          >
            <span>All Topics</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.72rem] font-bold ${
                selectedCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          {FAQ_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition min-h-[38px] ${
                  active
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.72rem] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Showing{" "}
            <strong className="text-slate-900">{filteredItems.length}</strong>{" "}
            of <strong className="text-slate-900">{FAQ_ITEMS.length}</strong>{" "}
            questions
            {selectedCategory !== "all" && (
              <>
                {" "}
                in{" "}
                <strong className="text-emerald-800">
                  {CATEGORY_MAP.get(selectedCategory)?.label}
                </strong>
              </>
            )}
          </span>
          {(selectedCategory !== "all" || searchQuery.trim() !== "") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Reset search &amp; filters
            </button>
          )}
        </div>
      </div>

      {/* Accordion List or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              No matching questions found
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Try searching with a broader keyword (such as &ldquo;login&rdquo;,
              &ldquo;password&rdquo;, &ldquo;hub&rdquo;, or &ldquo;privacy&rdquo;)
              or reset your filters to view all {FAQ_ITEMS.length} questions.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="button button-green"
            >
              Reset Search &amp; Filters
            </button>
            <Link href="/contact" className="button">
              Ask Our Team Directly
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isOpen = openIds.has(item.id);
            const categoryInfo = CATEGORY_MAP.get(item.category);
            const panelId = `faq-panel-${item.id}`;
            return (
              <article
                key={item.id}
                id={item.id}
                className={`rounded-2xl border bg-white transition-shadow ${
                  isOpen
                    ? "border-emerald-300 shadow-md"
                    : "border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <h2 className="m-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-2xl"
                  >
                    <div className="space-y-1.5 min-w-0">
                      {categoryInfo && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[0.75rem] font-bold uppercase tracking-wide text-emerald-800">
                          {categoryInfo.label}
                        </span>
                      )}
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {item.question}
                      </div>
                    </div>
                    <span
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-transform ${
                        isOpen
                          ? "rotate-180 border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                </h2>

                {isOpen && (
                  <div
                    id={panelId}
                    className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 space-y-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed"
                  >
                    <div className="pt-3 space-y-2.5">
                      {item.answer.map((paragraph, idx) => (
                        <p key={idx} className="m-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {item.bullets && item.bullets.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-[0.9rem] text-slate-700">
                        {item.bullets.map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}

                    {item.links && item.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {item.links.map((link) => (
                          <Link
                            key={`${item.id}-${link.href}`}
                            href={link.href}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Still Have a Question? Support Card */}
      <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-bold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              DIRECT SUPPORT &amp; ACCOUNTABILITY
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white m-0">
              Still have a question or need human review?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
              Reach out to our team for onboarding help, safety/scam reports,
              special-circumstance account erasure (<strong>Stewart Mangezi</strong>
              ), or human appeals on AI readiness decisions (<strong>Bheki Ndlovu</strong>).
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link href="/contact" className="button button-green">
              Contact Our Team
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/data-policy"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Data Policy &amp; Privacy
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-xs text-slate-300">
          <a
            href="mailto:utarezemai@gmail.com"
            className="inline-flex items-center gap-1.5 hover:text-emerald-300 transition"
          >
            <Mail className="h-3.5 w-3.5 text-emerald-400" />
            <span>utarezemai@gmail.com</span>
          </a>
          <a
            href="tel:+263786113799"
            className="inline-flex items-center gap-1.5 hover:text-emerald-300 transition"
          >
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
            <span>+263 78 611 3799 (Mon–Fri, 08:00–17:00 CAT)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
