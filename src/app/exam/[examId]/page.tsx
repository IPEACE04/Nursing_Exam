"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  GraduationCap,
  FileText,
  List,
  X,
  Play,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useTimer } from "@/hooks/use-timer";
import { submitExam, getExamSession, getPrePostTestGate } from "@/actions/exam";
import type { Question, PrePostTestGate } from "@/types";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

const STORAGE_ANSWERS_PREFIX = "exam_answers_";

export default function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useLocale();

  const [exam, setExam] = useState<{ title: string; description: string | null; time_limit_minutes: number; type: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const hasAutoSubmitted = useRef(false);
  const [gate, setGate] = useState<PrePostTestGate | null>(null);
  const [gateLoading, setGateLoading] = useState(true);

  const storageKey = `${STORAGE_ANSWERS_PREFIX}${examId}`;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      const data = await getExamSession(examId);

      if (!data) {
        router.push("/exam");
        return;
      }

      setExam(data.exam);
      setQuestions(data.questions as unknown as Question[]);

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setAnswers(JSON.parse(stored));
        } catch {}
      }

      if (data.exam.type === "pre_post_test") {
        const gateData = await getPrePostTestGate();
        setGate(gateData);
      }
      setGateLoading(false);
      setLoading(false);
    }

    fetchData();
  }, [examId, user, router, storageKey]);

  const persistAnswers = useCallback(
    (newAnswers: Record<string, string>) => {
      localStorage.setItem(storageKey, JSON.stringify(newAnswers));
    },
    [storageKey]
  );

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: option };
      persistAnswers(next);
      return next;
    });
  };

  const goTo = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setShowMobileNav(false);
    }
  };

  const timer = useTimer(examId, exam?.time_limit_minutes ?? 60);

  useEffect(() => {
    if (started && timer.isExpired && !hasAutoSubmitted.current && !submitting) {
      hasAutoSubmitted.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired, started]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);

    const timeLimitSecs = (exam?.time_limit_minutes ?? 60) * 60;
    const timeSpentSeconds = Math.max(
      0,
      timeLimitSecs - timer.seconds
    );

    const formData = new FormData();
    formData.set("examId", examId);
    formData.set("answers", JSON.stringify(answers));
    formData.set("timeSpentSeconds", String(timeSpentSeconds));

    localStorage.removeItem(storageKey);
    timer.clearTimer();

    await submitExam(formData);
  }

  function handleStart() {
    setStarted(true);
  }

  if (loading || gateLoading || !exam) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isPrePostTest = exam.type === "pre_post_test";
  const isPreTest = isPrePostTest && !gate?.preTestCompleted;
  const isPostTestLocked = isPrePostTest && gate?.preTestCompleted && !gate?.postTestUnlocked && !gate?.postTestCompleted;
  const isPostTestReady = isPrePostTest && gate?.postTestUnlocked && !gate?.postTestCompleted;
  const isPostTestDone = isPrePostTest && gate?.postTestCompleted;

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  if (!started) {
    if (isPostTestLocked) {
      return (
        <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center px-3 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full space-y-5 sm:space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-lg">
              <div className="mx-auto mb-4 sm:mb-5 flex size-16 sm:size-20 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5">
                <Lock className="size-8 sm:size-10 text-amber-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {t(locale, "exam.take.postLocked")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t(locale, "exam.take.postLockedDesc")}
              </p>

              {gate && gate.remainingExams.length > 0 && (
                <div className="mt-5 sm:mt-6 space-y-2 text-left">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t(locale, "exam.take.remainingExams")} ({gate.remainingExams.length})
                  </p>
                  <div className="space-y-1.5">
                    {gate.remainingExams.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                      >
                        <span className="text-sm text-foreground line-clamp-1">{e.title}</span>
                        <button
                          onClick={() => router.push(`/exam/${e.id}`)}
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                        >
                          {t(locale, "progress.goDo")} <ArrowRight className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                {t(locale, "exam.take.remainingN", { n: gate?.remainingExams.length ?? 0 })}
              </p>
              <button
                onClick={() => router.push("/progress")}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-transparent px-6 text-sm font-semibold text-foreground transition-all duration-150 hover:bg-muted active:translate-y-px mt-4"
              >
                {t(locale, "exam.take.viewProgress")}
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    if (isPostTestDone) {
      return (
        <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center px-3 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full space-y-5 sm:space-y-6"
          >
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-lg">
              <div className="mx-auto mb-4 sm:mb-5 flex size-16 sm:size-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle2 className="size-8 sm:size-10 text-emerald-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {t(locale, "exam.take.postDone")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t(locale, "exam.take.postDoneDesc")}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  onClick={() => router.push("/progress")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
                >
                  <ArrowRight className="size-4" />
                  {t(locale, "exam.take.compareResult")}
                </button>
                <button
                  onClick={handleStart}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-6 text-sm font-semibold text-foreground transition-all duration-150 hover:bg-muted active:translate-y-px"
                >
                  <Play className="size-4" />
                  {t(locale, "exam.take.retake")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full space-y-5 sm:space-y-6"
        >
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 sm:mb-5 flex size-16 sm:size-20 items-center justify-center rounded-full border border-border/60 bg-muted">
              <GraduationCap className="size-8 sm:size-10 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {exam.title}
            </h1>
            {exam.description && (
              <p className="mt-1.5 sm:mt-2 text-sm text-muted-foreground leading-relaxed">
                {exam.description}
              </p>
            )}

            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                <FileText className="mx-auto mb-1 size-4 sm:size-5 text-primary" />
                <p className="text-base sm:text-lg font-semibold text-foreground">
                  {questions.length}
                </p>
                <p className="text-xs text-muted-foreground">{t(locale, "exam.take.questions")}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                <Clock className="mx-auto mb-1 size-4 sm:size-5 text-chart-2" />
                <p className="text-base sm:text-lg font-semibold text-foreground">
                  {exam.time_limit_minutes}
                </p>
                <p className="text-xs text-muted-foreground">{t(locale, "exam.take.minutes")}</p>
              </div>
            </div>

            {isPrePostTest && (
              <div className="mt-4 p-3 rounded-xl border border-border bg-muted/50">
                <p className="text-sm font-medium text-foreground mb-1">
                  {isPreTest ? "PreTest" : isPostTestReady ? "PostTest" : ""}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isPreTest
                    ? t(locale, "exam.take.preTestDesc")
                    : isPostTestReady
                      ? t(locale, "exam.take.preTestUnlocked")
                      : ""}
                </p>
              </div>
            )}

            <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3 text-left text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground">
                  1
                </div>
                <span>{t(locale, "exam.take.rule1")}</span>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground">
                  2
                </div>
                <span>{t(locale, "exam.take.rule2")}</span>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-destructive/20 bg-destructive/8 text-[10px] font-bold text-destructive">
                  3
                </div>
                <span>{t(locale, "exam.take.rule3")}</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-6 sm:mt-8"
            >
              <Play className="size-4 sm:size-5" />
              {t(locale, "exam.take.startBtn")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 sm:h-18 max-w-6xl items-center justify-between px-4 sm:px-6 md:px-8 xl:px-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <GraduationCap className="size-5 sm:size-6 shrink-0 text-primary" />
            <span className="line-clamp-1 text-sm sm:text-lg font-semibold tracking-tight text-foreground">
              {exam.title}
            </span>
            {isPreTest && (
              <span className="shrink-0 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-primary">
                PreTest
              </span>
            )}
            {isPostTestReady && (
              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-emerald-600">
                PostTest
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMobileNav(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
              aria-label={t(locale, "exam.take.showQuestions")}
            >
              <List className="size-5 sm:size-6" />
            </button>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {currentIndex + 1}/{questions.length}
            </span>
            <div
              className={`flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium ${
                timer.isLow
                  ? "border border-destructive/20 bg-destructive/8 text-destructive"
                  : "border border-border bg-muted text-foreground"
              }`}
            >
              <Clock className="size-4 sm:size-5" />
              {timer.display}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-5 sm:gap-6 pt-5 sm:pt-6 pb-20 md:pb-6 px-4 sm:px-6 md:px-8 xl:px-10">
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {t(locale, "exam.take.questionN", { n: currentIndex + 1, total: questions.length })}
                  </p>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {t(locale, "exam.take.answeredN", { n: answeredCount })}
                  </span>
                </div>
                <h2 className="mt-4 text-base sm:text-xl leading-relaxed text-foreground">
                  {currentQuestion?.question_text}
                </h2>

                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-4">
                  {currentQuestion &&
                    Object.entries(
                      currentQuestion.options as Record<string, string>
                    ).map(([key, value]) => {
                      const isSelected =
                        answers[currentQuestion.id] === key;
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            selectAnswer(currentQuestion.id, key)
                          }
                          className={`flex w-full items-start gap-3 sm:gap-4 rounded-xl border p-4 sm:p-5 text-left text-sm sm:text-base transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                          }`}
                        >
                          <span
                            className={`flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-xl text-xs sm:text-sm font-bold ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {key}
                          </span>
                          <span className="pt-1.5 sm:pt-2 leading-relaxed text-foreground">
                            {value}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 sm:mt-6 flex items-center justify-between gap-3 sm:gap-4">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-transparent px-5 text-sm font-semibold text-foreground transition-all duration-150 hover:bg-muted active:translate-y-px disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-4 sm:size-5" />
              {t(locale, "exam.take.prev")}
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => goTo(currentIndex + 1)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
              >
                {t(locale, "exam.take.next")}
                <ChevronRight className="size-4 sm:size-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-700 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="size-4 sm:size-5" />
                {t(locale, "exam.take.submitAnswers")}
              </button>
            )}
          </div>
        </div>

        <aside className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-3 sm:p-4">
            <p className="mb-2.5 sm:mb-3 text-xs font-medium text-muted-foreground">
              {t(locale, "exam.take.answeredHeader")}
            </p>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id];
                const isActive = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(i)}
                     className={`flex size-[30px] sm:size-9 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : isAnswered
                          ? "border border-border bg-muted text-foreground"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 sm:mt-3 flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 sm:size-3 rounded border border-border bg-muted" />
                {t(locale, "exam.take.answered")}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-2.5 sm:size-3 rounded border border-border bg-card" />
                {t(locale, "exam.take.unanswered")}
              </span>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white transition-all duration-150 hover:bg-emerald-700 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none mt-3 sm:mt-4"
            >
              <Send className="size-3 sm:size-3.5" />
              {t(locale, "exam.take.submitBtn")}
            </button>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg"
            >
              <h3 className="text-base font-semibold text-foreground">
                {t(locale, "exam.take.confirmTitle")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {allAnswered
                  ? t(locale, "exam.take.confirmAllDone")
                  : t(locale, "exam.take.confirmPartial", { n: answeredCount, total: questions.length })}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-transparent px-5 text-sm font-semibold text-foreground transition-all duration-150 hover:bg-muted active:translate-y-px"
                >
                  {t(locale, "common.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-700 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? t(locale, "exam.take.submitting") : t(locale, "exam.take.confirmSubmit")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowMobileNav(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {t(locale, "exam.take.questionList")}
                </p>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                {questions.map((q, i) => {
                  const isAnswered = !!answers[q.id];
                  const isActive = i === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => goTo(i)}
                      className={`flex h-10 sm:h-12 items-center justify-center rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                          : isAnswered
                            ? "border border-border bg-muted text-foreground"
                            : "border border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 sm:mt-4 flex items-center justify-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <span className="inline-block size-2.5 sm:size-3 rounded border border-border bg-muted" />
                  {t(locale, "exam.take.answered")}
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <span className="inline-block size-2.5 sm:size-3 rounded border border-border bg-card" />
                  {t(locale, "exam.take.unanswered")}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
