"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
  delay?: number;
  accent?: "primary" | "emerald" | "amber" | "purple";
  compact?: boolean;
}

const accentStyles = {
  primary: "text-primary",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  purple: "text-purple-500",
};

export function StatCard({
  icon,
  label,
  value,
  suffix = "",
  delay = 0,
  accent = "primary",
  compact = false,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);
  const colorClass = accentStyles[accent];

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }
    hasAnimated.current = true;

    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className={cn("learning-panel", compact ? "p-4 sm:p-5" : "p-5 sm:p-6")}
    >
      <div className={cn("flex flex-col", compact ? "gap-2" : "gap-4")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={`size-5 [&>svg]:size-5 ${colorClass}`}>{icon}</div>
        </div>
        <p className={cn("font-semibold tracking-tight tabular-nums text-foreground font-heading", compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl")}>
          {displayValue}
          {suffix && <span className="text-base font-medium ml-1 font-sans text-muted-foreground">{suffix}</span>}
        </p>
      </div>
    </motion.div>
  );
}
