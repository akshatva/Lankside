import type { ReactNode } from "react";

import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/workspace/workspace-topbar";

type WorkspaceShellProps = {
  children: ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f5f1] text-slate-950 lg:pl-[240px]">
      <WorkspaceSidebar />
      <div className="hidden lg:block">
        <WorkspaceTopbar />
      </div>
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1260px] pb-12">{children}</div>
      </main>
    </div>
  );
}
