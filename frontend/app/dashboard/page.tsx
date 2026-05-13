"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { ScoreCard } from "@/components/score-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import {
  backendApiUrl,
  getAuditFindings,
  getBackendStatus,
  getBusinesses,
  getDocuments,
  getGrantMatches,
  getLatestLRI,
  getMOUs,
  getReports,
} from "@/lib/api";
import type { AuditFinding } from "@/types/audit";
import type { Business } from "@/types/business";
import type { DocumentRecord } from "@/types/document";
import type { SchemeMatch } from "@/types/grants";
import type { LRIBand, LRIScore } from "@/types/lri";
import type { MOU } from "@/types/mou";
import type { ReportSummary } from "@/types/report";

const moduleCards = [
  {
    title: "Onboarding",
    href: "/onboarding",
    description: "Static intake workspace for MSME profile readiness.",
  },
  {
    title: "Documents",
    href: "/documents",
    description: "Placeholder document inventory and evidence checklist.",
  },
  {
    title: "Audit",
    href: "/audit",
    description: "Run compliance checks and review readiness findings.",
  },
  {
    title: "LRI Score",
    href: "/lri",
    description: "Calculate deterministic MSME bankability-readiness.",
  },
  {
    title: "MOU Architect",
    href: "/mou",
    description: "Generate, edit, and export AI-assisted collaboration MOU drafts.",
  },
  {
    title: "Grant Scout",
    href: "/grants",
    description: "Run preliminary scheme-fit matching for seeded MSME schemes.",
  },
  {
    title: "Reports",
    href: "/reports",
    description: "Generate informational Bankability Report PDFs.",
  },
];

type BackendReachability = "checking" | "online" | "offline";

type DemoBusinessRow = {
  businessName: string;
  lri: string;
  highAuditCount: number;
  topGrantMatch: string;
  reportStatus: string;
};

const demoBusinessNames = new Set([
  "Sharma Medical Distributors",
  "Kaveri Textiles",
  "GreenPack Industries",
]);

const bandBadgeTone: Record<LRIBand, "online" | "offline" | "pending"> = {
  RED: "offline",
  YELLOW: "pending",
  GREEN: "online",
};

