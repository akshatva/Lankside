import { ReactNode } from "react";

import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <WorkspacePageHeader
      action={action}
      description={description}
      eyebrow={eyebrow}
      title={title}
    />
  );
}
