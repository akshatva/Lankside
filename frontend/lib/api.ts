import type {
  AuditFinding,
  AuditRunResponse,
  AuditSeverity,
} from "@/types/audit";
import type {
  DemoResetResponse,
  DemoSeedResponse,
  DemoSummary,
} from "@/types/admin";
import type { Business, BusinessPayload } from "@/types/business";
import type { DocumentRecord } from "@/types/document";
import type {
  GrantMatchRunResponse,
  Scheme,
  SchemeMatch,
  SchemeSeedResponse,
} from "@/types/grants";
import type { MOU, MOUGenerateRequest, MOUStatus, MOUUpdate } from "@/types/mou";
import type { LRIScore, LRIScoreHistory, LRIScoreResult } from "@/types/lri";
import type {
  Report,
  ReportGenerateResponse,
  ReportStatus,
  ReportSummary,
} from "@/types/report";

export const backendApiUrl = (
  process.env.NEXT_PUBLIC_API_URL?.trim() ?? ""
).replace(/\/$/, "");

export type ApiResult<T> =
  | {
      ok: true;
      status: number;
      data: T;
    }
  | {
      ok: false;
      status?: number;
      error: string;
    };

export type BackendHealth = {
  status: string;
  service: string;
  version?: string;
};

export type BackendStatus = {
  api_status: string;
  environment: string;
  database_url_present: boolean;
  redis_url_present: boolean;
};

async function requestBackend<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  if (!backendApiUrl) {
    return {
      ok: false,
      error: "NEXT_PUBLIC_API_URL is not configured.",
    };
  }

  try {
    const headers =
      options.body instanceof FormData
        ? {
            Accept: "application/json",
            ...options.headers,
          }
        : {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...options.headers,
          };

    const response = await fetch(`${backendApiUrl}${path}`, {
      cache: "no-store",
      headers,
      ...options,
    });

    if (!response.ok) {
      const fallback = `Request failed with status ${response.status}`;
      let error = fallback;

      try {
        const body = await response.json();
        if (typeof body.detail === "string") {
          error = body.detail;
        } else if (Array.isArray(body.detail)) {
          error =
            body.detail
              .map((item: { msg?: string }) => item.msg)
              .filter(Boolean)
              .join(", ") || fallback;
        }
      } catch {
        error = fallback;
      }

      return {
        ok: false,
        status: response.status,
        error,
      };
    }

    if (response.status === 204) {
      return {
        ok: true,
        status: response.status,
        data: undefined as T,
      };
    }

    const data = (await response.json()) as T;

    return {
      ok: true,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to reach backend API",
    };
  }
}

export function getBackendHealth() {
  return requestBackend<BackendHealth>("/health");
}

export function getBackendV1Health() {
  return requestBackend<BackendHealth>("/api/v1/health");
}

export function getBackendStatus() {
  return requestBackend<BackendStatus>("/api/v1/status");
}

async function unwrapApiResult<T>(result: ApiResult<T>): Promise<T> {
  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.data;
}

