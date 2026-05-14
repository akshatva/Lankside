import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function EmptyState({
  action,
  className,
  description,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center",
        className,
      )}
    >
      <div className="mx-auto flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
        <Inbox className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
