"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Cpu,
  Building2,
  Briefcase,
  Route,
  User,
  Shield,
  BookOpen,
  Globe,
  LogIn,
  LogOut,
  Info,
  HelpCircle,
  Mail,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/skills", label: "Skills", icon: BookOpen },
  { href: "/hubs", label: "Hubs", icon: Building2 },
  { href: "/employers", label: "For Employers", icon: Globe },
];

const CANDIDATE_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/account", label: "My Workspace", icon: User },
  { href: "/jobs", label: "CV Studio", icon: Briefcase },
  { href: "/assessment", label: "Diagnostic", icon: Cpu },
  { href: "/pathway", label: "Pathway", icon: Route },
  { href: "/opportunities", label: "Opportunities", icon: Globe },
  { href: "/employers", label: "Employers", icon: Globe },
  { href: "/hubs", label: "Hubs", icon: Building2 },
];

const EMPLOYER_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/employer", label: "Employer Portal", icon: Globe },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/hubs", label: "Partner Hubs", icon: Building2 },
];

const HUB_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/hub-portal", label: "Hub Portal", icon: Building2 },
  { href: "/hubs", label: "Partner Hubs", icon: Globe },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
];

const ADMIN_NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/admin", label: "Admin Console", icon: Shield },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/hubs", label: "Partner Hubs", icon: Building2 },
  { href: "/employers", label: "Employers", icon: Globe },
  { href: "/assessment", label: "Intake Simulator", icon: Cpu },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const {
    user,
    isAuthenticated,
    isAdmin,
    isSuperuser,
    isEmployer,
    isHub,
    logout,
  } = useViewMode();

  // Close menus on route change, outside click, or Escape
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    setUserMenuOpen(false);
    router.push("/");
  };

  const navItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : isEmployer
    ? EMPLOYER_NAV_ITEMS
    : isHub
    ? HUB_NAV_ITEMS
    : isAuthenticated
    ? CANDIDATE_NAV_ITEMS
    : PUBLIC_NAV_ITEMS;

  const firstInitial = (
    user?.name?.trim()?.[0] ||
    user?.email?.trim()?.[0] ||
    "U"
  ).toUpperCase();

  const roleTitle = isSuperuser
    ? "Superuser · Admin Console Active"
    : isAdmin
    ? "Facilitator & Admin · Console Active"
    : isEmployer
    ? "Employer Partner Portal"
    : isHub
    ? "Hub Partner Portal"
    : "Candidate Workspace";

  const roleSubtitle = isAdmin
    ? "Employer verification, hub enlistment, job moderation & oversight"
    : isEmployer
    ? user?.companyName || "Verified Hiring Partner"
    : isHub
    ? user?.companyName || "Innovation Hub Operations"
    : user?.city
    ? `${user.city}${user.qualification ? ` · ${user.qualification}` : ""}`
    : user?.qualification || "Economic Mobility Pathway";

  const primaryHref = isAdmin
    ? "/admin"
    : isEmployer
    ? "/employer"
    : isHub
    ? "/hub-portal"
    : "/account";

  const primaryLabel = isAdmin
    ? "Open Admin Console"
    : isEmployer
    ? "Open Employer Portal"
    : isHub
    ? "Open Hub Portal"
    : "Open My Workspace";

  const avatarToneClass = isAdmin
    ? "border-amber-400 bg-amber-100 text-amber-950"
    : isEmployer
    ? "border-blue-300 bg-blue-100 text-blue-950"
    : isHub
    ? "border-teal-300 bg-teal-100 text-teal-950"
    : "border-emerald-300 bg-emerald-100 text-emerald-950";

  return (
    <header className="site-header no-print" suppressHydrationWarning>
      <div className="header-inner">
        {/* Faith & Amanda's Brand Mark ("U" with emerald indicator dot) */}
        <Link
          href="/"
          className="brand"
          aria-label="UTARE ZEM AI overview"
          onClick={() => setMobileOpen(false)}
        >
          <span className="brand-mark">U</span>
          <span>
            <b>UTARE</b> ZEM AI
            <small>Zimbabwe Economic Mobility &amp; Remote Bridge</small>
          </span>
        </Link>

        {/* Main Navigation Drawer */}
        <nav
          className={`main-nav ${mobileOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 ${
                  active ? "active" : ""
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Mobile Navigation Drawer Footer Links (< 1040px) */}
          <div className="lg:hidden border-t border-slate-200/90 pt-3 mt-2 flex flex-col gap-2 w-full">
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5"
            >
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>About Us</span>
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>FAQ</span>
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span>Contact</span>
            </Link>

            {isAuthenticated && user ? (
              <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-2">
                <Link
                  href={primaryHref}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition ${
                    isAdmin
                      ? "bg-amber-600 hover:bg-amber-700"
                      : isEmployer
                      ? "bg-slate-900 hover:bg-slate-800"
                      : isHub
                      ? "bg-teal-700 hover:bg-teal-800"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  {isAdmin ? (
                    <Shield className="h-4 w-4" />
                  ) : isEmployer || isHub ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span>{primaryLabel}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side Auth / User Circle Controls */}
        <div className="header-end">
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label={`Account menu for ${user.name} (${roleTitle})`}
                title={`${user.name} — ${roleTitle}`}
                className="group relative flex items-center gap-1 rounded-full p-0.5 pr-1.5 hover:bg-slate-100/90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 font-extrabold text-sm shadow-sm transition group-hover:scale-105 ${avatarToneClass}`}
                >
                  {user.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{firstInitial}</span>
                  )}

                  {/* Clean corner status/role badge on the circle */}
                  {isAdmin ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-amber-600 text-white shadow"
                      title={isSuperuser ? "Superuser" : "Admin"}
                    >
                      <Shield className="h-2.5 w-2.5" />
                    </span>
                  ) : isEmployer ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow"
                      title="Employer Partner"
                    >
                      <Building2 className="h-2.5 w-2.5" />
                    </span>
                  ) : isHub ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white shadow"
                      title="Hub Partner"
                    >
                      <Building2 className="h-2.5 w-2.5" />
                    </span>
                  ) : (
                    <span
                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow"
                      title="Candidate Active"
                    />
                  )}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-label="User profile and console status"
                  className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span
                      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-extrabold text-base ${avatarToneClass}`}
                    >
                      {user.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{firstInitial}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user.name}
                      </p>
                      <p className="truncate text-[0.78rem] text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="my-3 rounded-xl border border-slate-100 bg-slate-50/90 p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      ) : isEmployer ? (
                        <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      ) : isHub ? (
                        <Building2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span
                        className={`text-[0.78rem] font-bold ${
                          isAdmin
                            ? "text-amber-900"
                            : isEmployer
                            ? "text-blue-900"
                            : isHub
                            ? "text-teal-900"
                            : "text-emerald-900"
                        }`}
                      >
                        {roleTitle}
                      </span>
                    </div>
                    <p className="text-[0.78rem] leading-snug text-slate-600">
                      {roleSubtitle}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={primaryHref}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-white transition ${
                        isAdmin
                          ? "bg-amber-600 hover:bg-amber-700"
                          : isEmployer
                          ? "bg-slate-900 hover:bg-slate-800"
                          : isHub
                          ? "bg-teal-700 hover:bg-teal-800"
                          : "bg-emerald-700 hover:bg-emerald-800"
                      }`}
                    >
                      <span>{primaryLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    {!isAdmin && !isEmployer && !isHub && (
                      <Link
                        href="/assessment"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <span>Career Diagnostic</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </Link>
                    )}

                    <Link
                      href="/faq"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span>Help &amp; FAQ</span>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Auth Links */}
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="signin-link whitespace-nowrap">
                  Sign In
                </Link>
                <Link
                  href="/login?tab=register"
                  className="button button-green whitespace-nowrap"
                  style={{ minHeight: "36px", padding: "0 14px", fontSize: "0.85rem" }}
                >
                  Create Account
                </Link>
              </div>

              {/* Mobile Quick Sign In */}
              <Link
                href="/login"
                className="md:hidden text-xs font-bold text-emerald-700 px-2 py-1 hover:underline"
              >
                Sign In
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
