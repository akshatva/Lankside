const DEFAULT_API_BASE_URL = "/api/backend";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const apiBaseUrl = (configuredApiBaseUrl || DEFAULT_API_BASE_URL).replace(
  /\/$/,
  "",
);

export const isUsingApiBaseUrlFallback = !configuredApiBaseUrl;

export function warnIfUsingApiBaseUrlFallback() {
  return;
}
