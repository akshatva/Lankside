import { cn } from "@/lib/utils";
import { StatusPill, type StatusPillTone } from "@/components/ui/status-pill";

type StatusBadgeTone = "online" | "offline" | "pending" | "neutral";

const toneClasses: Record<StatusBadgeTone, string> = {
  online: "success",
  offline: "danger",
  pending: "warning",
  neutral: "neutral",
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
    <StatusPill
      className={cn(className)}
      label={label}
      tone={toneClasses[tone] as StatusPillTone}
    />
  );
}
