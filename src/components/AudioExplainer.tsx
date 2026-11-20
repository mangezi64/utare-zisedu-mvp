"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { SupportedLanguage, useLanguage } from "@/lib/language-context";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  FastForward,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface AudioChapter {
  id: string;
  title: string;
  shortTitle: string;
  tagline: string;
  durationEstimate: string;
  text: string;
}

export const AUDIO_CHAPTERS: AudioChapter[] = [
  {
    id: "mission",
    title: "1. Welcome & Why We Built Utare",
    shortTitle: "Welcome",
    tagline: "Connecting Zimbabwean talent to global remote income",
    durationEstimate: "45s",
    text: "Hi there, and a warm welcome to Utare. We built this platform right here in Zimbabwe because we understand firsthand how challenging it is for graduates and ambitious young professionals. You study hard, you graduate, but the local market has very few formal openings. Meanwhile, international companies are looking for talented, reliable remote workers every single day. Utare is your bridge to those global jobs. We help you showcase what you can actually do, build an authentic professional CV, and connect to solar-powered community hubs whenever power or internet lets you down.",
  },
  {
    id: "diagnostic",
    title: "2. The Friendly Career Diagnostic",
    shortTitle: "Diagnostic",
    tagline: "Discover your true remote superpowers",
    durationEstimate: "40s",
    text: "Your journey starts with our Career Diagnostic. Please don't worry, this isn't a stressful exam or academic test. Think of it as a helpful chat that maps your practical strengths, digital skills, and problem-solving abilities. Whether your background is in engineering, business, or the humanities, our AI diagnostic matches your natural aptitude to high-demand remote roles, like cloud development, data operations, customer support, or digital project coordination.",
  },
  {
    id: "cv-studio",
    title: "3. Tailored CV Studio",
    shortTitle: "CV Studio",
    tagline: "Resumes that get you real interviews",
    durationEstimate: "40s",
    text: "Next is the Tailored CV Studio. Let's be honest, generic resumes often get lost in automated company filters. Utare fixes that. We translate your assessment highlights and real-world project skills into a clean, professional, ATS-friendly CV. You can download your tailored CV and cover letter in Microsoft Word or PDF with a single click, ready to impress international hiring managers.",
  },
  {
    id: "hubs-coaching",
    title: "4. Solar Hubs & Community Support",
    shortTitle: "Hubs & Community",
    tagline: "Reliable power, fast Wi-Fi, and peer mentorship",
    durationEstimate: "45s",
    text: "Finally, we remove the daily infrastructure headaches of remote work. Through our partner innovation hubs across Harare, Bulawayo, Mutare, and other towns, you get access to solar electricity, fast Starlink internet, and comfortable desks to do your work. Combined with our peer community and verified mentors, you'll have all the support you need from your first application all the way to your first remote paycheck.",
  },
];

