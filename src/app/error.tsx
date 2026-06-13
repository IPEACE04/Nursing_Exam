"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[Next.js error boundary]", error.message, error.digest, error.stack);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/5">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          เกิดข้อผิดพลาด
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ
        </p>
        <motion.button
          onClick={reset}
          whileTap={{ scale: 0.98 }}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-6"
        >
          <RefreshCw className="size-4" />
          ลองอีกครั้ง
        </motion.button>
      </motion.div>
    </div>
  );
}
