"use client";

import { Suspense, useEffect, useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { login } from "@/actions/auth";
import { useAuth } from "@/context/auth-context";
import { FormField } from "@/components/premium/form-field";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [state, formAction, pending] = useActionState(login, undefined);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (state?.success) {
      refreshProfile().then(() => {
        router.push("/community");
      });
    }
  }, [state, refreshProfile, router]);

  return (
    <>
      {registered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-chart-3/30 bg-chart-3/10 px-5 py-3.5 text-base text-chart-3"
        >
          ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ
        </motion.div>
      )}

      <form action={formAction} className="space-y-5">
        <FormField
          id="email"
          name="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="อีเมล"
          required
        />

        <FormField
          id="password"
          name="password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="รหัสผ่าน"
          required
        />

        {state?.error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-destructive/10 px-4 py-3 text-base text-destructive"
          >
            {state.error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.99 }}
          className="btn-premium w-full py-3.5 mt-2"
        >
          {pending ? (
            <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            "เข้าสู่ระบบ"
          )}
        </motion.button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          สมัครสมาชิก
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          ยินดีต้อนรับ
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          เข้าสู่ระบบเพื่อเริ่มทำข้อสอบ
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </motion.div>
  );
}
