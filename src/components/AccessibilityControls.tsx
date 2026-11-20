"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Accessibility,
  Eye,
  Type,
  Volume2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  Maximize2,
  Info,
  Radio,
  FileText,
  Activity,
  Video,
  Languages,
} from "lucide-react";
import {
  LANGUAGE_OPTIONS,
  SupportedLanguage,
  useLanguage,
} from "@/lib/language-context";

export type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";
export type FontSizeOption = "normal" | "large" | "xl";

export interface AccessibilityPreferences {
  highContrast: boolean;
  colorblindMode: ColorblindMode;
  fontSize: FontSizeOption;
  reducedMotion: boolean;
  dyslexicFriendly: boolean;
  verboseAnnouncements: boolean;
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  colorblindMode: "none",
  fontSize: "normal",
  reducedMotion: false,
  dyslexicFriendly: false,
  verboseAnnouncements: false,
};

const STORAGE_KEY = "utare_a11y_prefs";

export default function AccessibilityControls() {
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");

  // Load saved preferences on client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AccessibilityPreferences>;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Could not load a11y preferences from localStorage:", e);
    }
  }, []);

  // Apply CSS classes to document.documentElement whenever preferences change
  useEffect(() => {
    if (!isMounted || typeof document === "undefined") return;

    const root = document.documentElement;

    // 1. High Contrast
    if (prefs.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // 2. Colorblind filter
    root.classList.remove(
      "filter-deuteranopia",
      "filter-protanopia",
      "filter-tritanopia",
      "filter-monochrome"
    );
    if (prefs.colorblindMode !== "none") {
      root.classList.add(`filter-${prefs.colorblindMode}`);
    }

    // 3. Font Size
    root.classList.remove("font-size-large", "font-size-xl");
    if (prefs.fontSize === "large") {
      root.classList.add("font-size-large");
    } else if (prefs.fontSize === "xl") {
      root.classList.add("font-size-xl");
    }

    // 4. Reduced Motion
    if (prefs.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // 5. Dyslexic friendly
    if (prefs.dyslexicFriendly) {
      root.classList.add("dyslexic-friendly");
    } else {
      root.classList.remove("dyslexic-friendly");
    }

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn("Could not save a11y preferences:", e);
    }

    const hasActivePrefs = Boolean(
      prefs.highContrast ||
        prefs.colorblindMode !== "none" ||
        prefs.fontSize !== "normal" ||
        prefs.reducedMotion ||
        prefs.dyslexicFriendly
    );
    window.dispatchEvent(
      new CustomEvent("utare-a11y-state", { detail: { hasActivePrefs } })
    );
  }, [prefs, isMounted]);

  // Listen for custom open event from top/footer page toolbars & handle Escape
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setAnnouncement("Accessibility menu opened.");
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("utare-open-accessibility", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("utare-open-accessibility", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const updatePref = <K extends keyof AccessibilityPreferences>(
    key: K,
    val: AccessibilityPreferences[K],
    announcementText?: string
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: val }));
    if (announcementText) {
      setAnnouncement(announcementText);
    }
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES);
    setAnnouncement("Accessibility preferences reset to default.");
  };

  const handleAnnouncePageStructure = () => {
    if (typeof document === "undefined") return;
    const title = document.title || "UTARE ZEM AI";
    const headings = document.querySelectorAll("h1, h2");
    const headingList = Array.from(headings)
      .slice(0, 4)
      .map((h) => h.textContent?.trim())
      .filter(Boolean)
      .join(", ");

    const text = `Current Page: ${title}. Main Sections: ${headingList || "Overview"}. Press Tab to navigate interactive elements.`;
    setAnnouncement(text);
  };

  const handleSkipToMain = () => {
    if (typeof document === "undefined") return;
    const main = document.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus();
      setAnnouncement("Navigated directly to main page content.");
      setIsOpen(false);
    }
  };

  const handleLaunchAudioExplainer = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("utare-open-audio-explainer"));
      setAnnouncement("Opening UTARE audio explainer walkthrough.");
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* SVG Color Filters for Colorblindness Simulation and Correction */}
      <svg className="sr-only" aria-hidden="true" width="0" height="0">
        <defs>
          {/* Deuteranopia (green-blind safe) */}
          <filter id="utare-deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0 0 0
                      0.700 0.300 0 0 0
                      0.000 0.300 0.700 0 0
                      0 0 0 1 0"
            />
          </filter>
          {/* Protanopia (red-blind safe) */}
          <filter id="utare-protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.56667 0.43333 0 0 0
                      0.55833 0.44167 0 0 0
                      0.00000 0.24167 0.75833 0 0
                      0 0 0 1 0"
            />
          </filter>
          {/* Tritanopia (blue-blind safe) */}
          <filter id="utare-tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95 0.05 0 0 0
                      0.00 0.43333 0.56667 0 0
                      0.00 0.475 0.525 0 0
                      0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Screen Reader Announcements Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Accessibility Controls Drawer / Dialog Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-dialog-title"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-sm print:hidden animate-in fade-in duration-150"
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 text-white rounded-t-3xl sm:rounded-2xl border border-slate-700/80 shadow-2xl p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Accessibility className="w-5 h-5" />
                </span>
                <div>
                  <h2 id="a11y-dialog-title" className="text-base font-bold text-white flex items-center gap-2">
                    Accessibility &amp; Assistive Tech
                    <span className="text-[0.72rem] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      WCAG AAA
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Custom display, contrast, typography &amp; screen reader helpers
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Close Accessibility Settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action: Skip to Content & Audio Explainer */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <button
                onClick={handleSkipToMain}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                Skip to Main Content
              </button>

              <button
                onClick={handleLaunchAudioExplainer}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Volume2 className="w-3.5 h-3.5 fill-current" />
                Audio Walkthrough
              </button>
            </div>

            <div className="space-y-4">
              {/* 0. Language & Regional Inclusion */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 rounded-lg bg-slate-700/60 text-emerald-400">
                    <Languages className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {t.a11yPanel.languageSectionTitle}
                    </h3>
                    <p className="text-[0.78rem] text-slate-400">
                      {t.a11yPanel.languageSectionDesc}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2.5">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const isSelected = lang === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => {
                          setLang(opt.code as SupportedLanguage);
                          setAnnouncement(`Language changed to ${opt.label}.`);
                        }}
                        aria-pressed={isSelected}
                        className={`p-2 rounded-xl text-center text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                            : "bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. High Contrast Mode Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-slate-700/60 text-emerald-400">
                      <Eye className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-white">High Contrast Mode</h3>
                      <p className="text-[0.78rem] text-slate-400 leading-tight">
                        Maximum contrast ratio (7:1+), highlighted outlines, and high-visibility text.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      updatePref(
                        "highContrast",
                        !prefs.highContrast,
                        `High contrast mode ${!prefs.highContrast ? "enabled" : "disabled"}.`
                      )
                    }
                    role="switch"
                    aria-checked={prefs.highContrast}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      prefs.highContrast ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefs.highContrast ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Colorblind Mode Selector */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 rounded-lg bg-slate-700/60 text-emerald-400">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">Colorblind Filter Modes</h3>
                    <p className="text-[0.78rem] text-slate-400">
                      Safe contrast palettes and matrix filters for color vision deficiencies.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2.5">
                  {(
                    [
                      { id: "none", label: "Default (Full)", desc: "Standard palette" },
                      { id: "deuteranopia", label: "Deuteranopia", desc: "Green-weak / safe" },
                      { id: "protanopia", label: "Protanopia", desc: "Red-weak / safe" },
                      { id: "tritanopia", label: "Tritanopia", desc: "Blue-weak / safe" },
                      { id: "monochrome", label: "Monochrome", desc: "High legibility gray" },
                    ] as const
                  ).map((mode) => {
                    const isSelected = prefs.colorblindMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() =>
                          updatePref(
                            "colorblindMode",
                            mode.id,
                            `Colorblind mode set to ${mode.label}.`
                          )
                        }
                        className={`p-2 rounded-lg text-left text-xs transition-all border ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-400 text-white font-bold"
                            : "bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[0.78rem]">{mode.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <span className="text-[0.72rem] text-slate-400 font-normal block mt-0.5">
                          {mode.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Font Size Adjuster */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-slate-700/60 text-emerald-400">
                      <Type className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-white">Font Size Scaling</h3>
                      <p className="text-[0.78rem] text-slate-400">
                        Scale typography without breaking layout grids or forms.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "normal", label: "Normal", scale: "100%" },
                      { id: "large", label: "Large", scale: "115%" },
                      { id: "xl", label: "Extra Large", scale: "130%" },
                    ] as const
                  ).map((item) => {
                    const isSelected = prefs.fontSize === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          updatePref(
                            "fontSize",
                            item.id,
                            `Font size set to ${item.label} (${item.scale}).`
                          )
                        }
                        className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                            : "bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <span className="block text-xs">{item.label}</span>
                        <span className="block text-[0.72rem] opacity-80 mt-0.5">{item.scale}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Motion & Reading Comfort */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                {/* Reduced Motion */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Reduced Motion</h4>
                    <p className="text-[0.78rem] text-slate-400">
                      Disable animations and smooth scrolling for vestibular comfort.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updatePref(
                        "reducedMotion",
                        !prefs.reducedMotion,
                        `Reduced motion ${!prefs.reducedMotion ? "enabled" : "disabled"}.`
                      )
                    }
                    role="switch"
                    aria-checked={prefs.reducedMotion}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      prefs.reducedMotion ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefs.reducedMotion ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-slate-700/60 pt-2.5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Dyslexia-Friendly Spacing</h4>
                    <p className="text-[0.78rem] text-slate-400">
                      Increased line-height and letter-spacing for improved reading flow.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updatePref(
                        "dyslexicFriendly",
                        !prefs.dyslexicFriendly,
                        `Dyslexia-friendly spacing ${!prefs.dyslexicFriendly ? "enabled" : "disabled"}.`
                      )
                    }
                    role="switch"
                    aria-checked={prefs.dyslexicFriendly}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      prefs.dyslexicFriendly ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefs.dyslexicFriendly ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 5. Screen Reader & Disability Support */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 rounded-lg bg-slate-700/60 text-emerald-400">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {t.a11yPanel.screenReaderSectionTitle}
                    </h3>
                    <p className="text-[0.78rem] text-slate-400">
                      {t.a11yPanel.screenReaderSectionDesc}
                    </p>
                  </div>
                </div>

                <div className="mt-2 mb-3 rounded-lg bg-slate-900/70 border border-slate-700/60 p-2.5 space-y-1">
                  <p className="text-[0.78rem] font-semibold text-emerald-300">
                    {t.a11yPanel.disabilitySupportTitle}
                  </p>
                  <ul className="space-y-1 text-[0.75rem] text-slate-300 list-disc pl-4">
                    {t.a11yPanel.disabilitySupportBullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <button
                    onClick={handleAnnouncePageStructure}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Announce Page Outline
                  </button>

                  <button
                    onClick={() =>
                      updatePref(
                        "verboseAnnouncements",
                        !prefs.verboseAnnouncements,
                        `Verbose screen reader announcements ${!prefs.verboseAnnouncements ? "enabled" : "disabled"}.`
                      )
                    }
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                      prefs.verboseAnnouncements
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold"
                        : "bg-slate-900/60 border-slate-700 text-slate-300"
                    }`}
                  >
                    {prefs.verboseAnnouncements && <Check className="w-3 h-3 text-emerald-400" />}
                    Verbose Live Alerts
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      window.dispatchEvent(new CustomEvent("utare-open-audio-explainer"));
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Audio Tour (Voice)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      window.dispatchEvent(new CustomEvent("utare-open-video-walkthrough"));
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Interactive Video Demo
                  </button>
                </div>
              </div>
            </div>

            {/* Footer / Reset Controls */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[0.78rem]">Preferences saved automatically.</span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[0.78rem] text-slate-400 hover:text-white transition-colors underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded p-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset all settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
