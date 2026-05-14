import type { TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function WorkspaceTable({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table
        className={cn("min-w-full text-left text-sm text-slate-700", className)}
        {...props}
      />
    </div>
  );
}

export function WorkspaceTh({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function WorkspaceTd({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-slate-100 px-4 py-3 align-top text-slate-700",
        className,
      )}
      {...props}
    />
  );
}

export const workspaceRowClassName =
  "transition hover:bg-slate-50 last:[&>td]:border-b-0";
