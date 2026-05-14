import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";

type ScoreCardProps = {
  title: string;
  score: string | number;
  suffix?: string;
  description?: string;
  tone?: "emerald" | "amber" | "cyan" | "red";
};

const toneClasses: Record<NonNullable<ScoreCardProps["tone"]>, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  cyan: "bg-cyan-50 text-cyan-700",
  red: "bg-rose-50 text-rose-700",
};

const markerClasses: Record<NonNullable<ScoreCardProps["tone"]>, string> = {
  emerald: "border-emerald-600",
  amber: "border-amber-600",
  cyan: "border-cyan-600",
  red: "border-rose-600",
};

function getScoreValue(score: string | number) {
  const value = typeof score === "number" ? score : Number.parseFloat(score);

  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function ScoreCard({
  title,
  score,
  suffix,
  description,
  tone = "emerald",
}: ScoreCardProps) {
  const scoreValue = getScoreValue(score);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {title}
        </p>
        {description ? (
          <StatusPill
            className={cn("shrink-0", toneClasses[tone])}
            label={description}
            tone={
              tone === "emerald"
                ? "success"
                : tone === "amber"
                  ? "warning"
                  : tone === "cyan"
                    ? "info"
                    : "danger"
            }
          />
        ) : null}
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-semibold leading-none tracking-tight text-slate-950">
          {score}
        </span>
        {suffix ? (
          <span className="pb-1 text-sm font-medium text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="relative h-2 rounded-full bg-[linear-gradient(90deg,#e11d48_0%,#e11d48_40%,#d97706_40%,#d97706_70%,#059669_70%,#059669_100%)] opacity-90">
          <span
            className={cn(
              "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm",
              markerClasses[tone],
            )}
            style={{ left: `${scoreValue}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
          <span>Risk</span>
          <span>Review</span>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}