const bandScoreTone: Record<LRIBand, "emerald" | "amber" | "red"> = {
  RED: "red",
  YELLOW: "amber",
  GREEN: "emerald",
};

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] =
    useState<BackendReachability>("checking");
  const [backendEnvironment, setBackendEnvironment] = useState<string>("Local");
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [isBusinessLoading, setIsBusinessLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [latestLriScore, setLatestLriScore] = useState<LRIScore | null>(null);
  const [lriError, setLriError] = useState<string | null>(null);
  const [mous, setMous] = useState<MOU[]>([]);
  const [mouError, setMouError] = useState<string | null>(null);
  const [grantMatches, setGrantMatches] = useState<SchemeMatch[]>([]);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [reportError, setReportError] = useState<string | null>(null);
  const [demoRows, setDemoRows] = useState<DemoBusinessRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    getBackendStatus()
      .then((result) => {
        if (!isMounted) {
          return;
        }

        if (result.ok) {
          setBackendStatus("online");
          setBackendEnvironment(result.data.environment);
        } else {
          setBackendStatus("offline");
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus("offline");
        }
      });

    getBusinesses()
      .then((businesses) => {
        if (!isMounted) {
          return;
        }

        const firstBusiness = businesses[0] ?? null;
        setBusiness(firstBusiness);

        const demoBusinesses = businesses.filter((item) =>
          demoBusinessNames.has(item.business_name),
        );
        if (demoBusinesses.length > 0) {
          Promise.all(demoBusinesses.map(loadDemoBusinessRow)).then((rows) => {
            if (isMounted) {
              setDemoRows(rows);
            }
          });
        }

        if (firstBusiness) {
          getDocuments({ businessId: firstBusiness.id })
            .then((loadedDocuments) => {
              if (isMounted) {
                setDocuments(loadedDocuments);
              }
            })
            .catch((error) => {
              if (isMounted) {
                setDocumentsError(
                  error instanceof Error
                    ? error.message
                    : "Unable to load document counts.",
                );
              }
            });

          getAuditFindings({
            businessId: firstBusiness.id,
            isResolved: false,
          })
            .then((loadedFindings) => {
              if (isMounted) {
                setAuditFindings(loadedFindings);
              }
            })
            .catch((error) => {
              if (isMounted) {
                setAuditError(
                  error instanceof Error
                    ? error.message
                    : "Unable to load audit findings.",
                );
              }
            });

          getLatestLRI(firstBusiness.id)
            .then((score) => {
              if (isMounted) {
                setLatestLriScore(score);
              }
            })
            .catch((error) => {
              if (!isMounted) {
                return;
              }
              const message =
                error instanceof Error
                  ? error.message
                  : "Unable to load LRI score.";
              if (!message.includes("No LRI score")) {
                setLriError(message);
              }
              setLatestLriScore(null);
            });

          getMOUs({ businessId: firstBusiness.id })
            .then((loadedMous) => {
              if (isMounted) {
                setMous(loadedMous);
              }
            })
            .catch((error) => {
              if (isMounted) {
                setMouError(
                  error instanceof Error
                    ? error.message
                    : "Unable to load MOU drafts.",
                );
              }
            });

          getGrantMatches(firstBusiness.id)
            .then((loadedMatches) => {
              if (isMounted) {
                setGrantMatches(loadedMatches);
              }
            })
            .catch((error) => {
              if (isMounted) {
                setGrantError(
                  error instanceof Error
                    ? error.message
                    : "Unable to load scheme matches.",
                );
              }
            });

          getReports({ businessId: firstBusiness.id })
            .then((loadedReports) => {
              if (isMounted) {
                setReports(loadedReports);
              }
            })
            .catch((error) => {
              if (isMounted) {
                setReportError(
                  error instanceof Error
                    ? error.message
                    : "Unable to load reports.",
                );
              }
            });
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setBusinessError(
          error instanceof Error
            ? error.message
            : "Unable to load business profile.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsBusinessLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const documentStatusCounts = documents.reduce(
    (counts, document) => {
      const status = document.status.toLowerCase();
      if (status === "pending") {
        counts.pending += 1;
      } else if (status === "processing") {
        counts.processing += 1;
      } else if (status === "completed") {
        counts.completed += 1;
      } else if (status === "failed") {
        counts.failed += 1;
      }
      return counts;
    },
    {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    },
  );

  const statusLabel =
    backendStatus === "online"
      ? "Backend online"
      : backendStatus === "offline"
        ? "Backend not reachable"
        : "Checking backend";

  const highAuditCount = auditFindings.filter(
    (finding) => finding.severity === "HIGH",
  ).length;
  const mediumAuditCount = auditFindings.filter(
    (finding) => finding.severity === "MEDIUM",
  ).length;
  const lowAuditCount = auditFindings.filter(
    (finding) => finding.severity === "LOW",
  ).length;
  const latestMou = mous[0] ?? null;
  const topGrantMatch = grantMatches[0] ?? null;
  const latestReport = reports[0] ?? null;

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Dashboard"
          title="Welcome to Lankside"
          description="A Phase 4 frontend shell for monitoring backend connectivity and previewing the core readiness modules."
          action={
            <StatusBadge
              label={statusLabel}
              tone={
                backendStatus === "online"
                  ? "online"
                  : backendStatus === "offline"
                    ? "offline"
                    : "pending"
              }
            />
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardCard
            title={business?.business_name ?? "Business profile"}
            description={
              business
                ? "Current demo MSME profile from onboarding."
                : "Create a profile from onboarding to populate this dashboard."
            }
          >
            {isBusinessLoading ? (
              <p className="text-sm text-stone-500">Loading profile...</p>
            ) : businessError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {businessError}
              </p>
            ) : business ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-stone-500">Owner</dt>
                  <dd className="mt-1 font-medium text-stone-950">
                    {business.owner_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Industry</dt>
                  <dd className="mt-1 font-medium text-stone-950">
                    {business.industry_type || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">City / State</dt>
                  <dd className="mt-1 font-medium text-stone-950">
                    {[business.city, business.state].filter(Boolean).join(", ") ||
                      "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Turnover</dt>
                  <dd className="mt-1 font-medium text-stone-950">
                    {business.turnover_range || "Not provided"}
                  </dd>
                </div>
              </dl>
            ) : (
              <a
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                href="/onboarding"
              >
                Create Profile
              </a>
            )}
          </DashboardCard>

          {latestLriScore ? (
            <ScoreCard
              title="Latest LRI"
              score={formatScore(latestLriScore.overall_score)}
              suffix="/ 100"
              description={latestLriScore.band}
              tone={bandScoreTone[latestLriScore.band]}
            />
          ) : (
            <DashboardCard
              title="LRI readiness"
              description={
                lriError
                  ? lriError
                  : "Calculate readiness score for the current business."
              }
            >
              <Link
                className="inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800"
                href="/lri"
              >
                Calculate readiness score
              </Link>
            </DashboardCard>
          )}
        </div>

        {latestLriScore ? (
          <DashboardCard
            title="LRI breakdown"
            description="Latest deterministic readiness calculation for the current business."
          >
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-stone-500">Band</p>
                <div className="mt-1">
                  <StatusBadge
                    label={latestLriScore.band}
                    tone={bandBadgeTone[latestLriScore.band]}
                  />
                </div>
              </div>
              <div>
                <p className="text-stone-500">Document Integrity</p>
                <p className="mt-1 font-semibold text-stone-950">
                  {formatScore(latestLriScore.document_integrity_score)}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Collaboration Readiness</p>
                <p className="mt-1 font-semibold text-stone-950">
                  {formatScore(latestLriScore.collaboration_score)}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Financial Consistency</p>
                <p className="mt-1 font-semibold text-stone-950">
                  {formatScore(latestLriScore.financial_consistency_score)}
                </p>
              </div>
            </div>
            <Link
              className="mt-4 inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800"
              href="/lri"
            >
              Open LRI
            </Link>
          </DashboardCard>
        ) : null}

        {demoRows.length > 0 ? (
          <DashboardCard
            title="Demo business summary"
            description="Seeded walkthrough profiles with their latest readiness signals."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="px-3 py-2">Business</th>
                    <th className="px-3 py-2">Latest LRI</th>
                    <th className="px-3 py-2">High audit</th>
                    <th className="px-3 py-2">Top grant match</th>
                    <th className="px-3 py-2">Latest report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {demoRows.map((row) => (
                    <tr key={row.businessName}>
                      <td className="px-3 py-3 font-medium text-stone-950">
                        {row.businessName}
                      </td>
                      <td className="px-3 py-3 text-stone-700">{row.lri}</td>
                      <td className="px-3 py-3 text-stone-700">
                        {row.highAuditCount}
                      </td>
                      <td className="px-3 py-3 text-stone-700">
                        {row.topGrantMatch}
                      </td>
                      <td className="px-3 py-3 text-stone-700">
                        {row.reportStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        ) : null}

        <DashboardCard
          title="Backend connection"
          description="Status is checked through the public backend API URL."
        >
          <div className="space-y-3">
            <StatusBadge
              label={statusLabel}
              tone={
                backendStatus === "online"
                  ? "online"
                  : backendStatus === "offline"
                    ? "offline"
                    : "pending"
              }
            />
            <p className="break-all font-mono text-sm text-stone-600">
              {backendApiUrl}
            </p>
            <p className="text-sm text-stone-500">
              Environment: {backendEnvironment}
            </p>
          </div>
        </DashboardCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DashboardCard
            title="Documents"
            description="Uploaded compliance files for the current business."
          >
            {documentsError ? (
              <p className="text-sm text-red-700">{documentsError}</p>
            ) : (
              <>
                <p className="text-3xl font-semibold text-stone-950">
                  {documents.length}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-600">
                  <span>Pending: {documentStatusCounts.pending}</span>
                  <span>Processing: {documentStatusCounts.processing}</span>
                  <span>Completed: {documentStatusCounts.completed}</span>
                  <span>Failed: {documentStatusCounts.failed}</span>
                </div>
              </>
            )}
          </DashboardCard>
          <DashboardCard
            title="Audit findings"
            description="Open compliance findings for the current business profile."
          >
            {auditError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {auditError}
              </p>
            ) : (
              <>
                <p className="text-3xl font-semibold text-stone-950">
                  {auditFindings.length}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  High {highAuditCount} / Medium {mediumAuditCount} / Low{" "}
                  {lowAuditCount}
                </p>
                <Link
                  className="mt-4 inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800"
                  href="/audit"
                >
                  Run Audit
                </Link>
              </>
            )}
          </DashboardCard>
          <DashboardCard
            title="MOU drafts"
            description="AI-assisted collaboration drafts for the current business."
          >
            {mouError ? (
              <p className="text-sm text-red-700">{mouError}</p>
            ) : (
              <>
                <p className="text-3xl font-semibold text-stone-950">
                  {mous.length}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Latest: {latestMou ? latestMou.status : "None"}
                </p>
                <Link
                  className="mt-4 inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800"
                  href="/mou"
                >
                  Open MOU Architect
                </Link>
              </>
            )}
          </DashboardCard>
          <DashboardCard
            title="Grant matches"
            description="Stored preliminary scheme-fit recommendations."
          >
            {grantError ? (
              <p className="text-sm text-red-700">{grantError}</p>
            ) : (
              <>
                <p className="text-3xl font-semibold text-stone-950">
                  {grantMatches.length}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {topGrantMatch
                    ? `${topGrantMatch.scheme.name}: ${formatScore(
                        topGrantMatch.match_score,
                      )}`
                    : "Run Grant Scout to create matches"}
                </p>
                <Link
                  className="mt-4 inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800"
                  href="/grants"
                >
                  Open Grant Scout
                </Link>
              </>
            )}
          </DashboardCard>
          <DashboardCard
            title="Reports"
            description="Generated informational Bankability Reports."
          >
            {reportError ? (
              <p className="text-sm text-red-700">{reportError}</p>
            ) : (
              <>
                <p className="text-3xl font-semibold text-stone-950">
                  {reports.length}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Latest: {latestReport ? latestReport.status : "None"}
                </p>
                <Link
                  className="mt-4 inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-800"
                  href="/reports"
                >
                  {latestReport ? "Open reports" : "Generate report"}
                </Link>
              </>
            )}
          </DashboardCard>
        </div>

        <section>
          <SectionHeader
            title="Module navigation"
            description="Static navigation cards for the core Lankside modules. Product workflows are intentionally deferred."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moduleCards.map((module) => (
              <DashboardCard
                key={module.href}
                href={module.href}
                title={module.title}
                description={module.description}
              />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

async function loadDemoBusinessRow(
  business: Business,
): Promise<DemoBusinessRow> {
  const [lriResult, auditResult, grantResult, reportResult] =
    await Promise.allSettled([
      getLatestLRI(business.id),
      getAuditFindings({ businessId: business.id, isResolved: false }),
      getGrantMatches(business.id),
      getReports({ businessId: business.id }),
    ]);

  const latestLri =
    lriResult.status === "fulfilled"
      ? `${formatScore(lriResult.value.overall_score)} (${lriResult.value.band})`
      : "Not calculated";
  const highAuditCount =
    auditResult.status === "fulfilled"
      ? auditResult.value.filter((finding) => finding.severity === "HIGH").length
      : 0;
  const topGrantMatch =
    grantResult.status === "fulfilled" && grantResult.value.length > 0
      ? grantResult.value[0].scheme.name
      : "No match";
  const reportStatus =
    reportResult.status === "fulfilled" && reportResult.value.length > 0
      ? reportResult.value[0].status
      : "No report";

  return {
    businessName: business.business_name,
    lri: latestLri,
    highAuditCount,
    topGrantMatch,
    reportStatus,
  };
}
