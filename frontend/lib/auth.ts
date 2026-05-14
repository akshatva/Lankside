import { useSyncExternalStore } from "react";

export type DemoSession = {
  name: string;
  email: string;
  createdAt: string;
};

const DEMO_SESSION_KEY = "lankside-demo-session";
const SESSION_CHANGE_EVENT = "lankside-demo-session-change";
let cachedStoredSession: string | null | undefined;
let cachedParsedSession: DemoSession | null = null;

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notifySessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

function isDemoSession(value: unknown): value is DemoSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as DemoSession;

  return (
    typeof session.name === "string" &&
    typeof session.email === "string" &&
    typeof session.createdAt === "string"
  );
}

/**
 * Demo authentication only. This keeps the MVP user experience coherent while
 * real server-side authentication is pending. Replace this localStorage session
 * with secure production auth before handling real accounts or passwords.
 */
export function setDemoSession(user: { name: string; email: string }) {
  if (!canUseLocalStorage()) {
    return null;
  }

  const session: DemoSession = {
    name: user.name,
    email: user.email,
    createdAt: new Date().toISOString(),
  };
  const serializedSession = JSON.stringify(session);

  window.localStorage.setItem(DEMO_SESSION_KEY, serializedSession);
  cachedStoredSession = serializedSession;
  cachedParsedSession = session;
  notifySessionChange();

  return session;
}

export function getDemoSession(): DemoSession | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const storedSession = window.localStorage.getItem(DEMO_SESSION_KEY);

  if (storedSession === cachedStoredSession) {
    return cachedParsedSession;
  }

  cachedStoredSession = storedSession;

  if (!storedSession) {
    cachedParsedSession = null;
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession);

    if (isDemoSession(parsedSession)) {
      cachedParsedSession = parsedSession;
      return parsedSession;
    }
  } catch {
    // Invalid demo session payloads are cleared below.
  }

  window.localStorage.removeItem(DEMO_SESSION_KEY);
  cachedStoredSession = null;
  cachedParsedSession = null;
  notifySessionChange();

  return null;
}

export function clearDemoSession() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(DEMO_SESSION_KEY);
  cachedStoredSession = null;
  cachedParsedSession = null;
  notifySessionChange();
}

export function isDemoAuthenticated() {
  return getDemoSession() !== null;
}

export function subscribeToDemoSession(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_CHANGE_EVENT, callback);
  };
}

export function useDemoSession() {
  return useSyncExternalStore(subscribeToDemoSession, getDemoSession, () => null);
}

export { SESSION_CHANGE_EVENT };
