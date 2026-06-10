"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center premium-gradient-bg p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/80 p-8 text-center shadow-lg backdrop-blur-xl"
      >
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-10 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          เกิดข้อผิดพลาด
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ
        </p>
        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-premium mt-6 inline-flex"
        >
          <RefreshCw className="size-4" />
          ลองอีกครั้ง
        </motion.button>
      </motion.div>
    </div>
  );
}