export const AUDIO_CHAPTERS_BY_LANG: Record<SupportedLanguage, AudioChapter[]> = {
  en: AUDIO_CHAPTERS,
  sn: [
    {
      id: "mission",
      title: "1. Mauya kuUtare & Chinangwa Chedu",
      shortTitle: "Mauya",
      tagline: "Kubatanidza veZimbabwe nemabasa epasi rose",
      durationEstimate: "45s",
      text: "Mauya kuUtare. Takavaka chikuva chino muZimbabwe kuti tibatsire vechidiki nevadzidzi vane unyanzvi kuwana mabasa epasi rose. Kunyangwe magetsi kana data rikapera, zvamanyora zvinochengetwa mudhivaizi yenyu, uye maPartner Hubs edu ane solar neStarlink.",
    },
    {
      id: "diagnostic",
      title: "2. Ongororo yeNzira yeBasa",
      shortTitle: "Ongororo",
      tagline: "Ziva simba rako remarhizhinji",
      durationEstimate: "40s",
      text: "Rwendo rwako rwunotanga neOngororo yeBasa. Inoongorora unyanzvi hwako, chikoro, uye mamiriro emagetsi kana laputopu kuti ikuratidze nzira yemazuva makumi mapfumbamwe nemurairidzi wemuZimbabwe.",
    },
    {
      id: "cv-studio",
      title: "3. CV Studio Yakagadzirirwa ATS",
      shortTitle: "CV Studio",
      tagline: "MaCV anokuwanisa mabasa",
      durationEstimate: "40s",
      text: "MuCV Studio, tinoshandura zivo yako kuita CV netsamba yebasa zvakachena zvinopinda mumasisitimu emakambani epasi rose. Unogona kudhaunirodha muWord kana PDF.",
    },
    {
      id: "hubs-coaching",
      title: "4. MaSolar Hubs & Varairidzi",
      shortTitle: "Hubs & Rubatsiro",
      tagline: "Magetsi esolar, Starlink Wi-Fi & varairidzi",
      durationEstimate: "45s",
      text: "Kuburikidza nemaPartner Hubs muHarare, Bulawayo, Mutare, Gweru neMasvingo, unowana magetsi esolar, Starlink internet, uye rubatsiro rwevarairidzi kubva pakunyorera kusvika pakuwana mari.",
    },
  ],
  nd: [
    {
      id: "mission",
      title: "1. Siyakwamukela kuUtare",
      shortTitle: "Siyakwamukela",
      tagline: "Ukuxhumanisa abase-Zimbabwe lemisebenzi yomhlaba",
      durationEstimate: "45s",
      text: "Siyakwamukela kuUtare. Sakhe loluhlelo e-Zimbabwe ukusiza abafundileyo labalamakhono ukuthola imisebenzi ye-remote emhlabeni. Lanxa ugesi kumbe i-data iphela, okubhalileyo kuyagcinwa kudivayisi yakho.",
    },
    {
      id: "diagnostic",
      title: "2. Ukuhlolwa Kwendlela Yomsebenzi",
      shortTitle: "Ukuhlolwa",
      tagline: "Thola amandla akho omsebenzi",
      durationEstimate: "40s",
      text: "Uhambo lwakho luqala ngokuhlolwa okulula okukhangela imfundo yakho, amakhono, lesimo sogesi kumbe ikhompyutha ukuze uthole uhlelo lwensuku ezingamatshumi ayisithupha lomcebisi.",
    },
    {
      id: "cv-studio",
      title: "3. I-CV Studio ye-ATS",
      shortTitle: "CV Studio",
      tagline: "Ama-CV akulethela ama-interview",
      durationEstimate: "40s",
      text: "Ku-CV Studio, sitshintsha amakhono akho abe yi-CV lencwadi yesicelo elungele amakampani aphetsheya. Ungakhipha nge-Word kumbe nge-PDF.",
    },
    {
      id: "hubs-coaching",
      title: "4. Ama-Solar Hubs & Abacebisi",
      shortTitle: "Hubs & Usizo",
      tagline: "Ugesi we-solar, i-Starlink Wi-Fi labacebisi",
      durationEstimate: "45s",
      text: "Ngama-Partner Hubs e-Harare, Bulawayo, Mutare, Gweru le-Masvingo, uthola ugesi we-solar, i-Starlink internet, lamakhompyutha kanye losizo lwabacebisi.",
    },
  ],
};

const SPEECH_RATES = [0.85, 1.0, 1.25, 1.5];

