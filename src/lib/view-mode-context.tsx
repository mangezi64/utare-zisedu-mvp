"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ViewMode = "user" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "admin";
  qualification?: string;
  fieldOfStudy?: string;
  city?: string;
  avatar?: string;
}

interface ViewModeContextType {
  mode: ViewMode;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
  isCandidate: boolean;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
  loginAsCandidate: (custom?: Partial<AuthUser>) => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const DEFAULT_DEMO_CANDIDATE: AuthUser = {
  id: "cand-tatenda-01",
  name: "Tatenda Moyo",
  email: "demo@utaresizedu.ai",
  role: "candidate",
  qualification: "BSc Computer Science",
  fieldOfStudy: "Software Engineering & Data",
  city: "Harare",
};

const DEFAULT_ADMIN_USER: AuthUser = {
  id: "admin-stewart-01",
  name: "Stewart Mangezi (Facilitator Lead)",
  email: "admin@utare.co.zw",
  role: "admin",
  city: "Harare",
};

const ViewModeContext = createContext<ViewModeContextType>({
  mode: "user",
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isUser: true,
  isCandidate: false,
  setMode: () => {},
  toggleMode: () => {},
  loginAsCandidate: () => {},
  loginAsAdmin: () => {},
  logout: () => {},
});

const STORAGE_KEY = "utare_view_mode";
const AUTH_KEY = "utare-demo-user";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("user");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadFromStorage = () => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
      if (savedMode === "user" || savedMode === "admin") {
        setModeState(savedMode);
      }

      const savedUser = localStorage.getItem(AUTH_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const role = parsed.role || (savedMode === "admin" ? "admin" : "candidate");
        setUser({
          id: parsed.id || (role === "admin" ? "admin-01" : "cand-user-01"),
          name: parsed.name || (role === "admin" ? "Facilitator Admin" : "Utare Candidate"),
          email: parsed.email || (role === "admin" ? "admin@utare.co.zw" : "demo@utaresizedu.ai"),
          role,
          qualification: parsed.qualification,
          fieldOfStudy: parsed.fieldOfStudy,
          city: parsed.city,
        });
      }
    } catch {}
  };

  useEffect(() => {
    loadFromStorage();
    setMounted(true);

    const handleStorageChange = () => {
      loadFromStorage();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
      if (newMode === "admin") {
        if (!user || user.role !== "admin") {
          setUser(DEFAULT_ADMIN_USER);
          localStorage.setItem(AUTH_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
        }
      } else {
        if (user && user.role === "admin") {
          setUser(DEFAULT_DEMO_CANDIDATE);
          localStorage.setItem(AUTH_KEY, JSON.stringify(DEFAULT_DEMO_CANDIDATE));
        }
      }
    } catch {}
  };

  const toggleMode = () => {
    setMode(mode === "user" ? "admin" : "user");
  };

  const loginAsCandidate = (custom?: Partial<AuthUser>) => {
    const candidateUser: AuthUser = {
      ...DEFAULT_DEMO_CANDIDATE,
      ...custom,
      role: "candidate",
    };
    setUser(candidateUser);
    setModeState("user");
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(candidateUser));
      localStorage.setItem(STORAGE_KEY, "user");
    } catch {}
  };

  const loginAsAdmin = () => {
    setUser(DEFAULT_ADMIN_USER);
    setModeState("admin");
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
      localStorage.setItem(STORAGE_KEY, "admin");
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setModeState("user");
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.setItem(STORAGE_KEY, "user");
    } catch {}
  };

  const currentMode = mounted ? mode : "user";
  const currentUser = mounted ? user : null;
  const isAdmin = currentMode === "admin" || currentUser?.role === "admin";
  const isCandidate = currentUser?.role === "candidate";
  const isAuthenticated = currentUser !== null;

  return (
    <ViewModeContext.Provider
      value={{
        mode: currentMode,
        user: currentUser,
        isAuthenticated,
        isAdmin,
        isUser: !isAdmin,
        isCandidate,
        setMode,
        toggleMode,
        loginAsCandidate,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
