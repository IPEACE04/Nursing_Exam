"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { register } from "@/actions/auth";
import { useAuth } from "@/context/auth-context";
import { FormField } from "@/components/premium/form-field";
import { getPrePostTestExam } from "@/actions/exam";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [state, formAction, pending] = useActionState(register, undefined);

  useEffect(() => {
    if (state?.success) {
      refreshProfile().then((profile) => {
        if (profile?.role === "admin") {
          router.push("/admin");
        } else {
          getPrePostTestExam().then((exam) => {
            if (exam?.id) {
              router.push(`/exam/${exam.id}`);
            } else {
              router.push("/community");
            }
          });
        }
      });
    }
  }, [state, refreshProfile, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          สร้างบัญชีใหม่
        </h1>
        <p className="mt-2 text-base sm:text-lg text-muted-foreground leading-relaxed">
          ลงทะเบียนเพื่อเริ่มฝึกข้อสอบ
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <FormField
          id="name"
          name="name"
          icon={User}
          autoComplete="name"
          placeholder="ชื่อ-นามสกุล"
          required
        />

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
          autoComplete="new-password"
          placeholder="รหัสผ่าน"
          minLength={6}
          required
        />

        {state?.error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-base text-destructive"
          >
            {state.error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.99 }}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
        >
          {pending ? (
            <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            "สมัครสมาชิก"
          )}
        </motion.button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </motion.div>
  );
}
