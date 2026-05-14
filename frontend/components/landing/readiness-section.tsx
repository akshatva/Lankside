import type { LucideIcon } from "lucide-react";
import { BrainCircuit, ClipboardCheck, Scale } from "lucide-react";

import { BentoGridShowcase } from "@/components/ui/bento-product-features";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type IntelligenceCard = {
  title: string;
  text: string;
  icon: LucideIcon;
};

const intelligenceCards: IntelligenceCard[] = [
  {
    title: "AI-powered extraction",
    text: "Gemini-assisted extraction converts uploaded compliance documents into structured business fields.",
    icon: BrainCircuit,
  },
  {
    title: "Rule-based scoring",
    text: "The LRI score stays deterministic so users can understand exactly why their readiness improved or dropped.",
    icon: Scale,
  },
  {
    title: "Human-review ready",
    text: "Audit findings, extracted fields, and generated reports remain transparent for business owners, consultants, and reviewers.",
    icon: ClipboardCheck,
  },
];

const formulaParts = [
  { symbol: "D", label: "Document Integrity", weight: "0.4" },
  { symbol: "C", label: "Collaboration Readiness", weight: "0.3" },
  { symbol: "F", label: "Financial Consistency", weight: "0.3" },
];

export function ReadinessSection() {
  return (
    <section
      id="readiness"
      className="relative flex min-h-screen snap-start snap-always items-center overflow-hidden bg-black px-5 py-24 text-white sm:px-8 lg:py-28"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-1/2 top-20 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1fr_0.72fr] lg:items-start">
        <div>
          <p className="mb-4 text-sm font-medium tracking-wide text-cyan-200">
            Readiness intelligence
          </p>
          <h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">
            Designed for explainability, not black-box scoring.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
            Lankside uses AI where documents and language are messy, and
            deterministic rules where trust and auditability matter.
          </p>

          <BentoGridShowcase
            className="mt-10 auto-rows-[minmax(130px,auto)] gap-4"
            integration={<IntelligenceBentoCard card={intelligenceCards[0]} tall />}
            trackers={<IntelligenceBentoCard card={intelligenceCards[1]} />}
            statistic={
              <Card className="relative h-full overflow-hidden border-white/10 bg-white/[0.055] text-white backdrop-blur-xl">
                <CardContent className="flex h-full items-center justify-center p-6">
                  <span className="font-mono text-5xl font-semibold text-white">
                    LRI
                  </span>
                </CardContent>
              </Card>
            }
            focus={<IntelligenceBentoCard card={intelligenceCards[2]} />}
            productivity={
              <Card className="h-full border-white/10 bg-white/[0.055] text-white backdrop-blur-xl">
                <CardHeader className="p-5">
                  <Badge
                    variant="outline"
                    className="w-fit border-cyan-300/30 text-cyan-100"
                  >
                    Transparent
                  </Badge>
                  <CardTitle className="text-base font-semibold text-white">
                    Every score has a reason
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Users can trace readiness changes to document, collaboration,
                    or finance signals.
                  </CardDescription>
                </CardHeader>
              </Card>
            }
            shortcuts={
              <Card className="h-full border-white/10 bg-white/[0.055] text-white backdrop-blur-xl">
                <CardContent className="flex h-full flex-wrap items-center justify-between gap-4 p-6">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">
                      LRI = 0.4D + 0.3C + 0.3F
                    </CardTitle>
                    <CardDescription className="mt-2 text-white/65">
                      D is document integrity, C is collaboration readiness, and
                      F is financial consistency.
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-orange-300/40 text-orange-100"
                  >
                    Formula
                  </Badge>
                </CardContent>
              </Card>
            }
          />
        </div>

        <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium tracking-wide text-white/70">
              LRI formula
            </p>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              deterministic
            </span>
          </div>

          <div className="my-8 rounded-lg border border-white/10 bg-black/35 p-5">
            <p className="font-mono text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              LRI = 0.4D + 0.3C + 0.3F
            </p>
          </div>

          <div className="space-y-3">
            {formulaParts.map((part) => (
              <div
                key={part.symbol}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-white">
                    {part.symbol}
                  </p>
                  <p className="mt-1 text-sm text-white/60">{part.label}</p>
                </div>
                <span className="font-mono text-sm text-orange-100">
                  {part.weight}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function IntelligenceBentoCard({
  card,
  tall = false,
}: {
  card: IntelligenceCard;
  tall?: boolean;
}) {
  const Icon = card.icon;

  return (
    <Card className="h-full border-white/10 bg-white/[0.055] text-white backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-white/[0.075]">
      <CardHeader className="p-5">
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-orange-100">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-base font-semibold text-white">
          {card.title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-white/65">
          {card.text}
        </CardDescription>
      </CardHeader>
      {tall ? (
        <CardContent className="p-5 pt-0">
          <div className="rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/64">
            AI helps interpret messy files. Rules keep the final score
            explainable.
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
