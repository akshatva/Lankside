import { cn } from "@/lib/utils";

type StatusBadgeTone = "online" | "offline" | "pending" | "neutral";

const toneClasses: Record<StatusBadgeTone, string> = {
  online: "border-emerald-200 bg-emerald-50 text-emerald-700",
  offline: "border-red-200 bg-red-50 text-red-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-stone-200 bg-white text-stone-600",
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
