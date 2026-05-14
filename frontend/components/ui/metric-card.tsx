import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { StatusPillTone } from "@/components/ui/status-pill";

const toneClasses: Record<StatusPillTone, string> = {
  success: "border-slate-200 before:bg-emerald-500",
  danger: "border-slate-200 before:bg-rose-500",
  warning: "border-slate-200 before:bg-amber-500",
  neutral: "border-slate-200 before:bg-slate-300",
  info: "border-slate-200 before:bg-cyan-500",
  red: "border-slate-200 before:bg-rose-500",
};

type MetricCardProps = {
  className?: string;
  description?: ReactNode;
  label: string;
  suffix?: string;
  tone?: StatusPillTone;
  value: ReactNode;
};

export function MetricCard({
  className,
  description,
  label,
  suffix,
  tone = "neutral",
  value,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm shadow-slate-900/[0.03] before:absolute before:inset-x-0 before:top-0 before:h-0.5",
        toneClasses[tone],
        className,
      )}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-normal text-slate-950">
            {value}
          </span>
          {suffix ? (
            <span className="pb-1 text-sm font-semibold text-slate-500">
              {suffix}
            </span>
          ) : null}
        </div>
        {description ? (
          <div className="mt-4 text-sm leading-6 text-slate-600">
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}
