"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { WorkspaceCard } from "@/components/workspace-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import {
  deleteReport,
  downloadReportPDF,
  generateBankabilityReport,
  getBusinesses,
  getReports,
} from "@/lib/api";
import type { Business } from "@/types/business";
import type { ReportSummary } from "@/types/report";

const disclaimer =
  "This report is informational. It is not a formal approval.";

function formatDate(value: string | null) {
  if (!value) {
    return "Not generated";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: string): "online" | "pending" | "offline" | "neutral" {
  if (status === "GENERATED") {
    return "online";
  }
  if (status === "GENERATING") {
    return "pending";
  }
  if (status === "FAILED") {
    return "offline";
  }
  return "neutral";
}

function formatReportType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ReportsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBusiness = useMemo(
    () =>
      businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const loadedBusinesses = await getBusinesses();
        if (!isMounted) {
          return;
        }
        setBusinesses(loadedBusinesses);
        const firstBusiness = loadedBusinesses[0] ?? null;
        setSelectedBusinessId(firstBusiness?.id ?? null);
        if (firstBusiness) {
          const loadedReports = await getReports({
            businessId: firstBusiness.id,
          });
          if (isMounted) {
            setReports(loadedReports);
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load reports.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleBusinessChange(value: string) {
    const businessId = Number(value);
    setSelectedBusinessId(businessId);
    setError(null);
    setSuccess(null);
    try {
      setReports(await getReports({ businessId }));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load reports.",
      );
    }
  }

  async function handleGenerate() {
    if (!selectedBusinessId) {
      setError("Create a business profile first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const report = await generateBankabilityReport(selectedBusinessId);
      setReports((current) => [
        report,
        ...current.filter((item) => item.id !== report.id),
      ]);
      setSuccess("Bankability Report generated.");
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate report.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDelete(reportId: number) {
    setDeletingId(reportId);
    setError(null);
    setSuccess(null);
    try {
      await deleteReport(reportId);
      setReports((current) => current.filter((report) => report.id !== reportId));
      setSuccess("Report deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete report.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Reports"
          title="Reports"
          description="Generate a downloadable readiness report."
          action={
            <StatusBadge
              label={`${reports.length} stored`}
              tone={reports.length > 0 ? "online" : "neutral"}
            />
          }
        />

        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {disclaimer}
        </div>

        {isLoading ? (
          <WorkspaceCard title="Loading reports">
            <p className="text-sm text-stone-600">Loading business profiles...</p>
          </WorkspaceCard>
        ) : businesses.length === 0 ? (
          <WorkspaceCard title="Create a business profile first">
            <p className="text-sm text-stone-600">
              Reports are generated for an existing business profile.
            </p>
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              href="/onboarding"
            >
              Go to Onboarding
            </Link>
          </WorkspaceCard>
        ) : (
          <WorkspaceCard
            title="Generate report"
            description="Select a business and generate a PDF."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="grid gap-2 text-sm font-medium text-stone-700">
                Business
                <select
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  onChange={(event) => handleBusinessChange(event.target.value)}
                  value={selectedBusinessId ?? ""}
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.business_name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                disabled={isGenerating || selectedBusinessId === null}
                onClick={handleGenerate}
                type="button"
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
              {selectedBusiness ? (
                <p className="text-sm text-stone-500">
                  {selectedBusiness.industry_type || "Industry not set"}
                </p>
              ) : null}
            </div>
          </WorkspaceCard>
        )}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <WorkspaceCard
          title="Report history"
          description="Generated reports for this business."
        >
          {reports.length === 0 ? (
            <p className="text-sm text-stone-500">
              No reports generated for this business yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead>
                  <tr className="text-left text-stone-500">
                    <th className="py-2 pr-4 font-medium">Report</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Generated</th>
                    <th className="py-2 pr-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="py-3 pr-4 font-medium text-stone-950">
                        {formatReportType(report.report_type)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge
                          label={report.status}
                          tone={statusTone(report.status)}
                        />
                      </td>
                      <td className="py-3 pr-4 text-stone-600">
                        {formatDate(report.generated_at)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {report.status === "GENERATED" ? (
                            <a
                              className="inline-flex h-9 items-center justify-center rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                              href={downloadReportPDF(report.id)}
                            >
                              Download
                            </a>
                          ) : null}
                          <button
                            className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-stone-100"
                            disabled={deletingId === report.id}
                            onClick={() => handleDelete(report.id)}
                            type="button"
                          >
                            {deletingId === report.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WorkspaceCard>
      </div>
    </AppShell>
  );
}
