"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { EmployerVerificationStatus, OrgRole, UserRole } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgRole?: OrgRole;
  employerId?: string;
  hubId?: string;
  emailConfirmed?: boolean;
  companyName?: string;
  employerVerificationStatus?: EmployerVerificationStatus;
  qualification?: string;
  fieldOfStudy?: string;
  city?: string;
  avatar?: string;
}

export const CACHED_SESSION_KEY = "utare_cached_session";
export const AUTH_SYNC_EVENT = "utare-auth-sync";

/**
 * Optimistically read cached session from localStorage.
 * Ensures the Navbar never flickers "Sign In / Create Account" on reload or navigation.
 */
export function getCachedSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHED_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.id && parsed.role) {
      return parsed as AuthUser;
    }
  } catch {}
  return null;
}

/**
 * Cache or clear session summary in localStorage and notify active tabs.
 */
export function cacheSessionUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      const summary: Partial<AuthUser> = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgRole: user.orgRole,
        employerId: user.employerId,
        hubId: user.hubId,
        emailConfirmed: user.emailConfirmed,
        companyName: user.companyName,
        employerVerificationStatus: user.employerVerificationStatus,
        qualification: user.qualification,
        fieldOfStudy: user.fieldOfStudy,
        city: user.city,
        avatar: user.avatar,
      };
      localStorage.setItem(CACHED_SESSION_KEY, JSON.stringify(summary));
    } else {
      localStorage.removeItem(CACHED_SESSION_KEY);
    }
    window.dispatchEvent(new Event(AUTH_SYNC_EVENT));
  } catch {}
}

export interface ViewModeContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperuser: boolean;
  isEmployer: boolean;
  isHub: boolean;
  isCandidate: boolean;
  isOrgAdmin: boolean;
  isOrgMember: boolean;
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
  isHub: false,
  isCandidate: false,
  isOrgAdmin: false,
  isOrgMember: false,
  setSessionUser: () => {},
  refreshSession: async () => null,
  logout: async () => {},
});

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  // Optimistically load from localStorage during initial mount
  const [user, setUser] = useState<AuthUser | null>(() => getCachedSession());
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
        cacheSessionUser(null);
        return null;
      }
      const data = await res.json();
      if (data.authenticated && data.user) {
        const u = data.user as AuthUser;
        setUser(u);
        cacheSessionUser(u);
        return u;
      }
      setUser(null);
      cacheSessionUser(null);
      return null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sync cache on mount in case client initialized earlier or SSR differed
    const cached = getCachedSession();
    if (cached) {
      setUser((current) => current || cached);
    }

    refreshSession();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHED_SESSION_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setUser(parsed);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    const handleAuthSync = () => {
      const next = getCachedSession();
      setUser(next);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(AUTH_SYNC_EVENT, handleAuthSync);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(AUTH_SYNC_EVENT, handleAuthSync);
    };
  }, [refreshSession]);

  const setSessionUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    setLoading(false);
    cacheSessionUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    cacheSessionUser(null);
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
  const isHub = user?.role === "hub";
  const isCandidate = user?.role === "candidate";
  const isOrgAdmin = user?.orgRole === "org_admin";
  const isOrgMember = user?.orgRole === "org_member";
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
        isHub,
        isCandidate,
        isOrgAdmin,
        isOrgMember,
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
