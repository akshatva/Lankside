import { cn } from "@/lib/utils";

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
  red: "bg-red-50 text-red-700",
};

export function ScoreCard({
  title,
  score,
  suffix,
  description,
  tone = "emerald",
}: ScoreCardProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-stone-600">{title}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-normal text-stone-950">
          {score}
        </span>
        {suffix ? (
          <span className="pb-1 text-sm font-medium text-stone-500">
            {suffix}
          </span>
        ) : null}
      </div>
      {description ? (
        <p
          className={cn(
            "mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
            toneClasses[tone],
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
