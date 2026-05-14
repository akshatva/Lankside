import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspaceCardProps = {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: string;
  href?: string;
  title?: string;
};

export function WorkspaceCard({
  action,
  children,
  className,
  description,
  href,
  title,
}: WorkspaceCardProps) {
  const content = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm shadow-slate-900/[0.03]",
        href
          ? "transition hover:border-slate-300 hover:bg-slate-50/40 hover:shadow-md hover:shadow-slate-900/[0.06]"
          : "",
        className,
      )}
    >
      {(title || description || action) && (
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold tracking-normal text-slate-950">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children ? (
        <div className={cn(title || description ? "mt-5" : "")}>
          {children}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
