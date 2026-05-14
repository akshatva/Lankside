import * as React from "react";

import { WorkspaceButton, type WorkspaceButtonProps } from "@/components/ui/workspace-button";

export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  Omit<WorkspaceButtonProps, "variant">
>((props, ref) => <WorkspaceButton ref={ref} variant="primary" {...props} />);

PrimaryButton.displayName = "PrimaryButton";

