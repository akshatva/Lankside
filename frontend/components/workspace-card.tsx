import { ReactNode } from "react";

import { WorkspaceCard as WorkspaceCardPrimitive } from "@/components/ui/workspace-card";

type WorkspaceCardProps = {
  title: string;
  description?: string;
  href?: string;
  children?: ReactNode;
  className?: string;
};

export function WorkspaceCard({
  title,
  description,
  href,
  children,
  className,
}: WorkspaceCardProps) {
  return (
    <WorkspaceCardPrimitive
      className={className}
      description={description}
      href={href}
      title={title}
    >
      {children}
    </WorkspaceCardPrimitive>
  );
}
