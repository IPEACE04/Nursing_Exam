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
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { FormField } from "@/components/premium/form-field";
import { getPrePostTestExam } from "@/actions/exam";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { locale } = useLocale();
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
          {t(locale, "register.title")}
        </h1>
        <p className="mt-2 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {t(locale, "register.desc")}
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <FormField
          id="name"
          name="name"
          icon={User}
          placeholder={t(locale, "register.name")}
          autoComplete="off"
          required
        />

        <FormField
          id="email"
          name="email"
          icon={Mail}
          type="email"
          placeholder={t(locale, "auth.email")}
          autoComplete="off"
          required
        />

        <FormField
          id="password"
          name="password"
          icon={Lock}
          type="password"
          placeholder={t(locale, "auth.password")}
          autoComplete="off"
          minLength={6}
          required
        />

        <div className="border-t border-border pt-4">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            {t(locale, "register.personalInfo")}
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="gender" className="mb-1.5 block text-sm font-medium text-foreground">
                {t(locale, "register.gender")}
              </label>
              <select
                id="gender"
                name="gender"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="">{t(locale, "register.gender.none")}</option>
                <option value="ชาย">{t(locale, "register.gender.male")}</option>
                <option value="หญิง">{t(locale, "register.gender.female")}</option>
                <option value="อื่นๆ">{t(locale, "register.gender.other")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-foreground">
                  {t(locale, "register.age")}
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min={15}
                  max={99}
                  placeholder={t(locale, "register.age")}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label htmlFor="gpa" className="mb-1.5 block text-sm font-medium text-foreground">
                  {t(locale, "register.gpa")}
                </label>
                <input
                  id="gpa"
                  name="gpa"
                  type="number"
                  min={0}
                  max={4}
                  step={0.01}
                  placeholder={t(locale, "register.gpaPlaceholder")}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              
            </div>

            <FormField
              id="studentId"
              name="studentId"
              icon={IdCard}
              placeholder={t(locale, "register.studentId")}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            {t(locale, "register.personalQuestion")}
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="personalQuestion" className="mb-1.5 block text-sm font-medium text-foreground">
                {t(locale, "register.selectQuestion")}
              </label>
              <select
                id="personalQuestion"
                name="personalQuestion"
                required
                defaultValue=""
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="" disabled>{t(locale, "register.chooseQuestion")}</option>
                {PERSONAL_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="personalAnswer" className="mb-1.5 block text-sm font-medium text-foreground">
                {t(locale, "register.answer")}
              </label>
              <input
                id="personalAnswer"
                name="personalAnswer"
                type="text"
                required
                minLength={2}
                placeholder={t(locale, "register.answerPlaceholder")}
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
            t(locale, "register.submit")
          )}
        </motion.button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t(locale, "auth.hasAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {t(locale, "auth.loginBtn")}
        </Link>
      </p>
    </motion.div>
  );
}
