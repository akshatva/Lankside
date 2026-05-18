import Link from "next/link";
import { Landmark, ShieldCheck } from "lucide-react";

import { AuthStatus } from "@/components/auth/auth-status";
import { StatusPill } from "@/components/ui/status-pill";

export function WorkspaceTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#fbfaf7]">
      <div className="mx-auto flex min-h-14 w-full max-w-[92rem] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800">
            <Landmark className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              Lankside
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Financial readiness workspace
            </p>
          </div>
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-3">
          <StatusPill tone="neutral" className="hidden sm:inline-flex">
            <ShieldCheck className="size-3" aria-hidden="true" />
            MVP Build
          </StatusPill>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
