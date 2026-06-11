"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label?: string;
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
    <div className="relative group">
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        minLength={minLength}
        className={cn(
          "w-full rounded-xl border border-border/60 bg-background py-3.5 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150",
          "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "cursor-not-allowed bg-muted/50 text-muted-foreground"
        )}
      />
    </div>
  );
}
