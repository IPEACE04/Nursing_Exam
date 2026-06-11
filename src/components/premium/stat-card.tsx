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
}

const accentStyles = {
  primary: { bg: "bg-primary/8", color: "text-primary", border: "border-primary/15" },
  emerald: { bg: "bg-emerald-500/8", color: "text-emerald-500", border: "border-emerald-500/15" },
  amber: { bg: "bg-amber-500/8", color: "text-amber-500", border: "border-amber-500/15" },
  purple: { bg: "bg-purple-500/8", color: "text-purple-500", border: "border-purple-500/15" },
};

export function StatCard({
  icon,
  label,
  value,
  suffix = "",
  delay = 0,
  accent = "primary",
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);
  const s = accentStyles[accent];

  useEffect(() => {
    if (hasAnimated.current) return;
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex flex-col gap-2">
        <div className={cn("size-6", s.color)}>
          {icon}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground font-serif">
          {displayValue}
          {suffix && <span className="text-base font-medium ml-1 font-sans text-muted-foreground">{suffix}</span>}
        </p>
      </div>
    </motion.div>
  );
}
