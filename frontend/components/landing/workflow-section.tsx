import type { LucideIcon } from "lucide-react";
import { CheckCircle2, FileUp, ScanSearch, Share2 } from "lucide-react";

import { BentoGridShowcase } from "@/components/ui/bento-product-features";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WorkflowStep = {
  title: string;
};

const workflowSteps: WorkflowStep[] = [
  { title: "Create business profile" },
  { title: "Upload compliance documents" },
  { title: "Run AI extraction" },
  { title: "Review audit findings" },
  { title: "Calculate LRI score" },
  { title: "Generate MOU and scheme matches" },
  { title: "Export Bankability Report" },
];

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="relative flex min-h-screen snap-start snap-always items-center overflow-hidden bg-black px-5 py-24 text-white sm:px-8 lg:py-28"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.16),transparent_36%),radial-gradient(circle_at_85%_45%,rgba(249,115,22,0.12),transparent_30%)]" />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-4 text-sm font-medium tracking-wide text-orange-200">
              Guided workflow
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
              From raw documents to a bankability report.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-white/68 sm:text-lg lg:justify-self-end">
            A guided workflow that helps MSMEs move from fragmented records to
            a structured readiness package.
          </p>
        </div>

        <BentoGridShowcase
          className="mt-12 auto-rows-[minmax(130px,auto)] gap-4"
          integration={
            <WorkflowCard
              eyebrow="01"
              title="Profile and evidence"
              description="Create the business profile, then upload GST, PAN, Udyam, ITR, and bank records."
              icon={FileUp}
              items={workflowSteps.slice(0, 2).map((step) => step.title)}
            />
          }
          trackers={
            <WorkflowCard
              eyebrow="02"
              title="AI extraction"
              description="Convert uploaded documents into structured fields."
              icon={ScanSearch}
            />
          }
          statistic={
            <Card className="relative h-full overflow-hidden border-white/10 bg-white/[0.055] text-white">
              <CardContent className="flex h-full flex-col justify-center p-6">
                <span className="text-5xl font-semibold text-white">07</span>
                <p className="mt-2 text-sm text-white/65">workflow steps</p>
              </CardContent>
            </Card>
          }
          focus={
            <WorkflowCard
              eyebrow="03"
              title="Review findings"
              description="Audit mismatches, missing records, and readiness risks."
              icon={CheckCircle2}
            />
          }
          productivity={
            <WorkflowCard
              eyebrow="04"
              title="Score and match"
              description="Calculate LRI, generate MOU drafts, and match schemes."
              icon={Share2}
            />
          }
          shortcuts={
            <Card className="h-full border-white/10 bg-white/[0.055] text-white">
              <CardContent className="flex h-full flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <CardTitle className="text-base font-medium text-white">
                    Export Bankability Report
                  </CardTitle>
                  <CardDescription className="mt-2 text-white/65">
                    The final package combines profile, evidence, audit
                    findings, LRI, schemes, and next actions.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-orange-300/40 text-orange-100"
                >
                  Final output
                </Badge>
              </CardContent>
            </Card>
          }
        />
      </div>
    </section>
  );
}

function WorkflowCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  items?: string[];
}) {
  return (
    <Card className="h-full border-white/10 bg-white/[0.055] text-white">
      <CardHeader className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-cyan-100">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <Badge variant="outline" className="border-cyan-300/30 text-cyan-100">
            {eyebrow}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold text-white">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-white/65">
          {description}
        </CardDescription>
      </CardHeader>
      {items ? (
        <CardContent className="grid gap-2 p-5 pt-0">
          {items.map((item) => (
            <div
              className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/72"
              key={item}
            >
              {item}
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
