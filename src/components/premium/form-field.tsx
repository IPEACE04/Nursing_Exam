"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  minLength?: number;
}

export function FormField({
  id,
  label,
  icon: Icon,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  autoComplete,
  minLength,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-foreground/80"
      >
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          minLength={minLength}
          className={cn(
            "w-full rounded-xl border border-border bg-background/80 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all",
            "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
            disabled && "cursor-not-allowed bg-muted/50 text-muted-foreground"
          )}
        />
      </div>
    </div>
  );
}
