"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { login } from "@/actions/auth";
import { FormField } from "@/components/premium/form-field";

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <>
      {registered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-chart-3/30 bg-chart-3/10 px-4 py-3 text-sm text-chart-3"
        >
          ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ
        </motion.div>
      )}

      <form action={formAction} className="space-y-5">
        <FormField
          id="email"
          name="email"
          label="อีเมล"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          required
        />

        <FormField
          id="password"
          name="password"
          label="รหัสผ่าน"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />

        {state?.error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={pending}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="btn-premium w-full py-3"
        >
          {pending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <LogIn className="size-4" />
          )}
          เข้าสู่ระบบ
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link
          href="/register"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          ลงทะเบียน
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          เข้าสู่ระบบ
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ยินดีต้อนรับกลับ! กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </motion.div>
  );
}
