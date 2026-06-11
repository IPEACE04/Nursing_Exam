"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  GraduationCap,
  ArrowLeft,
  BarChart3,
  Clock,
  Target,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import type { QuestionResult } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();

  const [examTitle, setExamTitle] = useState("");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      const supabase = createSupabaseBrowserClient();

      const { data: attempt, error: aErr } = await supabase
        .from("exam_attempts")
        .select("*, exams ( title )")
        .eq("id", attemptId)
        .single();

      if (aErr || !attempt) {
        router.push("/exam");
        return;
      }

      const examData = attempt.exams as unknown as { title: string };
      setExamTitle(examData?.title ?? "");
      setScore(attempt.score);
      setTotal(attempt.total_questions);
      setTimeSpent(attempt.time_spent_seconds);

      const { data: answers } = await supabase
        .from("user_answers")
        .select("*, questions!inner ( question_text, options, correct_option, explanation_text )")
        .eq("attempt_id", attemptId);

      if (answers) {
        setResults(
          answers.map((a) => {
            const q = a.questions as unknown as {
              question_text: string;
              options: Record<string, string>;
              correct_option: string;
              explanation_text: string | null;
            };
            return {
              id: a.id,
              attempt_id: a.attempt_id,
              question_id: a.question_id,
              selected_option: a.selected_option,
              is_correct: a.is_correct,
              answered_at: a.answered_at,
              question_text: q.question_text,
              options: q.options,
              correct_option: q.correct_option,
              explanation_text: q.explanation_text,
            };
          })
        );
      }

      setLoading(false);
    }

    fetchResults();
  }, [attemptId, router]);

  if (loading) return <LoadingSpinner />;

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 50;
  const incorrectCount = total - score;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 md:px-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 sm:space-y-10"
      >
        <div>
          <button
            onClick={() => router.push("/community")}
            className="mb-5 btn-ghost"
          >
            <ArrowLeft className="size-5" />
            กลับไปแดชบอร์ด
          </button>
          <PageHeader
            badge={passed ? "ผ่าน" : "ไม่ผ่าน"}
            title={examTitle}
            description="ผลการสอบของคุณ"
          />
        </div>

        <motion.div variants={itemAnim}>
          <GlassCard className="p-6 sm:p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className={`mx-auto mb-6 flex size-24 sm:size-28 items-center justify-center rounded-full ${
                passed ? "bg-chart-3/10" : "bg-destructive/10"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="size-12 sm:size-14 text-chart-3" />
              ) : (
                <XCircle className="size-12 sm:size-14 text-destructive" />
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground"
            >
              {percentage}%
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-base sm:text-lg text-muted-foreground"
            >
              {passed ? "ยินดีด้วย! คุณสอบผ่าน" : "ยังไม่ผ่านเกณฑ์ ลองใหม่อีกครั้งนะ"}
            </motion.p>

            <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-5">
              {[
                { icon: Target, label: "ข้อที่ถูก", value: `${score}/${total}`, bg: "bg-chart-3/10", color: "text-chart-3" },
                { icon: XCircle, label: "ข้อที่ผิด", value: `${incorrectCount}`, bg: "bg-destructive/10", color: "text-destructive" },
                { icon: Clock, label: "เวลาที่ใช้", value: formatTime(timeSpent), bg: "bg-primary/8", color: "text-primary" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5"
                >
                  <div className={`mx-auto mb-2.5 flex size-11 sm:size-12 items-center justify-center rounded-xl ${stat.bg}`}>
                    <stat.icon className={`size-5 sm:size-6 ${stat.color}`} />
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <GlassCard className="p-5 sm:p-6">
            <h2 className="mb-6 text-lg sm:text-xl font-semibold text-foreground">
              เฉลยละเอียด
            </h2>
            <div className="space-y-5">
              {results.map((r, i) => {
                const optionLabels = r.options as Record<string, string>;
                const isWrong = !r.is_correct;
                const unanswered = r.selected_option === null;

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-xl border p-5 sm:p-6 ${
                      isWrong
                        ? "border-destructive/20 bg-destructive/[0.03]"
                        : "border-chart-3/20 bg-chart-3/[0.03]"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="text-sm font-medium text-muted-foreground">
                        ข้อ {i + 1}
                      </span>
                      {r.is_correct ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/10 px-3 py-1 text-xs font-medium text-chart-3">
                          <CheckCircle2 className="size-3.5" />
                          ถูก
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                          <XCircle className="size-3.5" />
                          ผิด
                        </span>
                      )}
                    </div>

                    <p className="text-base leading-relaxed text-foreground">
                      {r.question_text}
                    </p>

                    <div className="mt-4 space-y-2 text-sm">
                      {Object.entries(optionLabels).map(([key, value]) => {
                        const isSelected = key === r.selected_option;
                        const isCorrect = key === r.correct_option;
                        return (
                          <div
                            key={key}
                            className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
                              isCorrect
                                ? "border-chart-3/30 bg-chart-3/8"
                                : isSelected && !isCorrect
                                  ? "border-destructive/30 bg-destructive/8"
                                  : "border-transparent bg-muted/50"
                            }`}
                          >
                            <span
                              className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                isCorrect
                                  ? "bg-chart-3 text-white"
                                  : isSelected
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                              }`}
                            >
                              {key}
                            </span>
                            <span
                              className={`pt-1 ${
                                isCorrect
                                  ? "font-medium text-chart-3"
                                  : isSelected
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {value}
                              {isCorrect && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (เฉลย)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {unanswered && (
                      <p className="mt-3 text-sm text-destructive">
                        * ไม่ได้ตอบข้อนี้
                      </p>
                    )}

                    {r.explanation_text && (
                      <div className="mt-4 rounded-xl bg-accent/8 px-5 py-3.5 text-sm leading-relaxed text-accent-foreground">
                        <span className="font-medium">คำอธิบาย: </span>
                        {r.explanation_text}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemAnim} className="flex justify-center gap-4 pb-8">
          <button
            onClick={() => router.push("/community")}
            className="btn-premium-outline"
          >
            <BarChart3 className="size-5" />
            ไปแดชบอร์ด
          </button>
          <button
            onClick={() => router.push("/exam")}
            className="btn-premium"
          >
            <GraduationCap className="size-5" />
            ทำข้อสอบอื่น
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
