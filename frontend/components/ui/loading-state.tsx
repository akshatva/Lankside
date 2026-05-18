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

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/75",
        className,
      )}
    />
  );
}

type WorkspaceSkeletonProps = {
  className?: string;
  rows?: number;
};

export function WorkspaceSkeleton({
  className,
  rows = 4,
}: WorkspaceSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)} aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <SkeletonBlock className="mb-4 h-5 w-44" />
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, index) => (
            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]" key={index}>
              <SkeletonBlock className="h-9" />
              <SkeletonBlock className="h-9" />
              <SkeletonBlock className="h-9" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
