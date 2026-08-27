"use client";

import { useEffect, useState, use, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { ImageGallery } from "@/components/shared/image-gallery";
import { ImageUpload } from "@/components/shared/image-upload";
import { scheduleScrollPositionRestore } from "@/lib/scroll-position";
import { appendQuestionMediaToFormData } from "@/lib/question-media-form";

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
  const pendingScrollY = useRef<number | null>(null);

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
      const scrollY = pendingScrollY.current;
      if (scrollY !== null) {
        pendingScrollY.current = null;
        scheduleScrollPositionRestore(window, scrollY, (callback) => window.requestAnimationFrame(callback));
      }
    }

    load();
  }, [examId, router, refreshKey]);

  if (loading || !exam) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
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
          animated={false}
        />
      </div>

      <GlassCard animated={false} className="p-5 sm:p-6">
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

      <GlassCard animated={false} className="p-5 sm:p-6">
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

        {(showAddQuestion || editQuestionId) && (
          <div className="mb-4">
            <QuestionForm
              examId={examId}
              question={
                editQuestionId
                  ? questions.find((q) => q.id === editQuestionId)
                  : undefined
              }
              onClose={(scrollY) => {
                if (typeof scrollY === "number") pendingScrollY.current = scrollY;
                setShowAddQuestion(false);
                setEditQuestionId(null);
                setRefreshKey((k) => k + 1);
              }}
            />
          </div>
        )}

        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="py-10 text-center">
              <HelpCircle className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t(locale, "admin.edit.noQuestions")}</p>
            </div>
          ) : (
            questions.map((q, i) => (
              <div
                key={q.id}
                className="group rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      <span className="text-muted-foreground">{t(locale, "admin.edit.questionN", { n: i + 1 })} </span>
                      {q.question_text}
                    </p>
                    {q.question_image_url && <ImageGallery imageUrls={[q.question_image_url]} className="mt-3 max-w-xs" />}
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
                          {q.option_image_urls?.[key] && <img src={q.option_image_urls[key]} alt="" loading="lazy" className="ml-1 size-5 rounded object-cover" />}
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
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function QuestionForm({
  examId,
  question,
  onClose,
}: {
  examId: string;
  question?: Question;
  onClose: (scrollY?: number) => void;
}) {
  const { locale } = useLocale();
  const actionFn = question ? updateQuestion : createQuestion;
  const qText = question?.question_text ?? "";
  const opt = question?.options ?? { A: "", B: "", C: "", D: "" };
  const correct = question?.correct_option ?? "A";
  const explanation = question?.explanation_text ?? "";
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [questionImage, setQuestionImage] = useState<File[]>([]);
  const [existingQuestionImage, setExistingQuestionImage] = useState<string[]>(question?.question_image_url ? [question.question_image_url] : []);
  const [optionImages, setOptionImages] = useState<Record<string, File[]>>({ A: [], B: [], C: [], D: [] });
  const [existingOptionImages, setExistingOptionImages] = useState<Record<string, string[]>>(
    Object.fromEntries(["A", "B", "C", "D"].map((key) => [key, question?.option_image_urls?.[key] ? [question.option_image_urls[key]] : []])),
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const scrollY = window.scrollY;
    const formData = new FormData(event.currentTarget);
    appendQuestionMediaToFormData(formData, questionImage, optionImages);

    startTransition(async () => {
      try {
        const result = await actionFn(formData);
        if (result?.error) setFormError(result.error);
        else onClose(scrollY);
      } catch {
        setFormError("ไม่สามารถบันทึกคำถามได้ กรุณาลองใหม่");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
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

      <input type="hidden" name="removeQuestionImage" value={existingQuestionImage.length === 0 && question?.question_image_url ? "true" : "false"} />
      <ImageUpload
        files={questionImage}
        onChange={setQuestionImage}
        maxFiles={1}
        existingUrls={existingQuestionImage}
        onRemoveExisting={() => setExistingQuestionImage([])}
        label="รูปคำถาม"
        name="questionImage"
      />

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
            <input type="hidden" name={`removeOptionImage${key}`} value={existingOptionImages[key]?.length === 0 && question?.option_image_urls?.[key] ? "true" : "false"} />
            <ImageUpload
              files={optionImages[key] ?? []}
              onChange={(files) => setOptionImages((prev) => ({ ...prev, [key]: files }))}
              maxFiles={1}
              existingUrls={existingOptionImages[key] ?? []}
              onRemoveExisting={() => setExistingOptionImages((prev) => ({ ...prev, [key]: [] }))}
              label={`รูปตัวเลือก ${key}`}
              name={`optionImage${key}`}
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
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
        >
          <Check className="size-4" />
          {isPending ? t(locale, "common.saving") : question ? t(locale, "common.save") : t(locale, "admin.satisfaction.add")}
        </button>
        <button
          type="button"
          onClick={() => onClose()}
          className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:translate-y-px"
        >
          <X className="size-4" />
          {t(locale, "common.cancel")}
        </button>
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
    </form>
  );
}
