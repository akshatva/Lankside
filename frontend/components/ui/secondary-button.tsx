import * as React from "react";

import { WorkspaceButton, type WorkspaceButtonProps } from "@/components/ui/workspace-button";

export const SecondaryButton = React.forwardRef<
  HTMLButtonElement,
  Omit<WorkspaceButtonProps, "variant">
>((props, ref) => <WorkspaceButton ref={ref} variant="secondary" {...props} />);

SecondaryButton.displayName = "SecondaryButton";

