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
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { QuestionResult } from "@/types";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-[#1a2744] border-t-transparent" />
      </div>
    );
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const minutes = Math.floor(timeSpent / 60);
  const secs = timeSpent % 60;
  const passed = percentage >= 50;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        กลับไปแดชบอร์ด
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
      >
        <div
          className={`mx-auto mb-4 flex size-20 items-center justify-center rounded-full ${
            passed ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          {passed ? (
            <CheckCircle2 className="size-10 text-emerald-500" />
          ) : (
            <XCircle className="size-10 text-red-400" />
          )}
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          {examTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">ผลการสอบ</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-[#1a2744]">{percentage}%</p>
            <p className="text-xs text-slate-500">คะแนน</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-[#1a2744]">
              {score}/{total}
            </p>
            <p className="text-xs text-slate-500">ข้อที่ถูก</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-[#1a2744]">
              {minutes}:{String(secs).padStart(2, "0")}
            </p>
            <p className="text-xs text-slate-500">เวลาที่ใช้</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          เฉลยละเอียด
        </h2>

        {results.map((r, i) => {
          const optionLabels = r.options as Record<string, string>;

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">
                  ข้อ {i + 1}
                </span>
                {r.is_correct ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="size-3" />
                    ถูก
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                    <XCircle className="size-3" />
                    ผิด
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-slate-900">
                {r.question_text}
              </p>

              <div className="mt-3 space-y-1.5 text-sm">
                {Object.entries(optionLabels).map(([key, value]) => {
                  const isSelected = key === r.selected_option;
                  const isCorrect = key === r.correct_option;
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : isSelected && !isCorrect
                            ? "border-red-200 bg-red-50"
                            : "border-transparent bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : isSelected
                              ? "bg-red-400 text-white"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {key}
                      </span>
                      <span
                        className={`pt-0.5 ${
                          isCorrect
                            ? "font-medium text-emerald-700"
                            : isSelected
                              ? "text-red-600"
                              : "text-slate-600"
                        }`}
                      >
                        {value}
                        {isCorrect && " (เฉลย)"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {r.selected_option === null && (
                <p className="mt-2 text-xs text-red-400">
                  * ไม่ได้ตอบข้อนี้
                </p>
              )}

              {r.explanation_text && (
                <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                  <span className="font-medium">คำอธิบาย: </span>
                  {r.explanation_text}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center gap-3 pb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <BarChart3 className="size-4" />
          ไปแดชบอร์ด
        </button>
        <button
          onClick={() => router.push("/exam")}
          className="flex items-center gap-2 rounded-xl bg-[#1a2744] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2744]/90"
        >
          <GraduationCap className="size-4" />
          ทำข้อสอบอื่น
        </button>
      </div>
    </div>
  );
}
