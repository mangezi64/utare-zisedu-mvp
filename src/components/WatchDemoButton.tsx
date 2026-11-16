"use client";

import React from "react";
import { Video } from "lucide-react";

export default function WatchDemoButton({
  className = "button button-gold inline-flex items-center gap-2",
  label = "Watch 2-Min Flow Demo",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("utare-open-video-walkthrough"));
      }}
      className={className}
      aria-label="Watch interactive platform flow demo and video walkthrough"
    >
      <Video className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
