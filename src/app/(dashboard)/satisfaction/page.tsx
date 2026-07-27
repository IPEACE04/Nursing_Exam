"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle, Layers } from "lucide-react";
import { getQuestions, hasSubmitted, submitSurvey } from "@/actions/satisfaction";
import type { SatisfactionQuestion } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

const ratingKeyMap: Record<number, string> = {
  5: "satisfaction.rating.excellent",
  4: "satisfaction.rating.good",
  3: "satisfaction.rating.average",
  2: "satisfaction.rating.poor",
  1: "satisfaction.rating.veryPoor",
};

export default function SatisfactionPage() {
  const router = useRouter();
  const { locale } = useLocale();
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
      setError(t(locale, "satisfaction.pleaseAnswerAll"));
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
          {t(locale, "satisfaction.thankYou")}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-6">
          {t(locale, "satisfaction.alreadySubmitted")}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
        >
          {t(locale, "satisfaction.backToDashboard")}
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
        title={t(locale, "satisfaction.title")}
        description={t(locale, "satisfaction.desc")}
      />

      {questions.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">{t(locale, "satisfaction.noQuestions")}</p>
        </GlassCard>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {(() => {
            const grouped = new Map<string, SatisfactionQuestion[]>();
            questions.forEach((q) => {
              const cat = q.category_name || t(locale, "satisfaction.general");
              if (!grouped.has(cat)) grouped.set(cat, []);
              grouped.get(cat)!.push(q);
            });

            return Array.from(grouped.entries()).map(([category, qs]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h3>
                </div>
                {qs.map((q, i) => (
                  <GlassCard key={q.id} className="p-5 sm:p-6">
                    <p className="text-base font-medium text-foreground mb-4">
                      {i + 1}. {q.question_text}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                      {[5, 4, 3, 2, 1].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setScore(q.id, r)}
                          className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-3 sm:px-4 py-3 min-w-[56px] max-w-[100px] transition-all border ${
                            scores[q.id] === r
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: r }).map((_, j) => (
                              <Star
                                key={j}
                                className={`size-3.5 ${
                                  scores[q.id] === r
                                    ? "fill-primary-foreground"
                                    : "fill-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium">{t(locale, ratingKeyMap[r])}</span>
                        </button>
                      ))}
                    </div>
                  </GlassCard>
                ))}
              </div>
            ));
          })()}

          <GlassCard className="p-5 sm:p-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t(locale, "satisfaction.feedback")}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t(locale, "satisfaction.feedbackPlaceholder")}
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
                {t(locale, "satisfaction.sending")}
              </>
            ) : (
              <>
                <Send className="size-4" />
                {t(locale, "satisfaction.submit")}
              </>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}
