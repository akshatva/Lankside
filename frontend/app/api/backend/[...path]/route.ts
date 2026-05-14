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

type BackendRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function getBackendApiUrl() {
  return (
    process.env.BACKEND_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
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

  try {
    const response = await fetch(backendUrl, {
      method,
      headers: getForwardHeaders(request),
      body,
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: getResponseHeaders(response),
    });
  } catch {
    return Response.json(
      {
        detail: `Unable to reach backend API at ${getBackendApiUrl()}. Start the backend or set BACKEND_API_URL to a reachable API URL.`,
      },
      { status: 502 },
    );
  }
}

export const GET = proxyBackendRequest;
export const POST = proxyBackendRequest;
export const PUT = proxyBackendRequest;
export const PATCH = proxyBackendRequest;
export const DELETE = proxyBackendRequest;
export const HEAD = proxyBackendRequest;
export const OPTIONS = proxyBackendRequest;
