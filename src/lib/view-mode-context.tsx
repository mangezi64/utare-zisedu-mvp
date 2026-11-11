"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ViewMode = "user" | "admin";

interface ViewModeContextType {
  mode: ViewMode;
  isAdmin: boolean;
  isUser: boolean;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  mode: "user",
  isAdmin: false,
  isUser: true,
  setMode: () => {},
  toggleMode: () => {},
});

const STORAGE_KEY = "utare_view_mode";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("user");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
      if (saved === "user" || saved === "admin") {
        setModeState(saved);
      }
    } catch {}
    setMounted(true);
  }, []);

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
  };

  const toggleMode = () => {
    setMode(mode === "user" ? "admin" : "user");
  };

  // Default to "user" during SSR/hydration to avoid mismatch
  const currentMode = mounted ? mode : "user";

  return (
    <ViewModeContext.Provider
      value={{
        mode: currentMode,
        isAdmin: currentMode === "admin",
        isUser: currentMode === "user",
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
