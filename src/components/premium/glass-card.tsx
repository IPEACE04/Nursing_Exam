"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  hover?: boolean;
  delay?: number;
  className?: string;
}

export function GlassCard({
  children,
  hover = false,
  delay = 0,
  className = "",
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={`rounded-xl border border-border/50 bg-card shadow-sm transition-all ${
        hover ? "hover:shadow-md" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
