import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  CACHED_SESSION_KEY,
  AUTH_SYNC_EVENT,
  cacheSessionUser,
  getCachedSession,
  AuthUser,
} from "@/lib/view-mode-context";

describe("Navigation & Session Persistence", () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    // Setup mock localStorage and window for node test environment
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

    const fakeLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      }),
    };

    const listeners: Record<string, Function[]> = {};

    const fakeWindow = {
      localStorage: fakeLocalStorage,
      location: { host: "localhost:3000" },
      history: { length: 2 },
      addEventListener: vi.fn((event: string, cb: Function) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: Function) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((f) => f !== cb);
        }
      }),
      dispatchEvent: vi.fn((event: Event) => {
        const cbs = listeners[event.type] || [];
        cbs.forEach((fn) => fn(event));
        return true;
      }),
    };

    // @ts-ignore
    global.window = fakeWindow;
    // @ts-ignore
    global.localStorage = fakeLocalStorage;
  });

  afterEach(() => {
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.localStorage;
  });

  it("uses the exact key 'utare_cached_session'", () => {
    expect(CACHED_SESSION_KEY).toBe("utare_cached_session");
  });

  it("returns null when localStorage has no session cached", () => {
    const session = getCachedSession();
    expect(session).toBeNull();
  });

  it("caches candidate session correctly on successful login and retrieves it optimistically", () => {
    const candidateUser: AuthUser = {
      id: "usr-cand-101",
      name: "Chipo Nyamande",
      email: "chipo.nyamande@example.co.zw",
      role: "candidate",
      city: "Harare",
      qualification: "Bachelors Degree",
      fieldOfStudy: "BSc Honours in Economics & Statistics",
    };

    cacheSessionUser(candidateUser);

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      CACHED_SESSION_KEY,
      expect.stringContaining("Chipo Nyamande")
    );

    const retrieved = getCachedSession();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe("usr-cand-101");
    expect(retrieved?.name).toBe("Chipo Nyamande");
    expect(retrieved?.role).toBe("candidate");
    expect(retrieved?.city).toBe("Harare");
  });

  it("caches employer and admin sessions and dispatches utare-auth-sync", () => {
    const syncSpy = vi.fn();
    window.addEventListener(AUTH_SYNC_EVENT, syncSpy);

    const adminUser: AuthUser = {
      id: "usr-admin-01",
      name: "Stewart Mangezi",
      email: "stewart@utare.org",
      role: "admin",
    };

    cacheSessionUser(adminUser);

    expect(syncSpy).toHaveBeenCalled();
    const retrieved = getCachedSession();
    expect(retrieved?.role).toBe("admin");
    expect(retrieved?.name).toBe("Stewart Mangezi");
  });

  it("clears cached session on logout and handles corrupted storage gracefully", () => {
    const user: AuthUser = {
      id: "usr-test-1",
      name: "Test User",
      email: "test@example.com",
      role: "candidate",
    };
    cacheSessionUser(user);
    expect(getCachedSession()).not.toBeNull();

    // Log out / clear
    cacheSessionUser(null);
    expect(getCachedSession()).toBeNull();

    // Corrupted JSON
    mockStorage[CACHED_SESSION_KEY] = "invalid-json{";
    expect(getCachedSession()).toBeNull();
  });
});
