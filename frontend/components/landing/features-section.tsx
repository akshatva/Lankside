import type { LucideIcon } from "lucide-react";
import {
  BadgeIndianRupee,
  FileCheck2,
  FileText,
  Handshake,
  SearchCheck,
} from "lucide-react";

import { BentoGridShowcase } from "@/components/ui/bento-product-features";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

type Capability = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const capabilities: Capability[] = [
  {
    title: "Compliance Auditor",
    description:
      "Checks GST, Udyam, PAN, ITR, and bank documents for mismatches, missing records, and rejection risks.",
    icon: FileCheck2,
  },
  {
    title: "Lankside Readiness Index",
    description:
      "Converts document integrity, collaboration readiness, and financial consistency into an explainable score.",
    icon: BadgeIndianRupee,
  },
  {
    title: "MOU Architect",
    description:
      "Generates structured AI-assisted collaboration drafts for vendors, distributors, and cluster-style partnerships.",
    icon: Handshake,
  },
  {
    title: "Grant Scout",
    description:
      "Matches MSMEs with schemes such as PMEGP, MUDRA, ZED, MSE-CDP, and CGTMSE using profile and readiness data.",
    icon: SearchCheck,
  },
  {
    title: "Bankability Report",
    description:
      "Exports a professional readiness summary with audit findings, scores, scheme matches, and next actions.",
    icon: FileText,
  },
];

export function FeaturesSection() {
  const [auditor, lri, mou, grants, report] = capabilities;

  return (
    <section
      id="capabilities"
      className="relative flex min-h-screen snap-start snap-always items-center overflow-hidden bg-black bg-[radial-gradient(circle_at_0%_20%,rgba(6,182,212,0.14),transparent_30%),radial-gradient(circle_at_100%_80%,rgba(249,115,22,0.12),transparent_30%)] px-5 py-24 text-white sm:px-8 lg:py-28"
    >
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium tracking-wide text-cyan-200">
            Readiness engines
          </p>
          <h2 className="text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
            One platform. Five readiness engines.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
            Lankside turns scattered MSME paperwork into a clear readiness
            workflow before banks, schemes, or partners ask for it.
          </p>
          <UpgradeBanner
            buttonText="Start onboarding"
            description="to activate audit, LRI, grants, and reports"
            href="/signup"
            className="mt-7 justify-start"
          />
        </div>

        <BentoGridShowcase
          className="mt-12 auto-rows-[minmax(145px,auto)] gap-4"
          integration={<FeatureCard feature={auditor} tall />}
          trackers={<FeatureCard feature={lri} />}
          statistic={
            <Card className="relative h-full overflow-hidden border-white/10 bg-white/[0.055] text-white shadow-lg shadow-black/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.18),transparent_54%)]" />
              <CardContent className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
                <span className="text-6xl font-semibold tracking-normal text-white">
                  5
                </span>
                <p className="mt-2 text-sm text-white/65">readiness engines</p>
              </CardContent>
            </Card>
          }
          focus={<FeatureCard feature={mou} />}
          productivity={<FeatureCard feature={grants} />}
          shortcuts={<FeatureCard feature={report} wide />}
        />
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  tall = false,
  wide = false,
}: {
  feature: Capability;
  tall?: boolean;
  wide?: boolean;
}) {
  const Icon = feature.icon;

  return (
    <Card className="group relative h-full overflow-hidden border-white/10 bg-white/[0.055] text-white shadow-lg shadow-black/20 transition-colors duration-200 hover:border-cyan-300/35 hover:bg-white/[0.075]">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <CardHeader className={wide ? "p-5" : "p-5"}>
        <div className="mb-2 flex size-11 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-cyan-100 shadow-lg shadow-cyan-950/30">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-lg font-semibold tracking-normal text-white">
          {feature.title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-white/65">
          {feature.description}
        </CardDescription>
      </CardHeader>
      {tall ? (
        <CardContent className="mt-auto p-5 pt-0">
          <div className="rounded-lg border border-white/10 bg-black/25 p-4">
            <p className="text-sm text-white/70">
              Start with profile and documents, then let the workflow expose
              what is ready, risky, or missing.
            </p>
          </div>
        </CardContent>
      ) : null}
      <div className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-cyan-500/[0.08] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
    </Card>
  );
}
