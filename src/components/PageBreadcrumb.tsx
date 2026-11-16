"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Home,
  Shield,
  Building2,
  User,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageBreadcrumbProps {
  current?: string;
  items?: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  showNext?: boolean;
  className?: string;
}

export default function PageBreadcrumb({
  current,
  items,
  backHref,
  backLabel,
  nextHref,
  nextLabel,
  showNext = true,
  className = "",
}: PageBreadcrumbProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isEmployer } = useViewMode();

  // Smart back navigation handler
  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If modifier keys pressed, allow default browser link handling (new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      e.preventDefault();
      router.back();
    }
  };

  // Determine role-based default exit target
  let defaultBackHref = "/";
  let defaultBackLabel = "Return to Home";
  let exitVariant: "candidate" | "admin" | "employer" | "guest" = "guest";

  if (isAdmin) {
    exitVariant = "admin";
    if (pathname === "/admin") {
      defaultBackHref = "/";
      defaultBackLabel = "Return to Overview";
    } else {
      defaultBackHref = "/admin";
      defaultBackLabel = "Return to Admin Console";
    }
  } else if (isEmployer) {
    exitVariant = "employer";
    if (pathname === "/employer") {
      defaultBackHref = "/";
      defaultBackLabel = "Return to Overview";
    } else {
      defaultBackHref = "/employer";
      defaultBackLabel = "Return to Employer Portal";
    }
  } else if (isAuthenticated) {
    exitVariant = "candidate";
    if (pathname === "/account") {
      defaultBackHref = "/";
      defaultBackLabel = "Return to Overview";
    } else {
      defaultBackHref = "/account";
      defaultBackLabel = "Return to My Workspace";
    }
  } else {
    exitVariant = "guest";
    defaultBackHref = "/";
    defaultBackLabel = "Return to Overview";
  }

  const resolvedBackHref = backHref || defaultBackHref;
  const resolvedBackLabel = backLabel || defaultBackLabel;

  // Next step in candidate / user journey
  let defaultNextHref: string | undefined;
  let defaultNextLabel: string | undefined;

  if (pathname === "/assessment") {
    defaultNextHref = "/pathway";
    defaultNextLabel = "Next: View Career Pathway →";
  } else if (pathname === "/pathway") {
    defaultNextHref = "/jobs";
    defaultNextLabel = "Next: Tailor CV & Job Match →";
  } else if (pathname === "/jobs") {
    defaultNextHref = "/opportunities";
    defaultNextLabel = "Next: Explore Opportunities →";
  } else if (pathname === "/opportunities") {
    defaultNextHref = "/hubs";
    defaultNextLabel = "Next: Partner Innovation Hubs →";
  } else if (pathname === "/hubs") {
    defaultNextHref = "/skills";
    defaultNextLabel = "Next: Skills Development →";
  } else if (pathname === "/skills") {
    defaultNextHref = isAuthenticated ? "/account" : "/login";
    defaultNextLabel = isAuthenticated
      ? "Next: My Workspace →"
      : "Next: Sign In / Create Account →";
  }

  const resolvedNextHref = nextHref !== undefined ? nextHref : defaultNextHref;
  const resolvedNextLabel = nextLabel !== undefined ? nextLabel : defaultNextLabel;

  // Auto-generate breadcrumb trail if not explicitly provided
  let trail: BreadcrumbItem[] = [];

  if (items && items.length > 0) {
    trail = [...items];
  } else {
    // Default home root
    trail.push({ label: "Home", href: "/" });

    if (isAdmin) {
      if (pathname === "/jobs") {
        trail.push({ label: "Admin Console", href: "/admin" });
        trail.push({ label: "CV Studio & Job Moderation" });
      } else if (pathname === "/assessment") {
        trail.push({ label: "Admin Console", href: "/admin" });
        trail.push({ label: "Intake Simulator" });
      } else if (pathname === "/pathway") {
        trail.push({ label: "Admin Console", href: "/admin" });
        trail.push({ label: "Pathway Engine" });
      } else if (pathname === "/opportunities") {
        trail.push({ label: "Admin Console", href: "/admin" });
        trail.push({ label: "Opportunities" });
      } else if (pathname === "/admin") {
        trail.push({ label: "Admin Console" });
      } else {
        trail.push({ label: pathname.replace(/^\//, "").replace(/-/g, " ") });
      }
    } else if (isEmployer) {
      if (pathname === "/employer") {
        trail.push({ label: "Employer Portal" });
      } else if (pathname === "/jobs") {
        trail.push({ label: "Employer Portal", href: "/employer" });
        trail.push({ label: "CV Studio" });
      } else if (pathname === "/opportunities") {
        trail.push({ label: "Employer Portal", href: "/employer" });
        trail.push({ label: "Opportunities" });
      } else {
        trail.push({ label: pathname.replace(/^\//, "").replace(/-/g, " ") });
      }
    } else if (isAuthenticated) {
      if (pathname === "/account") {
        trail.push({ label: "My Workspace" });
      } else if (pathname === "/jobs") {
        trail.push({ label: "Workspace", href: "/account" });
        trail.push({ label: "CV Studio" });
      } else if (pathname === "/assessment") {
        trail.push({ label: "Workspace", href: "/account" });
        trail.push({ label: "Diagnostic" });
      } else if (pathname === "/pathway") {
        trail.push({ label: "Workspace", href: "/account" });
        trail.push({ label: "Pathway" });
      } else if (pathname === "/opportunities") {
        trail.push({ label: "Workspace", href: "/account" });
        trail.push({ label: "Opportunities" });
      } else if (pathname === "/skills") {
        trail.push({ label: "Workspace", href: "/account" });
        trail.push({ label: "Skills Development" });
      } else if (pathname === "/hubs") {
        trail.push({ label: "Workspace", href: "/account" });
        trail.push({ label: "Hubs" });
      } else {
        trail.push({ label: "Workspace", href: "/account" });
        trail.push({ label: pathname.replace(/^\//, "").replace(/-/g, " ") });
      }
    } else {
      if (pathname === "/jobs") {
        trail.push({ label: "CV Studio" });
      } else if (pathname === "/assessment") {
        trail.push({ label: "Diagnostic" });
      } else if (pathname === "/pathway") {
        trail.push({ label: "Pathway" });
      } else if (pathname === "/opportunities") {
        trail.push({ label: "Opportunities" });
      } else if (pathname === "/skills") {
        trail.push({ label: "Skills Development" });
      } else if (pathname === "/hubs") {
        trail.push({ label: "Hubs" });
      } else if (pathname === "/about") {
        trail.push({ label: "About Us" });
      } else if (pathname === "/how-it-works") {
        trail.push({ label: "How It Works" });
      } else if (pathname === "/contact") {
        trail.push({ label: "Contact" });
      } else {
        trail.push({ label: pathname.replace(/^\//, "").replace(/-/g, " ") });
      }
    }
  }

  // Override last item with `current` if specified
  if (current && trail.length > 0) {
    trail[trail.length - 1] = {
      ...trail[trail.length - 1],
      label: current,
    };
  }

  const currentLabel =
    current || (trail.length > 0 ? trail[trail.length - 1].label : "");

  // High contrast button classes by role
  let buttonClasses =
    "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-800/30";

  if (exitVariant === "admin") {
    buttonClasses =
      "bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-1 ring-amber-700/30";
  } else if (exitVariant === "employer") {
    buttonClasses =
      "bg-slate-900 hover:bg-slate-800 text-white shadow-sm ring-1 ring-slate-800/30";
  } else if (exitVariant === "guest") {
    buttonClasses =
      "bg-slate-800 hover:bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/30";
  }

  return (
    <div
      className={`sticky top-[73px] z-30 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs no-print ${className}`}
      suppressHydrationWarning
    >
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Prominent Back / Exit Button & Trail */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <Link
            href={resolvedBackHref}
            onClick={handleBack}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 shrink-0 ${buttonClasses}`}
            title={`Navigate back to ${resolvedBackLabel}`}
            aria-label={`Go back to ${resolvedBackLabel}`}
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {resolvedBackLabel.startsWith("←")
                ? resolvedBackLabel
                : `← ${resolvedBackLabel}`}
            </span>
            <span className="inline sm:hidden">← Back</span>
          </Link>

          {/* Breadcrumb Trail (Desktop / Tablet) */}
          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center flex-wrap gap-1.5 text-xs text-slate-500"
          >
            {trail.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === trail.length - 1;
              return (
                <React.Fragment key={`${item.label}-${index}`}>
                  {!isFirst && (
                    <ChevronRight
                      className="h-3.5 w-3.5 text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-emerald-700 transition"
                    >
                      {isFirst && <Home className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span
                      className="font-bold text-slate-900 inline-flex items-center gap-1 capitalize"
                      aria-current="page"
                    >
                      {isFirst && <Home className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span>{item.label}</span>
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Mobile View Title (< 640px) */}
        <div className="sm:hidden flex items-center text-xs font-bold text-slate-800 truncate px-1">
          <span className="truncate">{currentLabel}</span>
        </div>

        {/* Right: Next Step Pill */}
        {showNext && resolvedNextHref && (
          <Link
            href={resolvedNextHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50/60 shadow-xs transition active:scale-95 shrink-0"
            title={`Proceed to ${resolvedNextLabel}`}
          >
            <span className="hidden sm:inline">{resolvedNextLabel}</span>
            <span className="inline sm:hidden">Next</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
