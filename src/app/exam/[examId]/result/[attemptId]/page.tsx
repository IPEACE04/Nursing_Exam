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
import { getExamResult } from "@/actions/exam";
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

interface AttemptRow {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  total_questions: number;
  time_spent_seconds: number;
  completed_at: string;
  exams: { title: string } | null;
}

interface UserAnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean;
  answered_at: string;
  questions: {
    question_text: string;
    options: Record<string, string>;
    correct_option: string;
    explanation_text: string | null;
  };
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
      const data = await getExamResult(attemptId);

      if (!data) {
        router.push("/exam");
        return;
      }

      const a = data.attempt as unknown as AttemptRow;
      setExamTitle(a.exams?.title ?? "");
      setScore(a.score);
      setTotal(a.total_questions);
      setTimeSpent(a.time_spent_seconds);

      const answers = data.answers as unknown as UserAnswerRow[];
      if (answers.length > 0) {
        setResults(
          answers.map((a) => ({
            id: a.id,
            attempt_id: a.attempt_id,
            question_id: a.question_id,
            selected_option: a.selected_option,
            is_correct: a.is_correct,
            answered_at: a.answered_at,
            question_text: a.questions.question_text,
            options: a.questions.options,
            correct_option: a.questions.correct_option,
            explanation_text: a.questions.explanation_text,
          }))
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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 xl:px-10 py-8 sm:py-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 sm:space-y-10 md:space-y-12"
      >
        <div>
          <button
            onClick={() => router.push("/community")}
            className="mb-5 inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              className={`mx-auto mb-6 flex size-24 sm:size-28 items-center justify-center rounded-full border ${
                passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="size-12 sm:size-14 text-emerald-600" />
              ) : (
                <XCircle className="size-12 sm:size-14 text-destructive" />
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground font-heading"
            >
              {percentage}%
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              {passed ? "ยินดีด้วย! คุณสอบผ่าน" : "ยังไม่ผ่านเกณฑ์ ลองใหม่อีกครั้งนะ"}
            </motion.p>

            <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-5">
              {[
                { icon: Target, label: "ข้อที่ถูก", value: `${score}/${total}`, color: "text-emerald-600" },
                { icon: XCircle, label: "ข้อที่ผิด", value: `${incorrectCount}`, color: "text-destructive" },
                { icon: Clock, label: "เวลาที่ใช้", value: formatTime(timeSpent), color: "text-primary" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-4 sm:p-5"
                >
                  <stat.icon className={`mx-auto mb-2.5 size-5 sm:size-6 ${stat.color}`} />
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
                        : "border-emerald-500/20 bg-emerald-500/[0.03]"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="text-sm font-medium text-muted-foreground">
                        ข้อ {i + 1}
                      </span>
                      {r.is_correct ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-transparent px-3 py-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="size-3.5" />
                          ถูก
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-transparent px-3 py-1 text-xs font-medium text-destructive">
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
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : isSelected && !isCorrect
                                  ? "border-destructive/30 bg-destructive/5"
                                  : "border-transparent bg-muted/50"
                            }`}
                          >
                            <span
                              className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : isSelected
                                    ? "bg-destructive text-destructive-foreground"
                                    : "border border-border bg-card text-muted-foreground"
                              }`}
                            >
                              {key}
                            </span>
                            <span
                              className={`pt-1 leading-relaxed ${
                                isCorrect
                                  ? "font-medium text-emerald-600"
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
                      <div className="mt-4 rounded-xl border border-border bg-muted px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
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
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-transparent px-6 text-sm font-semibold text-foreground transition-all duration-150 hover:bg-muted active:translate-y-px"
          >
            <BarChart3 className="size-5" />
            ไปแดชบอร์ด
          </button>
          <button
            onClick={() => router.push("/exam")}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <GraduationCap className="size-5" />
            ทำข้อสอบอื่น
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