export async function createBusiness(
  data: BusinessPayload,
): Promise<Business> {
  return unwrapApiResult(
    await requestBackend<Business>("/api/v1/businesses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  );
}

export async function getBusinesses(): Promise<Business[]> {
  return unwrapApiResult(await requestBackend<Business[]>("/api/v1/businesses"));
}

export async function getBusiness(id: number): Promise<Business> {
  return unwrapApiResult(
    await requestBackend<Business>(`/api/v1/businesses/${id}`),
  );
}

export async function updateBusiness(
  id: number,
  data: Partial<BusinessPayload>,
): Promise<Business> {
  return unwrapApiResult(
    await requestBackend<Business>(`/api/v1/businesses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  );
}

export async function deleteBusiness(id: number): Promise<void> {
  return unwrapApiResult(
    await requestBackend<void>(`/api/v1/businesses/${id}`, {
      method: "DELETE",
    }),
  );
}

type DocumentListResponse = {
  documents: DocumentRecord[];
};

export type DocumentFilters = {
  businessId?: number;
  documentType?: string;
  status?: string;
};

export async function uploadDocument(
  businessId: number,
  documentType: string,
  file: File,
): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("business_id", String(businessId));
  formData.append("document_type", documentType);
  formData.append("file", file);

  return unwrapApiResult(
    await requestBackend<DocumentRecord>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    }),
  );
}

export async function getDocuments(
  filters: DocumentFilters = {},
): Promise<DocumentRecord[]> {
  const params = new URLSearchParams();
  if (filters.businessId !== undefined) {
    params.set("business_id", String(filters.businessId));
  }
  if (filters.documentType) {
    params.set("document_type", filters.documentType);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();
  const result = await unwrapApiResult(
    await requestBackend<DocumentListResponse>(
      `/api/v1/documents${query ? `?${query}` : ""}`,
    ),
  );
  return result.documents;
}

export async function getDocument(id: number): Promise<DocumentRecord> {
  return unwrapApiResult(
    await requestBackend<DocumentRecord>(`/api/v1/documents/${id}`),
  );
}

export async function deleteDocument(id: number): Promise<void> {
  return unwrapApiResult(
    await requestBackend<void>(`/api/v1/documents/${id}`, {
      method: "DELETE",
    }),
  );
}

export function downloadDocument(id: number): string {
  return backendApiUrl
    ? `${backendApiUrl}/api/v1/documents/${id}/download`
    : "#";
}

export type AuditFindingFilters = {
  businessId?: number;
  severity?: AuditSeverity;
  isResolved?: boolean;
};

export async function runAudit(businessId: number): Promise<AuditRunResponse> {
  return unwrapApiResult(
    await requestBackend<AuditRunResponse>(
      `/api/v1/audit/${businessId}/run`,
      {
        method: "POST",
      },
    ),
  );
}

export async function getAuditFindings(
  filters: AuditFindingFilters = {},
): Promise<AuditFinding[]> {
  const params = new URLSearchParams();
  if (filters.businessId !== undefined) {
    params.set("business_id", String(filters.businessId));
  }
  if (filters.severity) {
    params.set("severity", filters.severity);
  }
  if (filters.isResolved !== undefined) {
    params.set("is_resolved", String(filters.isResolved));
  }

  const query = params.toString();
  return unwrapApiResult(
    await requestBackend<AuditFinding[]>(
      `/api/v1/audit${query ? `?${query}` : ""}`,
    ),
  );
}

export async function getAuditFinding(id: number): Promise<AuditFinding> {
  return unwrapApiResult(
    await requestBackend<AuditFinding>(`/api/v1/audit/${id}`),
  );
}

export async function resolveAuditFinding(id: number): Promise<AuditFinding> {
  return unwrapApiResult(
    await requestBackend<AuditFinding>(`/api/v1/audit/${id}/resolve`, {
      method: "PATCH",
    }),
  );
}

export async function deleteAuditFinding(id: number): Promise<void> {
  return unwrapApiResult(
    await requestBackend<void>(`/api/v1/audit/${id}`, {
      method: "DELETE",
    }),
  );
}

export type MOUFilters = {
  businessId?: number;
  status?: MOUStatus;
};

export async function generateMOU(data: MOUGenerateRequest): Promise<MOU> {
  return unwrapApiResult(
    await requestBackend<MOU>("/api/v1/mous/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  );
}

export async function getMOUs(filters: MOUFilters = {}): Promise<MOU[]> {
  const params = new URLSearchParams();
  if (filters.businessId !== undefined) {
    params.set("business_id", String(filters.businessId));
  }
  if (filters.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return unwrapApiResult(
    await requestBackend<MOU[]>(`/api/v1/mous${query ? `?${query}` : ""}`),
  );
}

export async function getMOU(id: number): Promise<MOU> {
  return unwrapApiResult(await requestBackend<MOU>(`/api/v1/mous/${id}`));
}

export async function updateMOU(id: number, data: MOUUpdate): Promise<MOU> {
  return unwrapApiResult(
    await requestBackend<MOU>(`/api/v1/mous/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  );
}

export async function exportMOUPDF(id: number): Promise<MOU> {
  return unwrapApiResult(
    await requestBackend<MOU>(`/api/v1/mous/${id}/export-pdf`, {
      method: "POST",
    }),
  );
}

export function downloadMOUPDF(id: number): string {
  return backendApiUrl ? `${backendApiUrl}/api/v1/mous/${id}/download` : "#";
}

export async function deleteMOU(id: number): Promise<void> {
  return unwrapApiResult(
    await requestBackend<void>(`/api/v1/mous/${id}`, {
      method: "DELETE",
    }),
  );
}

export async function calculateLRI(
  businessId: number,
): Promise<LRIScoreResult> {
  return unwrapApiResult(
    await requestBackend<LRIScoreResult>(
      `/api/v1/lri/${businessId}/calculate`,
      {
        method: "POST",
      },
    ),
  );
}

export async function getLatestLRI(businessId: number): Promise<LRIScore> {
  return unwrapApiResult(
    await requestBackend<LRIScore>(`/api/v1/lri/${businessId}/latest`),
  );
}

export async function getLRIHistory(
  businessId: number,
): Promise<LRIScoreHistory> {
  return unwrapApiResult(
    await requestBackend<LRIScoreHistory>(
      `/api/v1/lri/${businessId}/history`,
    ),
  );
}

export async function getLRIScore(scoreId: number): Promise<LRIScore> {
  return unwrapApiResult(
    await requestBackend<LRIScore>(`/api/v1/lri/score/${scoreId}`),
  );
}

export async function deleteLRIScore(scoreId: number): Promise<void> {
  return unwrapApiResult(
    await requestBackend<void>(`/api/v1/lri/score/${scoreId}`, {
      method: "DELETE",
    }),
  );
}

export async function seedSchemes(): Promise<SchemeSeedResponse> {
  return unwrapApiResult(
    await requestBackend<SchemeSeedResponse>("/api/v1/grants/seed-schemes", {
      method: "POST",
    }),
  );
}

export async function getSchemes(): Promise<Scheme[]> {
  return unwrapApiResult(await requestBackend<Scheme[]>("/api/v1/grants/schemes"));
}

export async function getScheme(id: number): Promise<Scheme> {
  return unwrapApiResult(
    await requestBackend<Scheme>(`/api/v1/grants/schemes/${id}`),
  );
}

export async function runGrantMatching(
  businessId: number,
): Promise<GrantMatchRunResponse> {
  return unwrapApiResult(
    await requestBackend<GrantMatchRunResponse>(
      `/api/v1/grants/${businessId}/match`,
      {
        method: "POST",
      },
    ),
  );
}

export async function getGrantMatches(
  businessId: number,
): Promise<SchemeMatch[]> {
  return unwrapApiResult(
    await requestBackend<SchemeMatch[]>(
      `/api/v1/grants/${businessId}/matches`,
    ),
  );
}

export async function clearGrantMatches(businessId: number): Promise<void> {
  return unwrapApiResult(
    await requestBackend<void>(`/api/v1/grants/${businessId}/matches`, {
      method: "DELETE",
    }),
  );
}

export type ReportFilters = {
  businessId?: number;
  status?: ReportStatus;
};

export async function generateBankabilityReport(
  businessId: number,
): Promise<ReportGenerateResponse> {
  return unwrapApiResult(
    await requestBackend<ReportGenerateResponse>(
      `/api/v1/reports/${businessId}/generate`,
      {
        method: "POST",
      },
    ),
  );
}

export async function getReports(
  filters: ReportFilters = {},
): Promise<ReportSummary[]> {
  const params = new URLSearchParams();
  if (filters.businessId !== undefined) {
    params.set("business_id", String(filters.businessId));
  }
  if (filters.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return unwrapApiResult(
    await requestBackend<ReportSummary[]>(
      `/api/v1/reports${query ? `?${query}` : ""}`,
    ),
  );
}

export async function getReport(id: number): Promise<Report> {
  return unwrapApiResult(
    await requestBackend<Report>(`/api/v1/reports/${id}`),
  );
}

export function downloadReportPDF(id: number): string {
  return backendApiUrl ? `${backendApiUrl}/api/v1/reports/${id}/download` : "#";
}

export async function deleteReport(id: number): Promise<void> {
  return unwrapApiResult(
    await requestBackend<void>(`/api/v1/reports/${id}`, {
      method: "DELETE",
    }),
  );
}

export async function seedDemoData(): Promise<DemoSeedResponse> {
  return unwrapApiResult(
    await requestBackend<DemoSeedResponse>("/api/v1/admin/seed-demo-data", {
      method: "POST",
    }),
  );
}

export async function resetDemoData(): Promise<DemoResetResponse> {
  return unwrapApiResult(
    await requestBackend<DemoResetResponse>("/api/v1/admin/reset-demo-data", {
      method: "POST",
    }),
  );
}

export async function getDemoSummary(): Promise<DemoSummary> {
  return unwrapApiResult(
    await requestBackend<DemoSummary>("/api/v1/admin/demo-summary"),
  );
}
