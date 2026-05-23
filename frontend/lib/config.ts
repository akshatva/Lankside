const LOCAL_API_BASE_URL = "http://localhost:8000";
const PRODUCTION_API_BASE_URL = "/api/backend";

function normalizeApiBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
let didWarnAboutApiBaseUrlFallback = false;
const fallbackApiBaseUrl =
  process.env.NODE_ENV === "production"
    ? PRODUCTION_API_BASE_URL
    : LOCAL_API_BASE_URL;

export const apiBaseUrl = normalizeApiBaseUrl(
  configuredApiBaseUrl || fallbackApiBaseUrl,
);

export const isUsingApiBaseUrlFallback = !configuredApiBaseUrl;

export function warnIfUsingApiBaseUrlFallback() {
  if (
    isUsingApiBaseUrlFallback &&
    process.env.NODE_ENV === "production" &&
    typeof console !== "undefined" &&
    !didWarnAboutApiBaseUrlFallback
  ) {
    didWarnAboutApiBaseUrlFallback = true;
    console.warn(
      "NEXT_PUBLIC_API_URL is not configured. Falling back to /api/backend.",
    );
  }
}
