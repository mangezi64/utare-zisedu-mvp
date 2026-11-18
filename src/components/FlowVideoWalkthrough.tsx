"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ChevronLeft,
  ChevronRight,
  X,
  Subtitles,
  Sparkles,
  Compass,
  Briefcase,
  Building2,
  DollarSign,
  CheckCircle2,
  Monitor,
  Wifi,
  Sun,
  ShieldCheck,
  FileText,
  Volume2,
  Video,
} from "lucide-react";

export interface DemoStep {
  id: string;
  stepNumber: string;
  title: string;
  tagline: string;
  category: string;
  durationSeconds: number;
  captionText: string;
  screenSummary: {
    heading: string;
    subheading: string;
    highlights: string[];
    metrics: { label: string; value: string }[];
    uiBadges: string[];
    actionPrompt: string;
  };
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: "diagnostic",
    stepNumber: "01",
    title: "Intake & Career Diagnostic",
    tagline: "Skills assessment without paper credential bias",
    category: "CANDIDATE INTAKE",
    durationSeconds: 8,
    captionText:
      "Candidates start with a friendly diagnostic evaluating practical problem-solving, digital skills, daily electricity hours, and hardware access.",
    screenSummary: {
      heading: "Practical Skills & Infrastructure Diagnostic",
      subheading:
        "Farai Moyo (Harare) • Bachelor of Business Information Systems",
      highlights: [
        "Infrastructure Check: Dedicated Laptop + 8 Hours/Day Reliable Power",
        "Connectivity Audit: High-speed Wi-Fi & LTE mobile hotspot backup",
        "Competency Scoring: 85% Problem-solving & Remote collaboration",
        "Zero-Bias: Evaluates real abilities beyond academic paper certificates",
      ],
      metrics: [
        { label: "Overall Readiness", value: "83% (Market-Ready)" },
        { label: "Power Stability", value: "8 hrs/day" },
        { label: "Hardware Status", value: "Laptop Verified" },
      ],
      uiBadges: ["Diagnostic Verified", "Harare Region", "Level 4 Direct Track"],
      actionPrompt: "AI analyzes 6 dimensions of market readiness...",
    },
  },
  {
    id: "pathway",
    stepNumber: "02",
    title: "AI Career Pathway",
    tagline: "Gemini 2.5 Flash generates tailored 90-day milestones",
    category: "PERSONALIZED ROADMAP",
    durationSeconds: 8,
    captionText:
      "Gemini AI analyzes the diagnostic data, identifies transferable competencies, and maps a personalized 90-day remote work trajectory.",
    screenSummary: {
      heading: "Personalized Remote Pathway & Upskilling Milestones",
      subheading: "Track: Cloud Operations & Technical Revenue Support",
      highlights: [
        "Executive Diagnosis: Strong technical logic, needs remote billing onboarding",
        "Infrastructure Bridge: Paired with Harare Tech Hub for solar redundancy",
        "Milestone 1: Remote Portfolio Modernization (Next.js & Vercel)",
        "Milestone 2: Cross-border Billing & Asynchronous Workplace Protocols",
      ],
      metrics: [
        { label: "Target Remote Compensation", value: "$800 - $1,600 / mo" },
        { label: "Placement Window", value: "90 Days" },
        { label: "Assigned Hub", value: "Harare Innovation Hub" },
      ],
      uiBadges: ["Gemini 2.5 Flash", "Solar Redundancy", "Vetted Tech Mentor"],
      actionPrompt: "Milestones update live as the candidate completes tasks...",
    },
  },
  {
    id: "cv-studio",
    stepNumber: "03",
    title: "Tailored CV Studio",
    tagline: "Grounded, evidence-backed resumes & 1-click Word/PDF export",
    category: "APPLICATION ASSETS",
    durationSeconds: 8,
    captionText:
      "The CV Studio transforms raw skills into an ATS-optimized, formatted resume with verified badges and instant .docx and PDF downloads.",
    screenSummary: {
      heading: "ATS-Optimized Remote Resume & Application Letter",
      subheading: "Target Role: Remote Full-Stack Engineer / Cloud Operations",
      highlights: [
        "Anti-Slop AI Guard: Verifies claims against actual uploaded certificates",
        "Integrated Profile Photo: Clean professional portrait embedded in .docx",
        "Versioned Artifacts: Auto-increments versions (v1 -> v2) for tracking",
        "1-Click Export: Download native Word (.docx) or print-ready PDF",
      ],
      metrics: [
        { label: "ATS Optimization Score", value: "96 / 100" },
        { label: "Verified Credentials", value: "3 Attached" },
        { label: "Artifacts Created", value: "CV v2 + Letter v2" },
      ],
      uiBadges: ["Word (.docx) Ready", "PDF Ready", "Verified Skill Badges"],
      actionPrompt: "Applications link directly to the candidate's workspace...",
    },
  },
  {
    id: "hubs",
    stepNumber: "04",
    title: "Solar Partner Hubs",
    tagline: "Overcoming load-shedding with solar power & Starlink Wi-Fi",
    category: "PHYSICAL INFRASTRUCTURE",
    durationSeconds: 8,
    captionText:
      "Candidates reserve desks at local partner hubs across Zimbabwe, ensuring 100% power and internet uptime during 18-hour municipal blackouts.",
    screenSummary: {
      heading: "Partner Innovation Hubs & Workstation Desks",
      subheading: "Harare Tech Hub • Batanai Gardens, Jason Moyo Ave",
      highlights: [
        "Solar Backup: 10kVA Victron Hybrid Solar with lithium battery banks",
        "Dual ISP Redundancy: Starlink Satellite (180 Mbps) + Liquid Home Fiber",
        "Hardware Loaner Pool: 12 Core i5 laptops available for member reservation",
        "Subsidized Desk Passes: $0 for enrolled Utare cohort jobseekers",
      ],
      metrics: [
        { label: "Solar Runtime", value: "18+ Hours" },
        { label: "Download Speed", value: "180 Mbps" },
        { label: "Available Desks", value: "24 Workstations" },
      ],
      uiBadges: ["Solar Active", "Starlink Online", "Free Cohort Access"],
      actionPrompt: "Guaranteed connectivity when local grid goes down...",
    },
  },
  {
    id: "employer",
    stepNumber: "05",
    title: "Employer AI Matching & Hiring",
    tagline: "Automated candidate fit scoring & anti-fake job moderation",
    category: "PLACEMENT & MONETIZATION",
    durationSeconds: 8,
    captionText:
      "Employers post vacancies, while Gemini AI automatically scores candidate fit, filters out mismatched profiles, and surfaces top Zimbabwean talent.",
    screenSummary: {
      heading: "Employer Portal & AI Candidate Ranking Engine",
      subheading: "Vacancy: Junior Cloud Operations Engineer (USD $1,200/mo)",
      highlights: [
        "AI Fit Score: Farai Moyo ranked 94% (Top Match / Recommended)",
        "Automated Filtering: Blocks misaligned applications (e.g. hospitality for engineering)",
        "Verified Credentials: View authenticated transcripts & degree versions",
        "Transparent Payouts: Cross-border payroll via Deel, Payoneer & USD Nostro",
      ],
      metrics: [
        { label: "AI Fit Rank", value: "#1 (94% Fit)" },
        { label: "Applicant Review Time", value: "< 2 Mins" },
        { label: "Monetization Model", value: "Free for Jobseekers" },
      ],
      uiBadges: ["Top Match", "Deel / Payoneer Ready", "Anti-Scam Moderated"],
      actionPrompt: "Employers schedule 1-click interviews with verified candidates...",
    },
  },
];

