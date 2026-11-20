"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  Headphones,
  HelpCircle,
  Languages,
  Pause,
  Play,
  Square,
  Video,
} from "lucide-react";
import {
  LANGUAGE_OPTIONS,
  SupportedLanguage,
  useLanguage,
} from "@/lib/language-context";

interface AudioStateDetail {
  isPlaying: boolean;
  isPaused: boolean;
  shortTitle?: string;
}

interface AssistiveToolbarProps {
  variant: "top" | "footer";
}

export default function AssistiveToolbar({ variant }: AssistiveToolbarProps) {
  const { lang, setLang, t } = useLanguage();
  const [audioState, setAudioState] = useState<AudioStateDetail>({
    isPlaying: false,
    isPaused: false,
  });
  const [hasActiveA11y, setHasActiveA11y] = useState(false);

  useEffect(() => {
    const handleAudioState = (e: Event) => {
      const detail = (e as CustomEvent<AudioStateDetail>).detail;
      if (detail) {
        setAudioState(detail);
      }
    };

    const handleA11yState = (e: Event) => {
      const detail = (e as CustomEvent<{ hasActivePrefs: boolean }>).detail;
      if (detail) {
        setHasActiveA11y(Boolean(detail.hasActivePrefs));
      }
    };

    window.addEventListener("utare-audio-state", handleAudioState);
    window.addEventListener("utare-a11y-state", handleA11yState);

    try {
      const stored = localStorage.getItem("utare_a11y_prefs");
      if (stored) {
        const parsed = JSON.parse(stored);
        setHasActiveA11y(
          Boolean(
            parsed.highContrast ||
              (parsed.colorblindMode && parsed.colorblindMode !== "none") ||
              (parsed.fontSize && parsed.fontSize !== "normal") ||
              parsed.reducedMotion ||
              parsed.dyslexicFriendly
          )
        );
      }
    } catch {}

    return () => {
      window.removeEventListener("utare-audio-state", handleAudioState);
      window.removeEventListener("utare-a11y-state", handleA11yState);
    };
  }, []);

  if (variant === "footer") {
    return (
      <div
        className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        aria-label="Guided tour and accessibility controls"
      >
        <div className="text-[11.5px] text-slate-300">
          <span className="font-semibold text-white">{t.toolbar.footerTitle}</span>
          <span className="hidden sm:inline text-slate-400">
            {" "}
            {t.toolbar.footerDesc}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t.toolbar.languageLabel}
            className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 p-0.5"
          >
            <Languages className="ml-1.5 mr-1 h-3.5 w-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLang(opt.code as SupportedLanguage)}
                aria-pressed={lang === opt.code}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                  lang === opt.code
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/30 transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-300" />
            <span>{t.toolbar.quickFaq || "Quick Answers (FAQ)"}</span>
          </Link>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("utare-open-audio-explainer"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition"
          >
            <Headphones className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {audioState.isPlaying
                ? audioState.isPaused
                  ? "Audio (Paused)"
                  : `Playing: ${audioState.shortTitle || "Audio"}`
                : "Audio Overview"}
            </span>
          </button>

          {audioState.isPlaying && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("utare-stop-audio"))}
              className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25 transition"
              aria-label="Stop audio walkthrough"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("utare-open-video-walkthrough"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 transition"
          >
            <Video className="h-3.5 w-3.5 text-amber-400" />
            <span>Flow Demo</span>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("utare-open-accessibility"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            <Accessibility className="h-3.5 w-3.5 text-emerald-400" />
            <span>Accessibility</span>
            {hasActiveA11y && (
              <span
                className="h-2 w-2 rounded-full bg-emerald-400"
                title="Custom accessibility settings active"
              />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="no-print border-b border-slate-200/80 bg-slate-50/90"
      aria-label="Page tools: Audio overview, flow demo, and accessibility"
    >
      <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-2 px-4 py-2">
        <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          {t.toolbar.prompt}
        </span>

        <div className="flex w-full md:w-auto flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("utare-open-audio-explainer"))}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-800 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/60 transition"
            >
              <Headphones className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span>
                {audioState.isPlaying
                  ? audioState.isPaused
                    ? t.toolbar.audioPaused
                    : audioState.shortTitle || t.toolbar.playingAudio
                  : t.toolbar.audioOverview}
              </span>
              {audioState.isPlaying && !audioState.isPaused && (
                <span className="flex items-center gap-0.5 h-2.5 ml-0.5" aria-hidden="true">
                  <span className="audio-wave-bar h-2 animate-audio-bar-1 bg-emerald-600" />
                  <span className="audio-wave-bar h-2.5 animate-audio-bar-3 bg-emerald-600" />
                  <span className="audio-wave-bar h-2 animate-audio-bar-5 bg-emerald-600" />
                </span>
              )}
            </button>

            {audioState.isPlaying && (
              <>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("utare-toggle-audio-play"))}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                  aria-label={audioState.isPaused ? "Resume audio" : "Pause audio"}
                >
                  {audioState.isPaused ? (
                    <Play className="h-3 w-3 fill-current" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">
                    {audioState.isPaused ? "Resume" : "Pause"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("utare-stop-audio"))}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 transition"
                  aria-label="Stop audio"
                >
                  <Square className="h-2.5 w-2.5 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("utare-open-video-walkthrough"))}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-[11.5px] font-semibold text-amber-900 shadow-sm hover:bg-amber-100 transition"
              title="Watch 2-Min Flow Demo"
              aria-label="Watch interactive platform flow demo"
            >
              <Video className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              <span>{t.toolbar.flowDemo}</span>
            </button>
          </div>

          <div
            role="group"
            aria-label={t.toolbar.languageLabel}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm"
          >
            <Languages className="ml-1.5 mr-1 h-3.5 w-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLang(opt.code as SupportedLanguage)}
                aria-pressed={lang === opt.code}
                title={`Switch language to ${opt.label}`}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                  lang === opt.code
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("utare-open-accessibility"))}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-800 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/60 transition"
            aria-label="Open Accessibility & Assistive Tech Settings"
          >
            <Accessibility className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            <span>{t.toolbar.accessibility}</span>
            {hasActiveA11y && (
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                title="Custom accessibility settings active"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
