import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";

export function Topbar() {
  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white">
            L
          </span>
          <div>
            <p className="text-base font-semibold text-stone-950">Lankside</p>
            <p className="text-xs text-stone-500">Local frontend environment</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-sm text-stone-600">Status APIs wired</p>
          <StatusBadge label="MVP Build" tone="online" />
        </div>
      </div>
    </header>
  );
}
