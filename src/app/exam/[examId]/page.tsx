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
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { useAuth } from "@/context/auth-context";
import { useTimer } from "@/hooks/use-timer";
import { submitExam } from "@/actions/exam";
import type { Question } from "@/types";

const STORAGE_ANSWERS_PREFIX = "exam_answers_";

export default function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [exam, setExam] = useState<{ title: string; time_limit_minutes: number } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasAutoSubmitted = useRef(false);

  const storageKey = `${STORAGE_ANSWERS_PREFIX}${examId}`;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      const supabase = createSupabaseBrowserClient();

      const { data: examData } = await supabase
        .from("exams")
        .select("title, time_limit_minutes")
        .eq("id", examId)
        .single();

      if (!examData) {
        router.push("/exam");
        return;
      }

      setExam(examData);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("sort_order", { ascending: true });

      if (questionsData) {
        setQuestions(questionsData as Question[]);
      }

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setAnswers(JSON.parse(stored));
        } catch {}
      }

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
    }
  };

  const timer = useTimer(examId, exam?.time_limit_minutes ?? 60);

  useEffect(() => {
    if (timer.isExpired && !hasAutoSubmitted.current && !submitting) {
      hasAutoSubmitted.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired]);

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

    try {
      await submitExam(formData);
    } catch {
      router.push("/exam");
    }
  }

  if (loading || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="size-5 text-primary" />
            <span className="line-clamp-1 text-sm font-semibold text-foreground">
              {exam.title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{questions.length}
            </span>
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium ${
                timer.isLow
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-foreground"
              }`}
            >
              <Clock className="size-4" />
              {timer.display}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-border/60 bg-card/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  ข้อ {currentIndex + 1}
                </p>
                <h2 className="text-base leading-relaxed text-foreground sm:text-lg">
                  {currentQuestion?.question_text}
                </h2>

                <div className="mt-6 space-y-3">
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
                          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left text-sm transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-card hover:border-primary/20 hover:bg-muted/50"
                          }`}
                        >
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {key}
                          </span>
                          <span className="pt-1.5 leading-relaxed text-foreground/80">
                            {value}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="btn-premium-outline px-4 py-2 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
              ก่อนหน้า
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => goTo(currentIndex + 1)}
                className="btn-premium px-4 py-2"
              >
                ถัดไป
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-chart-3 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-chart-3/90 disabled:opacity-50"
              >
                <Send className="size-4" />
                ส่งกระดาษคำตอบ
              </button>
            )}
          </div>
        </div>

        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/90 p-4 backdrop-blur-sm">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              ข้อที่ตอบแล้ว {answeredCount}/{questions.length}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id];
                const isActive = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(i)}
                    className={`flex size-9 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : isAnswered
                          ? "border border-chart-3/30 bg-chart-3/10 text-chart-3"
                          : "border border-border bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-chart-3 py-2 text-xs font-medium text-white transition-colors hover:bg-chart-3/90 disabled:opacity-50"
            >
              <Send className="size-3.5" />
              ส่งคำตอบ
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <h3 className="text-base font-semibold text-foreground">
                ยืนยันส่งคำตอบ
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {allAnswered
                  ? "คุณตอบครบทุกข้อแล้ว ยืนยันส่งคำตอบ?"
                  : `คุณตอบไปแล้ว ${answeredCount} จาก ${questions.length} ข้อ ข้อที่ยังไม่ตอบจะถือว่าผิด ยืนยันส่งคำตอบ?`}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-premium-outline flex-1 py-2.5"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-chart-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-chart-3/90 disabled:opacity-50"
                >
                  {submitting ? "กำลังส่ง..." : "ยืนยันส่ง"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
