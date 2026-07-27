"use client";

import { useState, useRef } from "react";
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
  autoComplete = "off",
  minLength,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative group">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
        <input
          ref={inputRef}
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
          readOnly={!focused && type !== "password"}
          onFocus={() => setFocused(true)}
          className={cn(
            "h-12 w-full rounded-xl border border-border bg-background px-5 py-2 pl-12 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150",
            "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10",
            disabled && "cursor-not-allowed bg-muted/50 text-muted-foreground"
          )}
        />
      </div>
    </div>
  );
}