export default function FlowVideoWalkthrough() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"interactive" | "external">("interactive");
  const [externalUrl, setExternalUrl] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setProgressPercent(0);
    };
    window.addEventListener("utare-open-video-walkthrough", handleOpen);
    return () => {
      window.removeEventListener("utare-open-video-walkthrough", handleOpen);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === " " && activeTab === "interactive") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key === "ArrowRight") {
        setCurrentStepIndex((prev) => (prev + 1) % DEMO_STEPS.length);
        setProgressPercent(0);
      }
      if (e.key === "ArrowLeft") {
        setCurrentStepIndex((prev) => (prev - 1 + DEMO_STEPS.length) % DEMO_STEPS.length);
        setProgressPercent(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTab]);

  // Handle auto-advancing progress
  useEffect(() => {
    if (!isOpen || !isPlaying || activeTab !== "interactive") {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const step = DEMO_STEPS[currentStepIndex];
    const totalDurationMs = (step.durationSeconds * 1000) / playbackSpeed;
    const updateIntervalMs = 50;
    const stepIncrement = (updateIntervalMs / totalDurationMs) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          setCurrentStepIndex((s) => (s + 1) % DEMO_STEPS.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, updateIntervalMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, isPlaying, currentStepIndex, playbackSpeed, activeTab]);

  const handleNext = useCallback(() => {
    setCurrentStepIndex((prev) => (prev + 1) % DEMO_STEPS.length);
    setProgressPercent(0);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStepIndex((prev) => (prev - 1 + DEMO_STEPS.length) % DEMO_STEPS.length);
    setProgressPercent(0);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentStepIndex(0);
    setProgressPercent(0);
    setIsPlaying(true);
  }, []);

  const currentStep = DEMO_STEPS[currentStepIndex];

  return (
    <>
      {/* Main Full-Screen Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-walkthrough-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md">
                  <Video className="h-4 w-4" />
                </span>
                <div>
                  <h2
                    id="video-walkthrough-title"
                    className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2"
                  >
                    UTARE ZEM AI — Interactive Flow &amp; Video Walkthrough
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                      Live MVP Demo
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Visual end-to-end journey from intake diagnostic to remote job placement
                  </p>
                </div>
              </div>

              {/* View Switcher & Close */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex rounded-lg bg-slate-800 p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("interactive")}
                    className={`rounded px-2.5 py-1 transition ${
                      activeTab === "interactive"
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Interactive Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("external")}
                    className={`rounded px-2.5 py-1 transition ${
                      activeTab === "external"
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Custom Video URL
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Walkthrough (ESC)"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === "interactive" ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Step Navigation Pill Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs scrollbar-none">
                  {DEMO_STEPS.map((step, idx) => {
                    const active = idx === currentStepIndex;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => {
                          setCurrentStepIndex(idx);
                          setProgressPercent(0);
                        }}
                        className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 transition text-[11px] font-semibold ${
                          active
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md"
                            : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-80">
                          {step.stepNumber}
                        </span>
                        <span>{step.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Simulated Screen / Visual Mockup Stage */}
                <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col justify-center">
                  <div className="mx-auto w-full max-w-4xl rounded-xl border border-slate-700 bg-slate-800/90 shadow-2xl p-4 sm:p-6">
                    {/* Fake Browser Chrome */}
                    <div className="mb-4 flex items-center justify-between border-b border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                        <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                        <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                        <span className="ml-2 font-mono text-[11px] text-slate-400">
                          utare-zisedu-mvp.vercel.app/{currentStep.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <Sparkles className="h-3 w-3" />
                        {currentStep.category}
                      </div>
                    </div>

                    {/* Step Content Presentation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Left: Summary & Live Highlights */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <span className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider">
                            Step {currentStep.stepNumber} · {currentStep.tagline}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                            {currentStep.screenSummary.heading}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {currentStep.screenSummary.subheading}
                          </p>
                        </div>

                        {/* Bullet Highlights */}
                        <div className="space-y-2 rounded-xl bg-slate-900/80 p-3.5 border border-slate-700/60">
                          {currentStep.screenSummary.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>

                        {/* Live Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {currentStep.screenSummary.uiBadges.map((b, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-slate-700/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-600"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Metrics & System State */}
                      <div className="space-y-3 rounded-xl bg-slate-900/90 p-4 border border-slate-700 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Verified Output Metrics
                          </h4>
                          <div className="space-y-3">
                            {currentStep.screenSummary.metrics.map((m, i) => (
                              <div key={i} className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700/60">
                                <div className="text-[10px] text-slate-400">{m.label}</div>
                                <div className="text-sm font-extrabold text-amber-300 mt-0.5">
                                  {m.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 text-[10px] text-slate-400 italic flex items-center gap-1.5 border-t border-slate-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {currentStep.screenSummary.actionPrompt}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle / Closed Caption Bar (for deaf / hard of hearing) */}
                  {showCaptions && (
                    <div className="mt-4 mx-auto w-full max-w-4xl rounded-xl border border-amber-500/30 bg-slate-950/90 px-4 py-3 shadow-lg flex items-center gap-3">
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                        CC
                      </span>
                      <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
                        {currentStep.captionText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Player Timeline & Controls Bar */}
                <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 sm:px-6">
                  {/* Progress Line */}
                  <div className="relative mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left Playback Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRestart}
                        title="Restart from beginning"
                        className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handlePrev}
                        title="Previous Step (Left Arrow)"
                        className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPlaying((p) => !p)}
                        title={isPlaying ? "Pause (Spacebar)" : "Play (Spacebar)"}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md hover:scale-105 transition"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        title="Next Step (Right Arrow)"
                        className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      <span className="text-xs font-mono text-slate-400 ml-2">
                        {currentStep.stepNumber} / 05
                      </span>
                    </div>

                    {/* Right Options: Speed, Captions, Voice Launch */}
                    <div className="flex items-center gap-2">
                      {/* Playback Speed */}
                      <div className="flex items-center rounded-lg bg-slate-800 p-0.5 text-[11px] font-semibold text-slate-300">
                        {[0.75, 1.0, 1.25].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => setPlaybackSpeed(spd)}
                            className={`rounded px-2 py-0.5 transition ${
                              playbackSpeed === spd
                                ? "bg-amber-500 text-slate-950 font-bold"
                                : "hover:text-white"
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      {/* Captions Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowCaptions((c) => !c)}
                        title={showCaptions ? "Disable Captions" : "Enable Captions"}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          showCaptions
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Subtitles className="h-3.5 w-3.5" />
                        <span>CC</span>
                      </button>

                      {/* Voice Explainer Cross-link */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          window.dispatchEvent(new CustomEvent("utare-open-audio-explainer"));
                        }}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Listen to Voice</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* External Video Tab */
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex flex-col items-center justify-center space-y-4">
                <div className="max-w-xl text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 mx-auto">
                    <Video className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Embed External Screencast or Recorded Video
                  </h3>
                  <p className="text-xs text-slate-400">
                    If your team records a live 2-minute walkthrough on Loom, YouTube, or Vimeo, paste the embed URL below to display it directly here:
                  </p>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/embed/... or Loom URL"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                  {externalUrl && (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 mt-4">
                      <iframe
                        src={externalUrl}
                        title="UTARE ZEM AI Video Walkthrough"
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab("interactive")}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                  >
                    Return to Interactive Flow Demo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
