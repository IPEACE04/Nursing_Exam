"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  const reducedMotion = useReducedMotion();
  const cardClassName = cn("learning-panel transition-colors duration-150", hover && "hover:border-primary/30 hover:bg-secondary/20", className);

  if (!animated) {
    return <div className={cardClassName}>{children}</div>;
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.2, delay: reducedMotion ? 0 : delay, ease: "easeOut" }}
      className={cardClassName}
      {...props}
    >
      {children}
    </motion.div>
  );
}
