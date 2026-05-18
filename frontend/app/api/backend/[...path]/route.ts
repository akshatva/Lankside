const DEFAULT_BACKEND_API_URL = "http://localhost:8000";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const DEFAULT_PROXY_TIMEOUT_MS = 20_000;
const LONG_PROXY_TIMEOUT_MS = 90_000;
const loggedProxyWarnings = new Set<string>();

type BackendRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function getBackendApiUrl() {
  return (
    process.env.BACKEND_API_URL?.trim() ||
    DEFAULT_BACKEND_API_URL
  ).replace(/\/$/, "");
}

function getForwardHeaders(request: Request) {
  const headers = new Headers(request.headers);

  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  return headers;
}

function getResponseHeaders(response: Response) {
  const headers = new Headers(response.headers);

  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  return headers;
}

function getProxyTimeout(method: string) {
  return method === "GET" || method === "HEAD"
    ? DEFAULT_PROXY_TIMEOUT_MS
    : LONG_PROXY_TIMEOUT_MS;
}

function warnProxyOnce(key: string, message: string) {
  if (loggedProxyWarnings.has(key)) {
    return;
  }

  loggedProxyWarnings.add(key);
  console.warn(message);
}

async function proxyBackendRequest(
  request: Request,
  context: BackendRouteContext,
) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(
    `/${path.map(encodeURIComponent).join("/")}${incomingUrl.search}`,
    getBackendApiUrl(),
  );
  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const timeoutMs = getProxyTimeout(method);
  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(backendUrl, {
      method,
      headers: getForwardHeaders(request),
      body,
      cache: "no-store",
      signal: controller.signal,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: getResponseHeaders(response),
    });
  } catch (error) {
    if (didTimeout || (error instanceof DOMException && error.name === "AbortError")) {
      warnProxyOnce(
        "backend-proxy-timeout",
        `Backend proxy timeout after ${Math.round(timeoutMs / 1000)}s for ${backendUrl.toString()}`,
      );
      return Response.json(
        {
          detail:
            "Server waking up... The backend took longer than expected. Please try again shortly.",
        },
        { status: 504 },
      );
    }

    warnProxyOnce(
      "backend-proxy-network",
      `Backend proxy could not reach ${backendUrl.toString()}`,
    );
    return Response.json(
      {
        detail: `Unable to reach backend API at ${getBackendApiUrl()}. Start the backend or set BACKEND_API_URL to a reachable API URL.`,
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const GET = proxyBackendRequest;
export const POST = proxyBackendRequest;
export const PUT = proxyBackendRequest;
export const PATCH = proxyBackendRequest;
export const DELETE = proxyBackendRequest;
export const HEAD = proxyBackendRequest;
export const OPTIONS = proxyBackendRequest;
