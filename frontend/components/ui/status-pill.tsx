import { cn } from "@/lib/utils";

export type StatusPillTone =
  | "success"
  | "danger"
  | "warning"
  | "neutral"
  | "info"
  | "red";

const toneClasses: Record<StatusPillTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  neutral: "border-stone-200 bg-stone-100 text-stone-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

type StatusPillProps = {
  children?: React.ReactNode;
  className?: string;
  label?: string;
  tone?: StatusPillTone;
};

export function StatusPill({
  children,
  className,
  label,
  tone = "neutral",
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none shadow-sm shadow-black/20",
        "shadow-none",
        toneClasses[tone],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "success"
            ? "bg-emerald-500"
            : tone === "warning"
              ? "bg-amber-500"
            : tone === "info"
                ? "bg-sky-500"
                : tone === "danger" || tone === "red"
                  ? "bg-red-500"
                  : "bg-stone-400",
        )}
      />
      {label ?? children}
    </span>
  );
}
