"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  hover = false,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={
        hover
          ? { y: -2, boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)" }
          : undefined
      }
      className={cn(
        "rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm",
        hover && "transition-shadow",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
