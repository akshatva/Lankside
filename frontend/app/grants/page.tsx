"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { WorkspaceCard } from "@/components/workspace-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import {
  getBusinesses,
  getGrantMatches,
  getSchemes,
  runGrantMatching,
  seedSchemes,
} from "@/lib/api";
import type { Business } from "@/types/business";
import type { Scheme, SchemeMatch } from "@/types/grants";

const disclaimer =
  "Verify scheme eligibility on official government sources before applying.";

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

function fitTone(status: SchemeMatch["recommendation_status"]) {
  if (status === "Strong fit") {
    return "online";
  }
  if (status === "Moderate fit") {
    return "pending";
  }
  return "neutral";
}

export default function GrantsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [matches, setMatches] = useState<SchemeMatch[]>([]);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [isBusinessLoading, setIsBusinessLoading] = useState(true);
  const [isGrantLoading, setIsGrantLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getBusinesses(), getSchemes()])
      .then(([loadedBusinesses, loadedSchemes]) => {
        if (!isMounted) {
          return;
        }
        setBusinesses(loadedBusinesses);
        setSchemes(loadedSchemes);
        setSelectedBusinessId(loadedBusinesses[0]?.id ?? null);
      })
      .catch((error) => {
        if (isMounted) {
          setBusinessError(
            error instanceof Error
              ? error.message
              : "Unable to load Grant Scout data.",
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

        setIsGrantLoading(true);
        setGrantError(null);

        return getGrantMatches(selectedBusinessId);
      })
      .then((loadedMatches) => {
        if (isMounted && loadedMatches) {
          setMatches(loadedMatches);
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
      })
      .finally(() => {
        if (isMounted) {
          setIsGrantLoading(false);
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

  async function handleSeedSchemes() {
    setIsSeeding(true);
    setGrantError(null);
    setSeedMessage(null);
    try {
      const result = await seedSchemes();
      const loadedSchemes = await getSchemes();
      setSchemes(loadedSchemes);
      setSeedMessage(
        `Seeded ${result.total_seeded} schemes: ${result.inserted} inserted, ${result.updated} updated.`,
      );
    } catch (error) {
      setGrantError(
        error instanceof Error ? error.message : "Unable to seed schemes.",
      );
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleRunMatching() {
    if (selectedBusinessId === null) {
      return;
    }

    setIsMatching(true);
    setGrantError(null);
    try {
      const result = await runGrantMatching(selectedBusinessId);
      setMatches(result.matches);
    } catch (error) {
      setGrantError(
        error instanceof Error
          ? error.message
          : "Unable to run Grant Scout matching.",
      );
    } finally {
      setIsMatching(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Grant Scout"
          title="Grants"
          description="Match this business with relevant MSME schemes."
          action={<StatusBadge label={`${schemes.length} schemes`} tone="neutral" />}
        />

        <WorkspaceCard
          title="Find schemes"
          description="Seed schemes if needed, then run matching."
        >
          {isBusinessLoading ? (
            <p className="text-sm text-stone-500">Loading Grant Scout...</p>
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
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="grid gap-2 text-sm font-medium text-stone-700">
                  Business
                  <select
                    className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    value={selectedBusinessId ?? ""}
                    onChange={(event) =>
                      setSelectedBusinessId(Number(event.target.value))
                    }
                  >
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.business_name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100"
                  disabled={isSeeding}
                  onClick={handleSeedSchemes}
                  type="button"
                >
                  {isSeeding ? "Seeding..." : "Seed schemes"}
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                  disabled={
                    isMatching || selectedBusinessId === null || schemes.length === 0
                  }
                  onClick={handleRunMatching}
                  type="button"
                >
                  {isMatching ? "Running..." : "Run Matching"}
                </button>
                {selectedBusiness ? (
                  <p className="text-sm text-stone-500">
                    {selectedBusiness.industry_type || "Industry not set"}
                  </p>
                ) : null}
              </div>
              {schemes.length === 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Seed the MVP schemes before running matching.
                </p>
              ) : null}
              {seedMessage ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {seedMessage}
                </p>
              ) : null}
            </div>
          )}
        </WorkspaceCard>

        <p className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700 shadow-sm">
          {disclaimer}
        </p>

        {grantError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {grantError}
          </p>
        ) : null}

        <WorkspaceCard
          title="Scheme matches"
          description="Best matches for this business."
        >
          {isGrantLoading ? (
            <p className="text-sm text-stone-500">Loading matches...</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-stone-500">
              No stored scheme matches yet. Run Grant Scout to create matches.
            </p>
          ) : (
            <div className="grid gap-4">
              {matches.map((match) => (
                <article
                  className="rounded-lg border border-stone-200 bg-stone-50 p-4"
                  key={match.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-stone-950">
                          {match.scheme.name}
                        </h2>
                        <StatusBadge label={match.scheme.category} tone="neutral" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {match.scheme.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-3xl font-semibold text-stone-950">
                        {formatScore(match.match_score)}
                      </p>
                      <StatusBadge
                        label={match.recommendation_status}
                        tone={fitTone(match.recommendation_status)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        Match reason
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {match.match_reason}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        Eligibility notes
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {match.eligibility_notes}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        Benefits
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {match.scheme.benefits_summary}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        Documents to verify
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {match.required_documents.length > 0
                          ? match.required_documents.join(", ")
                          : "Check official scheme guidelines."}
                      </p>
                      {match.scheme.source_url ? (
                        <a
                          className="mt-2 inline-flex text-sm font-medium text-red-700 hover:text-red-800"
                          href={match.scheme.source_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Official source
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </WorkspaceCard>
      </div>
    </AppShell>
  );
}
