"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  animated?: boolean;
  hover?: boolean;
  delay?: number;
  className?: string;
}

export function GlassCard({
  children,
  animated = true,
  hover = false,
  delay = 0,
  className = "",
  ...props
}: CardProps) {
  const cardClassName = `rounded-2xl border border-border bg-card transition-all duration-200 ${
    hover ? "hover:shadow-sm hover:border-border/70 hover:-translate-y-0.5" : ""
  } ${className}`;

  if (!animated) {
    return <div className={cardClassName}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cardClassName}
      {...props}
    >
      {children}
    </motion.div>
  );
}
