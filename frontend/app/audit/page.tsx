"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField, WorkspaceSelect } from "@/components/ui/form-field";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  WorkspaceTable,
  WorkspaceTd,
  WorkspaceTh,
  workspaceRowClassName,
} from "@/components/ui/workspace-table";
import { WorkspaceButton } from "@/components/ui/workspace-button";
import { WorkspaceCard } from "@/components/ui/workspace-card";
import {
  deleteAuditFinding,
  getAuditFindings,
  getBusinesses,
  resolveAuditFinding,
  runAudit,
} from "@/lib/api";
import type { AuditFinding, AuditSeverity } from "@/types/audit";
import type { Business } from "@/types/business";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function severityTone(
  severity: AuditSeverity,
): "danger" | "warning" | "neutral" {
  if (severity === "HIGH") {
    return "danger";
  }
  if (severity === "MEDIUM") {
    return "warning";
  }
  return "neutral";
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AuditPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedBusiness = useMemo(
    () =>
      businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId],
  );

  const unresolvedFindings = findings.filter((finding) => !finding.is_resolved);
  const highCount = unresolvedFindings.filter(
    (finding) => finding.severity === "HIGH",
  ).length;
  const mediumCount = unresolvedFindings.filter(
    (finding) => finding.severity === "MEDIUM",
  ).length;
  const lowCount = unresolvedFindings.filter(
    (finding) => finding.severity === "LOW",
  ).length;

  const loadFindings = useCallback(async (businessId: number | null) => {
    if (!businessId) {
      setFindings([]);
      return;
    }

    setIsAuditLoading(true);
    try {
      setFindings(await getAuditFindings({ businessId }));
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

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
          await loadFindings(firstBusiness.id);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load audit workspace.",
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
  }, [loadFindings]);

  async function handleBusinessChange(value: string) {
    const businessId = Number(value);
    setSelectedBusinessId(businessId);
    setError(null);
    setSuccess(null);

    try {
      await loadFindings(businessId);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load audit findings.",
      );
    }
  }

  async function handleRunAudit() {
    if (!selectedBusinessId) {
      setError("Create a business profile first.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await runAudit(selectedBusinessId);
      setFindings(result.generated_findings);
      setSuccess(`Audit completed with ${result.total_findings} findings.`);
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "Unable to run audit.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function handleResolve(findingId: number) {
    setResolvingId(findingId);
    setError(null);
    setSuccess(null);
    try {
      const updated = await resolveAuditFinding(findingId);
      setFindings((current) =>
        current.map((finding) => (finding.id === updated.id ? updated : finding)),
      );
      setSuccess("Finding marked as resolved.");
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Unable to resolve finding.",
      );
    } finally {
      setResolvingId(null);
    }
  }

  async function handleDelete(findingId: number) {
    setDeletingId(findingId);
    setError(null);
    setSuccess(null);
    try {
      await deleteAuditFinding(findingId);
      setFindings((current) =>
        current.filter((finding) => finding.id !== findingId),
      );
      setSuccess("Finding deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete finding.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Audit"
          title="Compliance Audit"
          description="Find document mismatches before applying."
          action={
            <StatusBadge
              label={`${unresolvedFindings.length} unresolved`}
              tone={unresolvedFindings.length > 0 ? "pending" : "online"}
            />
          }
        />

        {isLoading ? (
          <WorkspaceCard title="Loading audit workspace">
            <ErrorState tone="neutral">Loading profiles and findings...</ErrorState>
          </WorkspaceCard>
        ) : businesses.length === 0 ? (
          <EmptyState
            title="Create a business profile first"
            description="Compliance audit needs a saved MSME profile and uploaded evidence."
            action={
              <WorkspaceButton asChild>
                <Link href="/onboarding">Go to Onboarding</Link>
              </WorkspaceButton>
            }
          />
        ) : (
          <>
            <WorkspaceCard
              title="Run audit"
              description="Select a business and check the uploaded records."
              action={
                <WorkspaceButton
                  disabled={isRunning || selectedBusinessId === null}
                  onClick={handleRunAudit}
                  type="button"
                  size="lg"
                >
                  {isRunning ? "Running audit..." : "Run audit"}
                </WorkspaceButton>
              }
            >
              <div className="grid gap-4 md:grid-cols-[minmax(220px,0.6fr)_1fr] md:items-end">
                <FormField label="Business">
                  <WorkspaceSelect
                    onChange={(event) => handleBusinessChange(event.target.value)}
                    value={selectedBusinessId ?? ""}
                  >
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.business_name}
                      </option>
                    ))}
                  </WorkspaceSelect>
                </FormField>
                <p className="text-sm leading-6 text-stone-500">
                  {selectedBusiness
                    ? `${selectedBusiness.business_name} · ${
                        selectedBusiness.city || "city not set"
                      }, ${selectedBusiness.state || "state not set"}`
                    : "No profile selected"}
                </p>
              </div>
            </WorkspaceCard>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Findings"
                value={findings.length}
                tone="red"
                description="All findings"
              />
              <MetricCard
                label="High Risk"
                value={highCount}
                tone="danger"
                description="Fix first"
              />
              <MetricCard
                label="Medium Risk"
                value={mediumCount}
                tone="warning"
                description="Review soon"
              />
              <MetricCard
                label="Low Risk"
                value={lowCount}
                tone="neutral"
                description="Minor issues"
              />
            </div>

            {error ? <ErrorState>{error}</ErrorState> : null}
            {success ? <ErrorState tone="success">{success}</ErrorState> : null}

            <WorkspaceCard
              title="Findings"
              description="Review severity and recommended fixes."
            >
              {isAuditLoading ? (
                <ErrorState tone="neutral">Loading findings...</ErrorState>
              ) : findings.length === 0 ? (
                <EmptyState
                  title="No audit run yet"
                  description="Run audit to create findings."
                  action={
                    <WorkspaceButton
                      disabled={isRunning}
                      onClick={handleRunAudit}
                      type="button"
                    >
                      {isRunning ? "Running audit..." : "Run audit"}
                    </WorkspaceButton>
                  }
                />
              ) : (
                <WorkspaceTable>
                  <thead>
                    <tr>
                      <WorkspaceTh>Finding</WorkspaceTh>
                      <WorkspaceTh>Severity</WorkspaceTh>
                      <WorkspaceTh>Recommendation</WorkspaceTh>
                      <WorkspaceTh>Status</WorkspaceTh>
                      <WorkspaceTh>Created</WorkspaceTh>
                      <WorkspaceTh>Actions</WorkspaceTh>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((finding) => (
                      <tr className={workspaceRowClassName} key={finding.id}>
                        <WorkspaceTd className="min-w-[260px]">
                          <p className="font-semibold text-stone-950">{finding.title}</p>
                          <p className="mt-1 text-sm leading-6 text-stone-600">
                            {finding.description}
                          </p>
                          <p className="mt-2 text-xs text-stone-500">
                            {formatLabel(finding.finding_type)}
                            {finding.field_name ? ` · ${finding.field_name}` : ""}
                          </p>
                        </WorkspaceTd>
                        <WorkspaceTd>
                          <StatusPill
                            label={finding.severity}
                            tone={severityTone(finding.severity)}
                          />
                        </WorkspaceTd>
                        <WorkspaceTd className="min-w-[260px]">
                          <p className="leading-6">{finding.recommendation}</p>
                          {finding.expected_value || finding.actual_value ? (
                            <p className="mt-2 text-xs text-stone-500">
                              Expected: {finding.expected_value || "n/a"} · Actual:{" "}
                              {finding.actual_value || "n/a"}
                            </p>
                          ) : null}
                        </WorkspaceTd>
                        <WorkspaceTd>
                          <StatusPill
                            label={finding.is_resolved ? "Resolved" : "Unresolved"}
                            tone={finding.is_resolved ? "success" : "warning"}
                          />
                        </WorkspaceTd>
                        <WorkspaceTd>{formatDate(finding.created_at)}</WorkspaceTd>
                        <WorkspaceTd>
                          <div className="flex flex-wrap gap-2">
                            <WorkspaceButton
                              disabled={
                                finding.is_resolved || resolvingId === finding.id
                              }
                              onClick={() => handleResolve(finding.id)}
                              type="button"
                              variant="secondary"
                              size="sm"
                            >
                              {resolvingId === finding.id
                                ? "Resolving..."
                                : "Resolve"}
                            </WorkspaceButton>
                            <WorkspaceButton
                              disabled={deletingId === finding.id}
                              onClick={() => handleDelete(finding.id)}
                              type="button"
                              variant="destructive"
                              size="sm"
                            >
                              {deletingId === finding.id ? "Deleting..." : "Delete"}
                            </WorkspaceButton>
                          </div>
                        </WorkspaceTd>
                      </tr>
                    ))}
                  </tbody>
                </WorkspaceTable>
              )}
            </WorkspaceCard>
          </>
        )}
      </div>
    </AppShell>
  );
}
