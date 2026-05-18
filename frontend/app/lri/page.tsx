"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { WorkspaceCard } from "@/components/workspace-card";
import { ScoreCard } from "@/components/score-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState, WorkspaceSkeleton } from "@/components/ui/loading-state";
import {
  BackendApiError,
  calculateLRI,
  getBusinesses,
  getLRIHistory,
  getLatestLRI,
} from "@/lib/api";
import type { Business } from "@/types/business";
import type { LRIBand, LRIScore } from "@/types/lri";

const bandLabels: Record<LRIBand, string> = {
  RED: "RED - Not bank-ready",
  YELLOW: "YELLOW - Needs improvement",
  GREEN: "GREEN - Bankability ready",
};

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getExplanationPoints(explanation: string) {
  return explanation
    .split(/\n+|(?<=\.)\s+/)
    .map((point) => point.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function isNoLatestScoreError(error: unknown) {
  return (
    error instanceof BackendApiError &&
    error.status === 404 &&
    error.message.toLowerCase().includes("lri score")
  );
}

export default function LriPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );
  const [latestScore, setLatestScore] = useState<LRIScore | null>(null);
  const [history, setHistory] = useState<LRIScore[]>([]);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [lriError, setLriError] = useState<string | null>(null);
  const [isBusinessLoading, setIsBusinessLoading] = useState(true);
  const [isLriLoading, setIsLriLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getBusinesses()
      .then((loadedBusinesses) => {
        if (!isMounted) {
          return;
        }
        setBusinesses(loadedBusinesses);
        setSelectedBusinessId(loadedBusinesses[0]?.id ?? null);
      })
      .catch((error) => {
        if (isMounted) {
          setBusinessError(
            error instanceof Error
              ? error.message
              : "Unable to load business profiles.",
          );
        }
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

  useEffect(() => {
    if (selectedBusinessId === null) {
      return;
    }

    let isMounted = true;
    Promise.resolve()
      .then(() => {
        if (!isMounted) {
          return null;
        }

        setIsLriLoading(true);
        setLriError(null);

        return Promise.allSettled([
          getLatestLRI(selectedBusinessId),
          getLRIHistory(selectedBusinessId),
        ]);
      })
      .then((results) => {
        if (!isMounted || !results) {
          return;
        }

        const [latestResult, historyResult] = results;

        if (latestResult.status === "fulfilled") {
          setLatestScore(latestResult.value);
        } else {
          const message =
            latestResult.reason instanceof Error
              ? latestResult.reason.message
              : "Unable to load latest LRI score.";
          setLatestScore(null);
          if (!isNoLatestScoreError(latestResult.reason)) {
            setLriError(message);
          }
        }

        if (historyResult.status === "fulfilled") {
          setHistory(historyResult.value.scores);
        } else {
          setHistory([]);
          setLriError(
            historyResult.reason instanceof Error
              ? historyResult.reason.message
              : "Unable to load LRI history.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLriLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBusinessId]);

  const selectedBusiness = useMemo(
    () =>
      businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId],
  );

  const explanationPoints = useMemo(
    () => (latestScore ? getExplanationPoints(latestScore.explanation) : []),
    [latestScore],
  );

  async function handleCalculate() {
    if (selectedBusinessId === null) {
      return;
    }

    setIsCalculating(true);
    setLriError(null);
    try {
      const result = await calculateLRI(selectedBusinessId);
      setLatestScore(result);
      const refreshedHistory = await getLRIHistory(selectedBusinessId);
      setHistory(refreshedHistory.scores);
    } catch (error) {
      setLriError(
        error instanceof Error ? error.message : "Unable to calculate LRI.",
      );
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="LRI"
          title="Readiness Score"
          description="Check how ready this business is for credit or schemes."
          action={
            latestScore ? (
              <StatusBadge
                label={bandLabels[latestScore.band]}
                tone={bandBadgeTone[latestScore.band]}
              />
            ) : (
              <StatusBadge label="No score yet" tone="neutral" />
            )
          }
        />

        <WorkspaceCard
          title="Business selection"
          description="Select a business and calculate score."
        >
          {isBusinessLoading ? (
            <LoadingState label="Loading businesses..." />
          ) : businessError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {businessError}
            </p>
          ) : businesses.length === 0 ? (
            <a
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              href="/onboarding"
            >
              Create a business profile first
            </a>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="grid gap-2 text-sm font-medium text-stone-700">
                Business
                <select
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={selectedBusinessId ?? ""}
                  onChange={(event) =>
                    setSelectedBusinessId((current) => {
                      const next = Number(event.target.value);
                      return current === next ? current : next;
                    })
                  }
                  disabled={isLriLoading || isCalculating}
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
                disabled={isCalculating || isLriLoading || selectedBusinessId === null}
                onClick={handleCalculate}
                type="button"
              >
                {isCalculating ? "Calculating..." : "Calculate Score"}
              </button>
              {selectedBusiness ? (
                <p className="text-sm text-stone-500">
                  {selectedBusiness.city || "City not set"},{" "}
                  {selectedBusiness.state || "state not set"}
                </p>
              ) : null}
            </div>
          )}
        </WorkspaceCard>

        {lriError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {lriError}
          </p>
        ) : null}

        {isLriLoading ? (
          <WorkspaceCard
            title="Loading LRI"
            description="Fetching latest score and history."
          >
            <LoadingState label="Fetching latest score and history..." />
            <WorkspaceSkeleton className="mt-4" rows={3} />
          </WorkspaceCard>
        ) : latestScore ? (
          <>
            <div className="grid gap-4 lg:grid-cols-4">
              <ScoreCard
                title="Overall LRI"
                score={formatScore(latestScore.overall_score)}
                suffix="/ 100"
                description={latestScore.band}
                tone={bandScoreTone[latestScore.band]}
              />
              <ScoreCard
                title="Document Integrity"
                score={formatScore(latestScore.document_integrity_score)}
                suffix="/ 100"
                description="D"
                tone="cyan"
              />
              <ScoreCard
                title="Collaboration Readiness"
                score={formatScore(latestScore.collaboration_score)}
                suffix="/ 100"
                description="C"
                tone="amber"
              />
              <ScoreCard
                title="Financial Consistency"
                score={formatScore(latestScore.financial_consistency_score)}
                suffix="/ 100"
                description="F"
                tone="emerald"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <WorkspaceCard
                title="Recommendations"
                description="Short next steps."
              >
                {latestScore.recommendations.length > 0 ? (
                  <ul className="space-y-3">
                    {latestScore.recommendations.map((recommendation) => (
                      <li
                        className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2"
                        key={recommendation.code}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={recommendation.priority}
                            tone={
                              recommendation.priority === "HIGH"
                                ? "offline"
                                : recommendation.priority === "MEDIUM"
                                  ? "pending"
                                  : "neutral"
                            }
                          />
                          <p className="text-sm font-medium text-stone-950">
                            {recommendation.message}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-500">
                    No improvement recommendations for this calculation.
                  </p>
                )}
              </WorkspaceCard>

              <WorkspaceCard
                title="Explanation"
                description={`Calculated on ${formatDate(latestScore.created_at)}.`}
              >
                <ul className="space-y-2">
                  {explanationPoints.map((point) => (
                    <li
                      className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
                      key={point}
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </WorkspaceCard>
            </div>
          </>
        ) : (
          <WorkspaceCard
            title="Calculate readiness score"
            description="No readiness score calculated yet."
          >
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={isCalculating || isLriLoading || selectedBusinessId === null}
              onClick={handleCalculate}
              type="button"
            >
              {isCalculating ? "Calculating..." : "Calculate Score"}
            </button>
          </WorkspaceCard>
        )}

        <WorkspaceCard
          title="Score history"
          description="Past score calculations."
        >
          {history.length === 0 ? (
            isLriLoading ? (
              <WorkspaceSkeleton rows={3} />
            ) : (
              <p className="text-sm text-stone-500">No score history yet.</p>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Overall</th>
                    <th className="px-3 py-2">Band</th>
                    <th className="px-3 py-2">D</th>
                    <th className="px-3 py-2">C</th>
                    <th className="px-3 py-2">F</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {history.map((score) => (
                    <tr key={score.id}>
                      <td className="px-3 py-3 text-stone-600">
                        {formatDate(score.created_at)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-stone-950">
                        {formatScore(score.overall_score)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge
                          label={score.band}
                          tone={bandBadgeTone[score.band]}
                        />
                      </td>
                      <td className="px-3 py-3 text-stone-700">
                        {formatScore(score.document_integrity_score)}
                      </td>
                      <td className="px-3 py-3 text-stone-700">
                        {formatScore(score.collaboration_score)}
                      </td>
                      <td className="px-3 py-3 text-stone-700">
                        {formatScore(score.financial_consistency_score)}
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
