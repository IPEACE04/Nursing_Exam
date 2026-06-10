"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({ className = "size-7" }: { className?: string }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        className={`rounded-full border-2 border-primary border-t-transparent ${className}`}
      />
    </div>
  );
}
