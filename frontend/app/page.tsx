import Link from "next/link";

import { DashboardCard } from "@/components/dashboard-card";
import { StatusBadge } from "@/components/status-badge";
import { Topbar } from "@/components/topbar";

const features = [
  {
    title: "Compliance Auditor",
    description:
      "Static Phase 4 preview for document checks, missing evidence, and readiness gaps.",
  },
  {
    title: "Lankside Readiness Index",
    description:
      "A placeholder score surface for tracking bankability and subsidy-readiness signals.",
  },
  {
    title: "Grant Scout",
    description:
      "A future scheme-matching workspace for grants, subsidies, and MSME support programs.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Topbar />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
        <div>
          <StatusBadge label="Phase 4 Frontend Core" tone="online" />
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal text-stone-950 sm:text-6xl">
            Lankside
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-stone-700">
            AI Financial Readiness Platform for Indian MSMEs
          </p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-stone-600">
            Helps MSMEs become bankable and subsidy-ready by auditing
            documents, calculating readiness, generating MOUs, and matching
            schemes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Open dashboard
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
            >
              Start onboarding
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="rounded-md bg-stone-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-300">Readiness snapshot</p>
                <p className="mt-2 text-3xl font-semibold">68</p>
              </div>
              <StatusBadge label="Demo" tone="pending" />
            </div>
            <div className="mt-6 grid gap-3">
              {["KYC evidence", "Financial statements", "Scheme fit"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="rounded-md border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{item}</span>
                      <span className="font-mono text-emerald-200">
                        {index === 0 ? "Ready" : "Review"}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <DashboardCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
