import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  helperText?: string;
  label: string;
  required?: boolean;
};

export const workspaceInputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function FormField({
  children,
  className,
  helperText,
  label,
  required,
}: FormFieldProps) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {helperText ? (
        <span className="text-xs leading-5 text-slate-500">{helperText}</span>
      ) : null}
    </label>
  );
}

export function WorkspaceInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("h-11", workspaceInputClassName, className)}
      {...props}
    />
  );
}

export function WorkspaceSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-11", workspaceInputClassName, className)}
      {...props}
    />
  );
}

export function WorkspaceTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-28 py-3 leading-6", workspaceInputClassName, className)}
      {...props}
    />
  );
}
