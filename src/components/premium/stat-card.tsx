"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
  delay?: number;
  accent?: "primary" | "emerald" | "amber" | "purple";
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-2">
        <div className={`size-6 ${colorClass}`}>
          {icon}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground font-heading">
          {displayValue}
          {suffix && <span className="text-base font-medium ml-1 font-sans text-muted-foreground">{suffix}</span>}
        </p>
      </div>
    </motion.div>
  );
}
