import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  className?: string;
  label?: string;
};

export function LoadingState({
  className,
  label = "Loading workspace...",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin text-red-300" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
