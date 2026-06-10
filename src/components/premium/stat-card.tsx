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
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  suffix = "",
  delay = 0,
  iconBg = "bg-primary/8",
  iconColor = "text-primary",
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 800;
    const steps = 20;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)" }}
      className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {displayValue}
            {suffix}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