export default function AudioExplainer() {
  const { lang } = useLanguage();
  const langRef = useRef<SupportedLanguage>(lang);
  langRef.current = lang;
  const activeChapters = AUDIO_CHAPTERS_BY_LANG[lang] || AUDIO_CHAPTERS;
  const activeChaptersRef = useRef<AudioChapter[]>(activeChapters);
  activeChaptersRef.current = activeChapters;

  const pathname = usePathname();
  const prevPathnameRef = useRef<string>(pathname);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [srAnnouncement, setSrAnnouncement] = useState<string>("");

  const currentChapterIndexRef = useRef<number>(currentChapterIndex);
  currentChapterIndexRef.current = currentChapterIndex;

  const speechRateRef = useRef<number>(speechRate);
  speechRateRef.current = speechRate;

  const selectedVoiceURIRef = useRef<string>(selectedVoiceURI);
  selectedVoiceURIRef.current = selectedVoiceURI;

  const voicesRef = useRef<SpeechSynthesisVoice[]>(voices);
  voicesRef.current = voices;

  const playChapterRef = useRef<(index: number) => void>(() => {});

  // Initialize Web Speech API & load voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
          voicesRef.current = available;
          // Look for warm, natural, human English voices
          const preferred =
            available.find((v) => v.lang.startsWith("en-ZA")) ||
            available.find(
              (v) =>
                (v.name.toLowerCase().includes("premium") ||
                  v.name.toLowerCase().includes("enhanced")) &&
                v.lang.startsWith("en")
            ) ||
            available.find(
              (v) =>
                v.name.toLowerCase().includes("natural") &&
                v.lang.startsWith("en")
            ) ||
            available.find(
              (v) =>
                (v.name.toLowerCase().includes("samantha") ||
                  v.name.toLowerCase().includes("serena") ||
                  v.name.toLowerCase().includes("karen") ||
                  v.name.toLowerCase().includes("daniel") ||
                  v.name.toLowerCase().includes("oliver") ||
                  v.name.toLowerCase().includes("stephanie")) &&
                v.lang.startsWith("en")
            ) ||
            available.find(
              (v) =>
                v.name.toLowerCase().includes("google") &&
                v.lang.startsWith("en")
            ) ||
            available.find((v) => v.lang.startsWith("en-GB")) ||
            available.find((v) => v.lang.startsWith("en-US")) ||
            available.find((v) => v.lang.startsWith("en"));
          if (preferred && !selectedVoiceURIRef.current) {
            setSelectedVoiceURI(preferred.voiceURI);
            selectedVoiceURIRef.current = preferred.voiceURI;
          }
        }
      } catch (err) {
        console.warn("Could not load speech synthesis voices:", err);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Listen for custom trigger events from page toolbars & AccessibilityControls
    const handleTrigger = () => {
      setIsOpen(true);
    };
    const handleStopEvent = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChapterIndex(0);
      setIsOpen(false);
    };
    const handlePageExit = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };

    window.addEventListener("utare-open-audio-explainer", handleTrigger);
    window.addEventListener("utare-stop-audio", handleStopEvent);
    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", handlePageExit);

    return () => {
      window.removeEventListener("utare-open-audio-explainer", handleTrigger);
      window.removeEventListener("utare-stop-audio", handleStopEvent);
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", handlePageExit);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  // Stop & tuck audio away whenever the user navigates to a different page
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChapterIndex(0);
      setIsOpen(false);
    }
  }, [pathname]);

  // Broadcast live audio state to in-flow toolbars (top & footer)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const chapter = activeChapters[currentChapterIndex];
    window.dispatchEvent(
      new CustomEvent("utare-audio-state", {
        detail: {
          isPlaying,
          isPaused,
          shortTitle: chapter?.shortTitle,
        },
      })
    );
  }, [isPlaying, isPaused, currentChapterIndex, activeChapters]);

  const playChapter = useCallback((index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const chapter = activeChaptersRef.current[index];
      if (!chapter) return;

      const utterance = new SpeechSynthesisUtterance(chapter.text);
      utterance.lang =
        langRef.current === "sn"
          ? "sn-ZW"
          : langRef.current === "nd"
            ? "nd-ZW"
            : "en-ZA";
      // Gentle, relaxed conversational human cadence
      utterance.rate = Math.max(0.75, speechRateRef.current * 0.94);
      utterance.pitch = 1.02;

      const activeVoices = voicesRef.current;
      const voiceUri = selectedVoiceURIRef.current;
      if (voiceUri && activeVoices.length > 0) {
        const match = activeVoices.find((v) => v.voiceURI === voiceUri);
        if (match) utterance.voice = match;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentChapterIndex(index);
        setSrAnnouncement(`Now playing: ${chapter.title}`);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utterance.onend = () => {
        const nextIndex = index + 1;
        if (nextIndex < AUDIO_CHAPTERS.length) {
          setCurrentChapterIndex(nextIndex);
          playChapter(nextIndex);
        } else {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
              window.speechSynthesis.cancel();
            } catch {}
          }
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentChapterIndex(0);
          setIsOpen(false);
          setSrAnnouncement("UTARE audio walkthrough complete.");
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("SpeechSynthesis error:", e.error);
          setIsPlaying(false);
          setIsPaused(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis play failed:", err);
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  playChapterRef.current = playChapter;

  const handlePlayPause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!isPlaying) {
      playChapter(currentChapterIndex);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setSrAnnouncement("Resumed audio explainer.");
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setSrAnnouncement("Paused audio explainer.");
    }
  }, [isPlaying, isPaused, currentChapterIndex, playChapter]);

  useEffect(() => {
    const handleToggle = () => {
      handlePlayPause();
    };
    window.addEventListener("utare-toggle-audio-play", handleToggle);
    return () => {
      window.removeEventListener("utare-toggle-audio-play", handleToggle);
    };
  }, [handlePlayPause]);

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChapterIndex(0);
    setSrAnnouncement("Stopped audio explainer.");
  };

  const handleStopAndClose = () => {
    handleStop();
    setIsOpen(false);
  };

  const handleNextChapter = () => {
    const next = (currentChapterIndex + 1) % AUDIO_CHAPTERS.length;
    setCurrentChapterIndex(next);
    if (isPlaying) {
      playChapter(next);
    }
  };

  const handlePrevChapter = () => {
    const prev = (currentChapterIndex - 1 + AUDIO_CHAPTERS.length) % AUDIO_CHAPTERS.length;
    setCurrentChapterIndex(prev);
    if (isPlaying) {
      playChapter(prev);
    }
  };

  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    speechRateRef.current = newRate;
    if (isPlaying && !isPaused) {
      // Re-trigger current chapter with new rate
      playChapter(currentChapterIndex);
    }
    setSrAnnouncement(`Speech rate changed to ${newRate}x.`);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    setSelectedVoiceURI(uri);
    selectedVoiceURIRef.current = uri;
    if (isPlaying && !isPaused) {
      playChapter(currentChapterIndex);
    }
  };

  const currentChapter = activeChapters[currentChapterIndex] || activeChapters[0];

  return (
    <>
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>

      {/* Audio Explainer Modal / Bottom Sheet (tucked away when closed, finished, or leaving page) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="UTARE ZEM AI Audio Explainer & Walkthrough"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-sm print:hidden animate-in fade-in duration-150"
        >
          <section
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 text-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-700/80 p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Volume2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    UTARE ZEM AI Audio Walkthrough
                    <span className="text-[0.72rem] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Voice Guide
                    </span>
                  </h3>
                  <p className="text-[0.78rem] text-slate-400">
                    Mission, Career Diagnostic, CV Studio &amp; Partner Hubs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isPlaying && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    aria-label="Minimize Audio Explainer while playing"
                    title="Minimize"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleStopAndClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  aria-label="Stop and close Audio Explainer"
                  title="Stop & Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

          {/* Graceful Fallback Notice if Speech Synthesis Not Supported */}
          {!isSupported && (
            <div className="my-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <VolumeX className="w-4 h-4 text-amber-400" />
                Speech Synthesis Unavailable
              </p>
              <p className="text-[0.78rem] text-amber-300/90 leading-relaxed">
                Your browser or environment does not support native text-to-speech. You can read the complete guided walkthrough below in the transcript.
              </p>
            </div>
          )}

          {/* Active Chapter Card & Animated Waveform */}
          <div className="my-3.5 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[0.72rem] font-bold tracking-wider uppercase text-emerald-400">
                {currentChapter.title}
              </span>
              <span className="text-[0.72rem] text-slate-400 font-mono">
                {currentChapter.durationEstimate}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-100 mb-1">
              {currentChapter.tagline}
            </p>

            {/* Visual Waveform Animation */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-700/50">
              <div className="flex items-end gap-1 h-6">
                <span
                  className={`w-1 rounded-full ${
                    isPlaying && !isPaused
                      ? "audio-wave-bar h-5 animate-audio-bar-1 bg-emerald-400"
                      : "h-2 bg-slate-600"
                  }`}
                />
                <span
                  className={`w-1 rounded-full ${
                    isPlaying && !isPaused
                      ? "audio-wave-bar h-6 animate-audio-bar-2 bg-emerald-400"
                      : "h-3 bg-slate-600"
                  }`}
                />
                <span
                  className={`w-1 rounded-full ${
                    isPlaying && !isPaused
                      ? "audio-wave-bar h-4 animate-audio-bar-3 bg-emerald-400"
                      : "h-1.5 bg-slate-600"
                  }`}
                />
                <span
                  className={`w-1 rounded-full ${
                    isPlaying && !isPaused
                      ? "audio-wave-bar h-6 animate-audio-bar-4 bg-emerald-400"
                      : "h-3.5 bg-slate-600"
                  }`}
                />
                <span
                  className={`w-1 rounded-full ${
                    isPlaying && !isPaused
                      ? "audio-wave-bar h-5 animate-audio-bar-5 bg-emerald-400"
                      : "h-2 bg-slate-600"
                  }`}
                />
                <span
                  className={`w-1 rounded-full ${
                    isPlaying && !isPaused
                      ? "audio-wave-bar h-3 animate-audio-bar-6 bg-emerald-400"
                      : "h-1.5 bg-slate-600"
                  }`}
                />
              </div>

              <span className="text-[0.72rem] font-medium text-slate-400">
                {isPlaying
                  ? isPaused
                    ? "Paused"
                    : `Speaking at ${speechRate}x`
                  : "Ready to play"}
              </span>
            </div>
          </div>

          {/* Chapter Quick Tabs */}
          <div className="grid grid-cols-4 gap-1 mb-3.5">
            {activeChapters.map((chap, idx) => {
              const isActive = idx === currentChapterIndex;
              return (
                <button
                  key={chap.id}
                  onClick={() => {
                    setCurrentChapterIndex(idx);
                    playChapter(idx);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[0.72rem] font-semibold text-center transition-all ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                  aria-label={`Jump to Chapter ${idx + 1}: ${chap.title}`}
                >
                  Ch. {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Playback Controls Bar */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevChapter}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Previous Chapter"
                title="Previous Chapter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={!isSupported}
                className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={isPlaying && !isPaused ? "Pause Audio Walkthrough" : "Play Audio Walkthrough"}
                title={isPlaying && !isPaused ? "Pause" : "Play"}
              >
                {isPlaying && !isPaused ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleStop}
                disabled={!isSupported || (!isPlaying && !isPaused)}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Stop Audio"
                title="Stop"
              >
                <Square className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleNextChapter}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Next Chapter"
                title="Next Chapter"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speech Rate Controls */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/60">
              {SPEECH_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-1.5 py-0.5 rounded text-[0.72rem] font-bold transition-all ${
                    speechRate === rate
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                  aria-label={`Set speech speed to ${rate}x`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection (if multiple voices available) */}
          {voices.length > 1 && (
            <div className="mb-3 flex items-center justify-between gap-2 text-xs">
              <label htmlFor="voice-select" className="text-[0.78rem] text-slate-400 whitespace-nowrap">
                Voice Accent:
              </label>
              <select
                id="voice-select"
                value={selectedVoiceURI}
                onChange={handleVoiceChange}
                className="w-full max-w-[240px] text-[0.78rem] bg-slate-800 text-slate-200 border border-slate-700 rounded-lg py-1 px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 truncate"
              >
                {voices
                  .filter((v) => v.lang.startsWith("en"))
                  .map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Read Along Transcript Accordion */}
          <div className="border-t border-slate-800 pt-2">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between text-left py-1 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
              aria-expanded={showTranscript}
              aria-controls="audio-transcript-content"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Read Along Transcript
              </span>
              {showTranscript ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showTranscript && (
              <div
                id="audio-transcript-content"
                className="mt-2.5 max-h-48 overflow-y-auto space-y-2.5 pr-1 text-slate-300 text-xs leading-relaxed border-t border-slate-800/80 pt-2"
              >
                {activeChapters.map((chap, idx) => {
                  const isActive = idx === currentChapterIndex;
                  return (
                    <div
                      key={chap.id}
                      className={`p-2.5 rounded-lg border transition-all ${
                        isActive
                          ? "bg-emerald-950/40 border-emerald-500/40 text-slate-100 shadow-sm"
                          : "bg-slate-800/40 border-slate-700/40 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[0.78rem] text-emerald-400">
                          {chap.title}
                        </span>
                        {isActive && isPlaying && !isPaused && (
                          <span className="text-[0.72rem] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                            Speaking
                          </span>
                        )}
                      </div>
                      <p className="text-[0.78rem]">{chap.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visual Interactive Video Demo Alternative */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[0.78rem]">
            <span className="text-slate-400">Prefer a visual video walkthrough?</span>
            <button
              type="button"
              onClick={() => {
                handleStop();
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("utare-open-video-walkthrough"));
              }}
              className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 flex items-center gap-1 transition"
            >
              Watch Video Flow Demo 🎥
            </button>
          </div>
          </section>
        </div>
      )}
    </>
  );
}
