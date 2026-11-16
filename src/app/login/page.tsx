"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  User,
  Shield,
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";
import ZimbabweCitySelect from "@/components/ZimbabweCitySelect";
import PasswordInput from "@/components/PasswordInput";
import { validateEmail, validatePassword } from "@/lib/validation";

const IS_LOCAL_DEV = process.env.NODE_ENV === "development";

const STRENGTH_STYLES: Record<string, { bar: string; text: string }> = {
  "Too Weak": { bar: "bg-slate-200", text: "text-slate-500" },
  Weak: { bar: "bg-red-500", text: "text-red-600" },
  Fair: { bar: "bg-amber-500", text: "text-amber-600" },
  Good: { bar: "bg-lime-500", text: "text-lime-700" },
  Strong: { bar: "bg-emerald-600", text: "text-emerald-700" },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const redirectUrl = searchParams.get("redirect");
  
  const { loginAsCandidate, loginAsAdmin } = useViewMode();
  const [tab, setTab] = useState<"login" | "register">(initialTab === "register" ? "register" : "login");
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Register State
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regEmailTouched, setRegEmailTouched] = useState(false);
  const [city, setCity] = useState("Harare");
  const [qualification, setQualification] = useState("Bachelors Degree");
  const [fieldOfStudy, setFieldOfStudy] = useState("Computer Science & IT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    const normalizedEmail = loginEmail.trim().toLowerCase();

    const emailCheck = validateEmail(normalizedEmail);
    if (!emailCheck.isValid) {
      setLoginError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    // 1. Local development only: admin shortcut. Production admin access will
    //    come exclusively from the backend-assigned role (Supabase Auth, v2).
    if (IS_LOCAL_DEV && normalizedEmail === "admin@utare.co.zw") {
      loginAsAdmin();
      router.push(redirectUrl || "/admin");
      return;
    }

    // 2. Otherwise authenticate as candidate
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(normalizedEmail)}`);
      const data = await res.json();
      if (data.candidate?.profile) {
        const p = data.candidate.profile;
        loginAsCandidate({
          name: p.fullName || p.name || normalizedEmail.split("@")[0].replace(".", " "),
          email: p.email || normalizedEmail,
          city: p.city || "Harare",
          qualification: p.highestQualification || "Bachelors Degree",
          fieldOfStudy: p.fieldOfStudy || "Tertiary Graduate",
          id: data.candidate.id,
        });
      } else {
        loginAsCandidate({
          name: normalizedEmail.split("@")[0].replace(".", " "),
          email: normalizedEmail,
        });
      }
    } catch {
      loginAsCandidate({
        name: normalizedEmail.split("@")[0].replace(".", " "),
        email: normalizedEmail,
      });
    }
    router.push(redirectUrl || "/account");
  };

  const handleDemoCandidateQuickLogin = () => {
    loginAsCandidate({
      name: "Tatenda Moyo",
      email: "demo@utarezem.ai",
      qualification: "Bachelors Degree",
      city: "Harare",
      fieldOfStudy: "BSc Computer Science",
    });
    router.push(redirectUrl || "/account");
  };

  const handleAdminQuickLogin = () => {
    loginAsAdmin();
    router.push(redirectUrl || "/admin");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !regEmail || !regPassword) {
      setLoginError("Please complete all required fields.");
      return;
    }

    const emailCheck = validateEmail(regEmail);
    if (!emailCheck.isValid) {
      setRegEmailTouched(true);
      setLoginError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    const pwCheck = validatePassword(regPassword);
    if (!pwCheck.isValid) {
      setLoginError(pwCheck.error || "Please choose a stronger password.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setLoginError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");

    let res: Response;
    try {
      // Save directly to backend / PostgreSQL database
      res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "register",
          fullName: fullName.trim(),
          email: regEmail.trim().toLowerCase(),
          city,
          highestQualification: qualification,
          fieldOfStudy,
          yearsExperience: 1,
          employmentStatus: "Seeking Remote Employment",
          monthlyIncomeBracket: "$0 - No Income",
          hasDedicatedLaptop: true,
          primaryDevice: "Dedicated Laptop / PC",
          internetAccessType: "Home Wi-Fi Broadband",
          powerReliabilityHours: 8,
          hasGlobalPaymentRail: false,
          primaryGoal: "International Remote Work",
          currentSkills: [fieldOfStudy, "Digital Literacy", "English Communication"],
        }),
      });
    } catch {
      setIsSubmitting(false);
      setLoginError("We couldn't reach the server. Check your connection and try again.");
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setIsSubmitting(false);
      setLoginError(data.error || "Registration failed. Please try again.");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setRegisterSuccess("Account created successfully! Connecting your workspace...");

    loginAsCandidate({
      name: fullName.trim(),
      email: regEmail.trim().toLowerCase(),
      qualification,
      city,
      fieldOfStudy,
      ...(data.candidate?.id ? { id: data.candidate.id } : {}),
    });

    setTimeout(() => {
      router.push(redirectUrl || "/assessment");
    }, 1000);
  };

  const regEmailCheck = validateEmail(regEmail);
  const showRegEmailError = regEmailTouched && regEmail.length > 0 && !regEmailCheck.isValid;
  const pwStrength = validatePassword(regPassword);
  const confirmMismatch = regConfirmPassword.length > 0 && regConfirmPassword !== regPassword;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                UTARE <span className="text-emerald-700">ZEM AI</span>
              </span>
              <p className="text-xs text-slate-500">
                Zimbabwe Economic Mobility & Remote Bridge
              </p>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            {tab === "login" ? "Sign In to Your Account" : "Create Candidate Account"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {tab === "login"
              ? "Sign in to access your readiness assessment, AI roadmap, and workspace."
              : "Create your account to bridge credentials into verified remote work."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 mb-6 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => { setTab("login"); setLoginError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
              tab === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-4 w-4 text-emerald-700" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setLoginError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
              tab === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="h-4 w-4 text-emerald-700" />
            Create Account
          </button>
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {loginError && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {registerSuccess && (
            <div className="mb-6 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{registerSuccess}</span>
            </div>
          )}

          {/* TAB 1: Candidate Login */}
          {tab === "login" && (
            <div>
              <form onSubmit={handleCandidateLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <PasswordInput
                    value={loginPassword}
                    onChange={setLoginPassword}
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2"
                >
                  Sign In to Workspace <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* 1-Click Fast Test Box (local development only) */}
              {IS_LOCAL_DEV && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Quick Demo Testing (local dev only)
                    </span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      1-Click
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Fast-load verified test credentials with no typing required:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDemoCandidateQuickLogin}
                      className="rounded-lg bg-white border border-emerald-600 text-emerald-800 py-2 px-3 text-xs font-bold hover:bg-emerald-50 transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <User className="h-3.5 w-3.5 text-emerald-700" /> Demo Candidate (Tatenda)
                    </button>
                    <button
                      type="button"
                      onClick={handleAdminQuickLogin}
                      className="rounded-lg bg-white border border-amber-600 text-amber-900 py-2 px-3 text-xs font-bold hover:bg-amber-50 transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Shield className="h-3.5 w-3.5 text-amber-700" /> Facilitator Admin (Stewart)
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* TAB 2: Create Candidate Account */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Farai Nyoni"
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    onBlur={() => setRegEmailTouched(true)}
                    placeholder="farai.nyoni@gmail.com"
                    aria-invalid={showRegEmailError || undefined}
                    className={`w-full rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none ${
                      showRegEmailError
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-emerald-600"
                    }`}
                  />
                </div>
                {showRegEmailError && (
                  <p className="mt-1 text-[11px] text-red-600">{regEmailCheck.error}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <PasswordInput
                    required
                    value={regPassword}
                    onChange={setRegPassword}
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <PasswordInput
                    required
                    value={regConfirmPassword}
                    onChange={setRegConfirmPassword}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    invalid={confirmMismatch}
                  />
                  {confirmMismatch && (
                    <p className="mt-1 text-[11px] text-red-600">Passwords do not match.</p>
                  )}
                </div>
              </div>

              {regPassword.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-600">Password strength</span>
                    <span className={STRENGTH_STYLES[pwStrength.label].text}>{pwStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full ${
                          pwStrength.score >= i ? STRENGTH_STYLES[pwStrength.label].bar : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {pwStrength.requirements.map((r) => (
                      <li
                        key={r.id}
                        className={`flex items-center gap-1.5 text-[11px] ${
                          r.met ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2 className={`h-3.5 w-3.5 ${r.met ? "text-emerald-600" : "text-slate-300"}`} />
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <ZimbabweCitySelect
                  value={city}
                  onChange={setCity}
                  label="City / Town in Zimbabwe *"
                  required
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Highest Qualification *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="Bachelors Degree">Bachelors Degree</option>
                      <option value="Higher National Diploma (HND)">Higher National Diploma</option>
                      <option value="Masters Degree">Masters Degree</option>
                      <option value="National Diploma">National Diploma</option>
                      <option value="A-Level Certificate">A-Level Certificate</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Field of Study / Discipline
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="e.g. Accounting, Computer Science, Marketing"
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !pwStrength.isValid || confirmMismatch || !regConfirmPassword}
                  className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Verifying email & creating account..." : "Create Account & Start Diagnostic"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="text-center text-xs text-slate-500 pt-2">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign in to your account
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Public Website Navigation Notice */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Want to browse without logging in?{" "}
          <Link href="/" className="font-semibold text-emerald-700 hover:underline">
            Explore public website & overview
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
            <Sparkles className="h-5 w-5 text-emerald-700 animate-spin" />
            Loading sign in portal...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
