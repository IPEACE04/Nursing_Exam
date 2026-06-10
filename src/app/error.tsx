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
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center"
      >
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-8 text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          เกิดข้อผิดพลาด
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ
        </p>
        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1a2744] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2744]/90"
        >
          <RefreshCw className="size-4" />
          ลองอีกครั้ง
        </motion.button>
      </motion.div>
    </div>
  );
}
