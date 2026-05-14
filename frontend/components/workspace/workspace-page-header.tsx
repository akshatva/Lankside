import type { ReactNode } from "react";

type WorkspacePageHeaderProps = {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function WorkspacePageHeader({
  action,
  description,
  eyebrow,
  title,
}: WorkspacePageHeaderProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
