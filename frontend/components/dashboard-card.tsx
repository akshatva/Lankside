import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title: string;
  description?: string;
  href?: string;
  children?: ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  description,
  href,
  children,
  className,
}: DashboardCardProps) {
  const content = (
    <div
      className={cn(
        "h-full rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition",
        href ? "hover:-translate-y-0.5 hover:border-emerald-300" : "",
        className,
      )}
    >
      <div>
        <h2 className="text-base font-semibold text-stone-950">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
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
