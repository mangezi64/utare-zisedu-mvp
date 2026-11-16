"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { EmployerVerificationStatus, UserRole } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailConfirmed?: boolean;
  companyName?: string;
  employerVerificationStatus?: EmployerVerificationStatus;
  qualification?: string;
  fieldOfStudy?: string;
  city?: string;
  avatar?: string;
}

interface ViewModeContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperuser: boolean;
  isEmployer: boolean;
  isCandidate: boolean;
  setSessionUser: (user: AuthUser | null) => void;
  refreshSession: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const ViewModeContext = createContext<ViewModeContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isSuperuser: false,
  isEmployer: false,
  isCandidate: false,
  setSessionUser: () => {},
  refreshSession: async () => null,
  logout: async () => {},
});

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      // Remove legacy client-side demo storage keys if present
      try {
        localStorage.removeItem("utare-demo-user");
        localStorage.removeItem("utare_view_mode");
      } catch {}

      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        return data.user as AuthUser;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const setSessionUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "superuser";
  const isSuperuser = user?.role === "superuser";
  const isEmployer = user?.role === "employer";
  const isCandidate = user?.role === "candidate";
  const isAuthenticated = user !== null;

  return (
    <ViewModeContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isSuperuser,
        isEmployer,
        isCandidate,
        setSessionUser,
        refreshSession,
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
