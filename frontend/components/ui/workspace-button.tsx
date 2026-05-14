import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type WorkspaceButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type WorkspaceButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<WorkspaceButtonVariant, string> = {
  primary:
    "border-slate-950 bg-slate-950 text-white hover:border-slate-800 hover:bg-slate-800",
  secondary:
    "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
  destructive:
    "border-red-200 bg-white text-red-700 hover:bg-red-50",
  ghost:
    "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950",
};

const sizeClasses: Record<WorkspaceButtonSize, string> = {
  sm: "h-9 rounded-md px-3 text-xs",
  md: "h-10 rounded-md px-4 text-sm",
  lg: "h-11 rounded-md px-5 text-sm",
};

export type WorkspaceButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    variant?: WorkspaceButtonVariant;
    size?: WorkspaceButtonSize;
  };

export const workspaceButtonClassName = ({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: WorkspaceButtonSize;
  variant?: WorkspaceButtonVariant;
} = {}) =>
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap border font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

const WorkspaceButton = React.forwardRef<HTMLButtonElement, WorkspaceButtonProps>(
  (
    {
      asChild = false,
      className,
      size = "md",
      variant = "primary",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={workspaceButtonClassName({ className, size, variant })}
        {...props}
      />
    );
  },
);

WorkspaceButton.displayName = "WorkspaceButton";

export { WorkspaceButton };
