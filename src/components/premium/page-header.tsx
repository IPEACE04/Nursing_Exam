"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: string;
  animated?: boolean;
}

export function PageHeader({ title, description, action, badge, animated = true }: PageHeaderProps) {
  const content = (
    <>
      <div>
        {badge && (
          <span className="mb-2 inline-block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {badge}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </>
  );

  if (!animated) {
    return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      {content}
    </motion.div>
  );
}
