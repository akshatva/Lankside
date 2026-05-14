import { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace/workspace-shell";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
