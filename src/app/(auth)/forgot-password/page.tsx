"use client";

import { useState } from "react";
import { Mail, Lock, HelpCircle, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  getPersonalQuestion,
  verifyPersonalAnswer,
  resetPasswordWithToken,
} from "@/actions/auth";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

type Step = "email" | "answer" | "reset" | "done";

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleGetQuestion(formData: FormData) {
    setError("");
    setPending(true);
    const result = await getPersonalQuestion(formData);
    setPending(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    if ("success" in result && result.success) {
      setEmail((formData.get("email") as string) || "");
      setQuestion(result.question!);
      setStep("answer");
    }
  }

  async function handleVerifyAnswer(formData: FormData) {
    setError("");
    const fd = new FormData();
    fd.set("email", email);
    fd.set("answer", formData.get("answer") as string);

    setPending(true);
    const result = await verifyPersonalAnswer(fd);
    setPending(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    if ("success" in result && result.success) {
      setStep("reset");
    }
  }

  async function handleResetPassword(formData: FormData) {
    setError("");
    setPending(true);
    const result = await resetPasswordWithToken(formData);
    setPending(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    if ("success" in result && result.success) {
      setStep("done");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {t(locale, "forgot.title")}
        </h1>
        <p className="mt-2 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {step === "email" && t(locale, "forgot.stepEmail")}
          {step === "answer" && t(locale, "forgot.stepAnswer")}
          {step === "reset" && t(locale, "forgot.stepReset")}
          {step === "done" && t(locale, "forgot.stepDone")}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.form
            key="email"
            action={handleGetQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                {t(locale, "auth.email")}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder={t(locale, "forgot.emailPlaceholder")}
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-border bg-background px-5 py-2 pl-12 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-base text-destructive"
              >
                {error}
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
                <>
                  {t(locale, "common.next")}
                  <ArrowRight className="size-4" />
                </>
              )}
            </motion.button>
          </motion.form>
        )}

        {step === "answer" && (
          <motion.form
            key="answer"
            action={handleVerifyAnswer}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t(locale, "forgot.yourQuestion")}</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{question}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="answer" className="block text-sm font-medium text-foreground">
                {t(locale, "forgot.yourAnswer")}
              </label>
              <input
                id="answer"
                name="answer"
                type="text"
                required
                placeholder={t(locale, "forgot.answerPlaceholder")}
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-base text-destructive"
              >
                {error}
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
                t(locale, "forgot.confirmBtn")
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-base font-medium text-muted-foreground transition-all duration-150 hover:bg-muted/50"
            >
              <ArrowLeft className="size-4" />
              {t(locale, "common.back")}
            </button>
          </motion.form>
        )}

        {step === "reset" && (
          <motion.form
            key="reset"
            action={handleResetPassword}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                  {t(locale, "forgot.newPassword")}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder={t(locale, "forgot.newPasswordPlaceholder")}
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-border bg-background px-5 py-2 pl-12 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                  {t(locale, "forgot.confirmPassword")}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder={t(locale, "forgot.confirmPasswordPlaceholder")}
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-border bg-background px-5 py-2 pl-12 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-base text-destructive"
              >
                {error}
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
                t(locale, "forgot.resetBtn")
              )}
            </motion.button>
          </motion.form>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-center"
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="size-8 text-emerald-500" />
            </div>

            <div>
              <p className="text-lg font-semibold text-foreground">{t(locale, "forgot.doneTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(locale, "forgot.doneDesc")}</p>
            </div>

            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90"
            >
              {t(locale, "forgot.goToLogin")}
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t(locale, "forgot.remembered")}{" "}
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
