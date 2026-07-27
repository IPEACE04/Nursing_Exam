"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import {
  updateExam,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getExamWithQuestions,
} from "@/actions/admin";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import type { Question } from "@/types";

export default function EditExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = use(params);
  const router = useRouter();
  const { locale } = useLocale();

  const [exam, setExam] = useState<{
    title: string;
    description: string | null;
    time_limit_minutes: number;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      const result = await getExamWithQuestions(examId);

      if (!result) {
        router.push("/admin/exams");
        return;
      }

      setExam(result.exam);
      setQuestions(result.questions as unknown as Question[]);
      setLoading(false);
    }

    load();
  }, [examId, router, refreshKey]);

  if (loading || !exam) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl space-y-6 sm:space-y-8"
    >
      <div>
        <button
          onClick={() => router.push("/admin/exams")}
          className="mb-4 inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t(locale, "admin.edit.back")}
        </button>
        <PageHeader
          badge={exam.title}
          title={t(locale, "admin.edit.title")}
          description={t(locale, "admin.edit.desc")}
        />
      </div>

      <GlassCard className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <HelpCircle className="size-5 text-primary shrink-0" />
          <div>
            <h2 className="font-semibold text-foreground">{t(locale, "admin.edit.details")}</h2>
            <p className="text-xs text-muted-foreground">{t(locale, "admin.edit.detailsDesc")}</p>
          </div>
        </div>
        <form action={updateExam} className="space-y-5">
          <input type="hidden" name="id" value={examId} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t(locale, "admin.edit.examName")}
            </label>
            <input
              name="title"
              type="text"
              defaultValue={exam.title}
              required
              className="h-12 w-full rounded-xl border border-border bg-background px-5 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t(locale, "admin.exams.description")}
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={exam.description ?? ""}
              className="w-full rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t(locale, "admin.edit.timeLimit")}
            </label>
            <input
              name="timeLimit"
              type="number"
              defaultValue={exam.time_limit_minutes}
              min={1}
              required
              className="h-12 w-full max-w-32 rounded-xl border border-border bg-background px-5 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <Check className="size-4" />
            {t(locale, "common.save")}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              {t(locale, "admin.edit.totalQuestions", { count: questions.length })}
            </h2>
            <p className="text-xs text-muted-foreground">{t(locale, "admin.edit.manageQuestions")}</p>
          </div>
          <button
            onClick={() => {
              setShowAddQuestion(true);
              setEditQuestionId(null);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <Plus className="size-4" />
            {t(locale, "admin.edit.addQuestion")}
          </button>
        </div>

        <AnimatePresence>
          {(showAddQuestion || editQuestionId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <QuestionForm
                examId={examId}
                question={
                  editQuestionId
                    ? questions.find((q) => q.id === editQuestionId)
                    : undefined
                }
                onClose={() => {
                  setShowAddQuestion(false);
                  setEditQuestionId(null);
                  setRefreshKey((k) => k + 1);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="py-10 text-center">
              <HelpCircle className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t(locale, "admin.edit.noQuestions")}</p>
            </div>
          ) : (
            questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      <span className="text-muted-foreground">{t(locale, "admin.edit.questionN", { n: i + 1 })} </span>
                      {q.question_text}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(q.options).map(([key, val]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs ${
                            key === q.correct_option
                              ? "border-emerald-500/20 bg-emerald-500/5 font-medium text-emerald-600"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {key}. {val as string}
                          {key === q.correct_option && (
                            <Check className="size-3" />
                          )}
                        </span>
                      ))}
                    </div>
                    {q.explanation_text && (
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed break-words">
                        <span className="font-medium text-foreground">{t(locale, "admin.edit.answerKey")}</span> {q.explanation_text}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditQuestionId(q.id);
                        setShowAddQuestion(false);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(t(locale, "admin.edit.deleteQuestionConfirm"))) return;
                        const fd = new FormData();
                        fd.set("id", q.id);
                        fd.set("examId", examId);
                        await deleteQuestion(fd);
                        setRefreshKey((k) => k + 1);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function QuestionForm({
  examId,
  question,
  onClose,
}: {
  examId: string;
  question?: Question;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const actionFn = question ? updateQuestion : createQuestion;
  const qText = question?.question_text ?? "";
  const opt = question?.options ?? { A: "", B: "", C: "", D: "" };
  const correct = question?.correct_option ?? "A";
  const explanation = question?.explanation_text ?? "";

  return (
    <form
      action={async (formData) => {
        await actionFn(formData);
        onClose();
      }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Plus className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {question ? t(locale, "admin.edit.editQuestion") : t(locale, "admin.edit.addNewQuestion")}
        </span>
      </div>

      <input type="hidden" name="examId" value={examId} />
      {question && <input type="hidden" name="id" value={question.id} />}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t(locale, "admin.edit.questionLabel")}
        </label>
        <textarea
          name="questionText"
          rows={2}
          defaultValue={qText}
          required
          className="w-full rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {["A", "B", "C", "D"].map((key) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t(locale, "admin.edit.optionLabel", { x: key })}
            </label>
            <input
              name={`option${key}`}
              type="text"
              defaultValue={(opt as Record<string, string>)[key] ?? ""}
              required
              className="h-12 w-full rounded-xl border border-border bg-background px-5 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t(locale, "admin.edit.answerLabel")}
          </label>
          <select
            name="correctOption"
            defaultValue={correct}
            className="h-12 w-full sm:w-auto rounded-xl border border-border bg-background px-5 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t(locale, "admin.edit.explanationLabel")}
          </label>
          <textarea
            name="explanation"
            rows={2}
            defaultValue={explanation}
            className="w-full rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
        >
          <Check className="size-4" />
          {question ? t(locale, "common.save") : t(locale, "admin.satisfaction.add")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:translate-y-px"
        >
          <X className="size-4" />
          {t(locale, "common.cancel")}
        </button>
      </div>
    </form>
  );
}
