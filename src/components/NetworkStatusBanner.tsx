"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function NetworkStatusBanner() {
  const { t } = useLanguage();
  const [isOffline, setIsOffline] = useState(false);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOffline = () => {
      setIsOffline(true);
      setJustRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustRestored(true);
      if (restoreTimer) clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        setJustRestored(false);
      }, 6000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (restoreTimer) clearTimeout(restoreTimer);
    };
  }, []);

  if (!isOffline && !justRestored) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`no-print border-b px-4 py-2 text-xs font-medium transition-colors ${
        isOffline
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-emerald-300 bg-emerald-50 text-emerald-950"
      }`}
    >
      <div className="mx-auto flex max-w-[1220px] items-center gap-2">
        {isOffline ? (
          <WifiOff className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        ) : (
          <Wifi className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
        )}
        <span>
          {isOffline ? t.network.offlineBanner : t.network.onlineRestored}
        </span>
      </div>
    </div>
  );
}
