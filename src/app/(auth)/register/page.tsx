"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { register } from "@/actions/auth";
import { getCurrentProfile } from "@/actions/profile";
import { useAuth } from "@/context/auth-context";
import { FormField } from "@/components/premium/form-field";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [state, formAction, pending] = useActionState(register, undefined);

  useEffect(() => {
    if (state?.success) {
      refreshProfile().then(async () => {
        const { profile } = await getCurrentProfile();
        if (profile?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/community");
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          สร้างบัญชีใหม่
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
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
