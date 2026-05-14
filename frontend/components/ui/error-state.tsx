import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type MessageStateProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "error" | "success" | "warning" | "neutral";
};

const toneClasses: Record<NonNullable<MessageStateProps["tone"]>, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  neutral: "border-stone-200 bg-stone-50 text-stone-700",
};

export function ErrorState({
  children,
  className,
  tone = "error",
}: MessageStateProps) {
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-6",
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
