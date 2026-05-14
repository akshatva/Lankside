"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { WorkspaceCard } from "@/components/workspace-card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { getDemoSummary, resetDemoData, seedDemoData } from "@/lib/api";
import type {
  DemoResetResponse,
  DemoSeedResponse,
  DemoSummary,
} from "@/types/admin";

const navigationLinks = [
  { label: "Onboarding", href: "/onboarding" },
  { label: "Documents", href: "/documents" },
  { label: "Audit", href: "/audit" },
  { label: "LRI", href: "/lri" },
  { label: "MOU", href: "/mou" },
  { label: "Grants", href: "/grants" },
  { label: "Reports", href: "/reports" },
];

const emptySummary: DemoSummary = {
  demo_businesses: 0,
  documents: 0,
  extractions: 0,
  audit_findings: 0,
  lri_scores: 0,
  mous: 0,
  scheme_matches: 0,
  reports: 0,
};

export default function AdminPage() {
  const [summary, setSummary] = useState<DemoSummary>(emptySummary);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getDemoSummary()
      .then((loadedSummary) => {
        if (isMounted) {
          setSummary(loadedSummary);
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load demo summary.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSeed() {
    setIsSeeding(true);
    setError(null);
    setMessage(null);
    try {
      const result: DemoSeedResponse = await seedDemoData();
      setSummary(result.summary);
      setMessage(result.message);
    } catch (seedError) {
      setError(
        seedError instanceof Error
          ? seedError.message
          : "Unable to seed demo data.",
      );
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleReset() {
    setIsResetting(true);
    setError(null);
    setMessage(null);
    try {
      const result: DemoResetResponse = await resetDemoData();
      setSummary(result.summary);
      setMessage(result.message);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset demo data.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Admin"
          title="Demo Admin"
          description="Manage demo data for testing."
          action={
            <StatusBadge
              label={`${summary.demo_businesses} demo businesses`}
              tone={summary.demo_businesses > 0 ? "online" : "neutral"}
            />
          }
        />

        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Reset affects demo data only: the demo user, known demo businesses,
          related generated records, and files with the demo upload prefix. Do
          not upload real PAN, GST, Udyam, bank, ITR, or identity documents.
        </div>

        <WorkspaceCard
          title="Demo workflow controls"
          description="Seed or reset demo records."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={isSeeding || isResetting}
              onClick={handleSeed}
              type="button"
            >
              {isSeeding ? "Seeding..." : "Seed demo data"}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              disabled={isSeeding || isResetting}
              onClick={handleReset}
              type="button"
            >
              {isResetting ? "Resetting..." : "Reset demo data"}
            </button>
          </div>
          {message ? (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </WorkspaceCard>

        <section>
          <SectionHeader
            title="Demo summary"
            description={
              isLoading
                ? "Loading demo counts."
                : "Current demo counts."
            }
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(summary).map(([key, value]) => (
              <WorkspaceCard
                key={key}
                title={key.replaceAll("_", " ")}
                description="Demo scoped count"
              >
                <p className="text-3xl font-semibold text-stone-950">{value}</p>
              </WorkspaceCard>
            ))}
          </div>
        </section>

        <WorkspaceCard
          title="Demo navigation"
          description="Open product areas after seeding."
        >
          <div className="flex flex-wrap gap-2">
            {navigationLinks.map((link) => (
              <Link
                className="inline-flex h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </WorkspaceCard>
      </div>
    </AppShell>
  );
}
