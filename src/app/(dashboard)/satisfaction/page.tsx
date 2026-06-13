"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle } from "lucide-react";
import { getQuestions, hasSubmitted, submitSurvey } from "@/actions/satisfaction";
import type { SatisfactionQuestion } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

const ratings = [
  { value: 5, label: "ดีมาก" },
  { value: 4, label: "ดี" },
  { value: 3, label: "ปานกลาง" },
  { value: 2, label: "น้อย" },
  { value: 1, label: "ควรปรับปรุง" },
];

export default function SatisfactionPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<SatisfactionQuestion[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const [questionsData, submittedData] = await Promise.all([
        getQuestions(),
        hasSubmitted(),
      ]);
      setQuestions(questionsData);
      setAlreadySubmitted(submittedData);
      if (!submittedData) {
        const initial: Record<string, number> = {};
        questionsData.forEach((q) => (initial[q.id] = 0));
        setScores(initial);
      }
      setLoading(false);
    }
    init();
  }, []);

  function setScore(questionId: string, value: number) {
    setScores((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const unanswered = Object.values(scores).some((s) => s === 0);
    if (unanswered) {
      setError("กรุณาตอบให้ครบทุกข้อ");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("scores", JSON.stringify(scores));
      formData.set("feedback", feedback);

      const result = await submitSurvey(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  if (loading) return <LoadingSpinner />;

  if (alreadySubmitted || submitted) {
    return (
      <div className="mx-auto max-w-lg text-center py-10 sm:py-16">
        <CheckCircle className="mx-auto size-16 text-emerald-500 mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
          ขอบคุณสำหรับการประเมิน
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-6">
          คุณได้ทำแบบประเมินความพึงพอใจเรียบร้อยแล้ว
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
        >
          กลับแดชบอร์ด
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6 sm:space-y-8"
    >
      <PageHeader
        badge="Survey"
        title="แบบประเมินความพึงพอใจ"
        description="ประเมินการใช้งานเว็บไซต์ NurseUp (ทำได้ 1 ครั้ง)"
      />

      {questions.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">ยังไม่มีคำถามในขณะนี้</p>
        </GlassCard>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, i) => (
            <GlassCard key={q.id} className="p-5 sm:p-6">
              <p className="text-base font-medium text-foreground mb-4">
                {i + 1}. {q.question_text}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {ratings.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setScore(q.id, r.value)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-3 sm:px-4 py-3 min-w-[56px] max-w-[100px] transition-all border ${
                      scores[q.id] === r.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.value }).map((_, j) => (
                        <Star
                          key={j}
                          className={`size-3.5 ${
                            scores[q.id] === r.value
                              ? "fill-primary-foreground"
                              : "fill-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{r.label}</span>
                  </button>
                ))}
              </div>
            </GlassCard>
          ))}

          <GlassCard className="p-5 sm:p-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="เขียนข้อเสนอแนะของคุณ..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground placeholder:text-muted-foreground/60 resize-y transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </GlassCard>

          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <Send className="size-4" />
                ส่งแบบประเมิน
              </>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}
