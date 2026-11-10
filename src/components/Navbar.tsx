"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Cpu,
  Building2,
  Briefcase,
  Sparkles,
  Route,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  {
    href: "/assessment",
    label: "1. Intake & Diagnostic",
    icon: Cpu,
  },
  {
    href: "/pathway",
    label: "2. AI Pathway & Coach",
    icon: Route,
  },
  { href: "/hubs", label: "3. Partner Hubs", icon: Building2 },
  { href: "/jobs", label: "4. Remote Jobs & CV", icon: Briefcase },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              UTARE <span className="text-emerald-700">ZISEDU AI</span>
            </span>
            <p className="text-xs text-slate-500">
              Zimbabwe Economic Mobility & Remote Bridge
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/assessment"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:text-sm"
          >
            Start Candidate Bridge
          </Link>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mr-2 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                active
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
