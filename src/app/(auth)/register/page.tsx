"use client";

import { useActionState } from "react";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { register } from "@/actions/auth";
import { FormField } from "@/components/premium/form-field";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          ลงทะเบียน
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          สมัครสมาชิกเพื่อเริ่มต้นฝึกทำข้อสอบ
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <FormField
          id="name"
          name="name"
          label="ชื่อ-นามสกุล"
          icon={User}
          autoComplete="name"
          placeholder="ชื่อ-นามสกุล"
          required
        />

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
          autoComplete="new-password"
          placeholder="•••••••• (อย่างน้อย 6 ตัว)"
          minLength={6}
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
            <UserPlus className="size-4" />
          )}
          ลงทะเบียน
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </motion.div>
  );
}
