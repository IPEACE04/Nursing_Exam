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
        <h1 className="learning-page-title">
          {title}
        </h1>
        {badge && <span className="mt-3 inline-flex rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{badge}</span>}
        {description && (
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </>
  );

  if (!animated) {
    return <div className="learning-page-header">{content}</div>;
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="learning-page-header"
    >
      {content}
    </motion.div>
  );
}
