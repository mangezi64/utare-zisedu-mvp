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
  Lock,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useViewMode } from "@/lib/view-mode-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  
  const { loginAsCandidate, loginAsAdmin } = useViewMode();
  const [tab, setTab] = useState<"login" | "register" | "admin">(initialTab);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Register State
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [city, setCity] = useState("Harare");
  const [qualification, setQualification] = useState("Bachelors Degree");
  const [fieldOfStudy, setFieldOfStudy] = useState("Computer Science & IT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");

  const handleCandidateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }
    
    loginAsCandidate({
      name: loginEmail.split("@")[0].replace(".", " "),
      email: loginEmail,
    });
    router.push("/account");
  };

  const handleDemoCandidateQuickLogin = () => {
    loginAsCandidate({
      name: "Tatenda Moyo",
      email: "demo@utaresizedu.ai",
      qualification: "BSc Computer Science",
      city: "Harare",
    });
    router.push("/account");
  };

  const handleAdminQuickLogin = () => {
    loginAsAdmin();
    router.push("/admin");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !regEmail || !regPassword) {
      setLoginError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");

    try {
      // Save directly to backend / PostgreSQL database
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: regEmail,
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

      if (!res.ok) {
        throw new Error("Registration failed on server");
      }

      setRegisterSuccess("Account created successfully! Connecting your workspace...");
      
      loginAsCandidate({
        name: fullName,
        email: regEmail,
        qualification,
        city,
        fieldOfStudy,
      });

      setTimeout(() => {
        router.push("/assessment");
      }, 1000);
    } catch {
      // Fallback for offline local state
      loginAsCandidate({
        name: fullName,
        email: regEmail,
        qualification,
        city,
        fieldOfStudy,
      });
      router.push("/assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                UTARE <span className="text-emerald-700">ZISEDU AI</span>
              </span>
              <p className="text-xs text-slate-500">
                Zimbabwe Economic Mobility & Remote Bridge
              </p>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            {tab === "login"
              ? "Candidate Sign In"
              : tab === "register"
              ? "Create Candidate Account"
              : "Facilitator & Admin Portal"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {tab === "login"
              ? "Sign in to access your readiness assessment, AI roadmap, and remote jobs."
              : tab === "register"
              ? "Create your account to bridge credentials into verified remote work."
              : "Access cohort diagnostics, partner hub enlistment, and AI job approvals."}
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
            Candidate Login
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
          <button
            type="button"
            onClick={() => { setTab("admin"); setLoginError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
              tab === "admin"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="h-4 w-4 text-amber-700" />
            Admin Portal
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
                      placeholder="demo@utaresizedu.ai"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2"
                >
                  Sign In to Candidate Workspace <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* 1-Click Fast Test Box */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Quick Demo Testing
                    </span>
                    <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      1-Click
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Instantly load verified candidate <strong>Tatenda Moyo</strong> (Computer Science Graduate, Harare) with no typing required:
                  </p>
                  <button
                    type="button"
                    onClick={handleDemoCandidateQuickLogin}
                    className="w-full rounded-lg bg-white border border-emerald-600 text-emerald-800 py-2 text-xs font-bold hover:bg-emerald-50 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <User className="h-4 w-4" /> Sign In as Demo Candidate (Tatenda Moyo)
                  </button>
                </div>
              </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="farai@example.com"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="Harare">Harare</option>
                      <option value="Bulawayo">Bulawayo</option>
                      <option value="Mutare">Mutare</option>
                      <option value="Gweru">Gweru</option>
                      <option value="Masvingo">Masvingo</option>
                      <option value="Chinhoyi">Chinhoyi</option>
                    </select>
                  </div>
                </div>

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
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Account in Database..." : "Create Account & Start Diagnostic"}
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

          {/* TAB 3: Admin / Facilitator Portal */}
          {tab === "admin" && (
            <div>
              <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-4 mb-6">
                <div className="flex items-center gap-2 mb-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Shield className="h-4 w-4 text-amber-700" />
                  Facilitator Operations
                </div>
                <p className="text-xs text-amber-800">
                  Admins and evaluators can approve discovered AI remote jobs, enlist co-working hubs, inspect candidate readiness tiers, and monitor employer inquiries.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facilitator Email
                  </label>
                  <input
                    type="email"
                    defaultValue="admin@utare.co.zw"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    defaultValue="Admin123!"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAdminQuickLogin}
                  className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition flex items-center justify-center gap-2"
                >
                  Enter Facilitator Admin Console <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
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
