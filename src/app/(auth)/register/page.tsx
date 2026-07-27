"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, IdCard } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { register } from "@/actions/auth";
import { PERSONAL_QUESTIONS } from "@/lib/personal-questions";
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
          placeholder="ชื่อ-นามสกุล"
          autoComplete="off"
          required
        />

        <FormField
          id="email"
          name="email"
          icon={Mail}
          type="email"
          placeholder="อีเมล"
          autoComplete="off"
          required
        />

        <FormField
          id="password"
          name="password"
          icon={Lock}
          type="password"
          placeholder="รหัสผ่าน"
          autoComplete="off"
          minLength={6}
          required
        />

        <div className="border-t border-border pt-4">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            ข้อมูลส่วนตัว 
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="gender" className="mb-1.5 block text-sm font-medium text-foreground">
                เพศ
              </label>
              <select
                id="gender"
                name="gender"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="">ไม่ระบุ</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-foreground">
                  อายุ
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min={15}
                  max={99}
                  placeholder="อายุ"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label htmlFor="gpa" className="mb-1.5 block text-sm font-medium text-foreground">
                  เกรดเฉลี่ย
                </label>
                <input
                  id="gpa"
                  name="gpa"
                  type="number"
                  min={0}
                  max={4}
                  step={0.01}
                  placeholder="เกรดเฉลี่ย"
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              
            </div>

            <FormField
              id="studentId"
              name="studentId"
              icon={IdCard}
              placeholder="รหัสนักศึกษา"
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            คำถามส่วนตัว (สำหรับกู้คืนรหัสผ่าน)
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="personalQuestion" className="mb-1.5 block text-sm font-medium text-foreground">
                เลือกคำถาม
              </label>
              <select
                id="personalQuestion"
                name="personalQuestion"
                required
                defaultValue=""
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="" disabled>กรุณาเลือกคำถาม</option>
                {PERSONAL_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="personalAnswer" className="mb-1.5 block text-sm font-medium text-foreground">
                คำตอบ
              </label>
              <input
                id="personalAnswer"
                name="personalAnswer"
                type="text"
                required
                minLength={2}
                placeholder="พิมพ์คำตอบของคุณ"
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
        </div>

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
