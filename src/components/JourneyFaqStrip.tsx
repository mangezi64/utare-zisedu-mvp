"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_ITEMS, getJourneyFaqsForPath } from "@/lib/faq-data";

export default function JourneyFaqStrip() {
  const pathname = usePathname() || "/";
  const group = getJourneyFaqsForPath(pathname);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  if (!group || group.items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Quick answers for this page"
      className="no-print border-t border-slate-200/90 bg-slate-50/90"
    >
      <div className="mx-auto w-full max-w-[1188px] px-4 py-10 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-extrabold uppercase tracking-wider text-emerald-800">
              <HelpCircle className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              QUICK ANSWERS · USER JOURNEY HELP
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 m-0">
              {group.heading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0">
              {group.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={group.categoryHref}
              className="button button-green whitespace-nowrap"
            >
              <span>Browse All {FAQ_ITEMS.length} FAQs &amp; Search</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {group.categoryHref !== "/faq" && (
              <Link
                href="/faq"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-800 transition whitespace-nowrap"
              >
                All Topics
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {group.items.map((item) => {
            const isOpen = openId === item.id;
            const panelId = `journey-faq-panel-${item.id}`;
            return (
              <article
                key={item.id}
                className={`rounded-2xl border bg-white transition-shadow min-w-0 ${
                  isOpen
                    ? "border-emerald-300 shadow-md"
                    : "border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <h3 className="m-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() =>
                      setOpenId((prev) => (prev === item.id ? null : item.id))
                    }
                    className="w-full min-h-[48px] flex items-center justify-between gap-3 p-4 sm:p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-2xl"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform ${
                        isOpen
                          ? "rotate-180 border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={panelId}
                    className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 space-y-2.5 border-t border-slate-100 text-xs text-slate-700 leading-relaxed"
                  >
                    <div className="pt-3 space-y-2">
                      {item.answer.map((paragraph, idx) => (
                        <p key={idx} className="m-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {item.bullets && item.bullets.length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-[0.8125rem] text-slate-700">
                        {item.bullets.map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      {item.links?.map((link) => (
                        <Link
                          key={`${item.id}-${link.href}`}
                          href={link.href}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[0.78rem] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          <span>{link.label}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ))}
                      <Link
                        href={`/faq#${item.id}`}
                        className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-slate-600 hover:text-emerald-800 underline underline-offset-2"
                      >
                        <span>Read in full FAQ</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
