"use client";

import { useEffect, useState, useCallback, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  HelpCircle,
  Rocket,
  Clock,
  FileText,
  GraduationCap,
} from "lucide-react";
import {
  createPrePostExam,
  getPrePostExam,
  createPrePostQuestion,
  updatePrePostQuestion,
  deletePrePostQuestion,
  togglePrePostPublish,
} from "@/actions/admin";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import type { Question } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { ImageGallery } from "@/components/shared/image-gallery";
import { ImageUpload } from "@/components/shared/image-upload";
import { scheduleScrollPositionRestore } from "@/lib/scroll-position";
import { appendQuestionMediaToFormData } from "@/lib/question-media-form";

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  is_published: boolean;
}

export default function AdminPrePostTestPage() {
  const { locale } = useLocale();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const pendingScrollY = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    const result = await getPrePostExam();
    if (result) {
      setExam(result.exam);
      setQuestions(result.questions as unknown as Question[]);
      if (result.exam.title) setShowCreateExam(false);
    } else {
      setExam(null);
      setQuestions([]);
      setShowCreateExam(true);
    }
    setLoading(false);
    const scrollY = pendingScrollY.current;
    if (scrollY !== null) {
      pendingScrollY.current = null;
      scheduleScrollPositionRestore(window, scrollY, (callback) => window.requestAnimationFrame(callback));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData, refreshKey]);

  async function handleTogglePublish() {
    if (!exam) return;
    const fd = new FormData();
    fd.set("id", exam.id);
    fd.set("is_published", String(exam.is_published));
    await togglePrePostPublish(fd);
    setExam((prev) => (prev ? { ...prev, is_published: !prev.is_published } : null));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl space-y-6 sm:space-y-8"
    >
      <PageHeader
        badge="PreTest / PostTest"
        title={t(locale, "admin.prepost.title")}
        description={t(locale, "admin.prepost.desc")}
      />

      {!exam && !showCreateExam ? (
        <GlassCard className="py-12 text-center">
          <GraduationCap className="mx-auto mb-3 size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t(locale, "admin.prepost.empty")}</p>
          <button
            onClick={() => setShowCreateExam(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-4"
          >
            <Plus className="size-4" />
            {t(locale, "admin.prepost.createBtn")}
          </button>
        </GlassCard>
      ) : showCreateExam && !exam ? (
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <HelpCircle className="size-5 text-primary shrink-0" />
            <div>
              <h2 className="font-semibold text-foreground">{t(locale, "admin.prepost.createTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t(locale, "admin.edit.detailsDesc")}</p>
            </div>
          </div>
          <form
            action={async (formData) => {
              await createPrePostExam(formData);
              setRefreshKey((k) => k + 1);
            }}
            className="space-y-5"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t(locale, "admin.edit.examName")}
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder={t(locale, "admin.prepost.namePlaceholder")}
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
                placeholder={t(locale, "admin.prepost.descPlaceholder")}
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
                defaultValue={60}
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
              {t(locale, "admin.exams.createBtn")}
            </button>
          </form>
        </GlassCard>
      ) : exam ? (
        <>
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="size-5 text-primary shrink-0" />
                <div>
                  <h2 className="font-semibold text-foreground">{exam.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <FileText className="size-3" />
                      {questions.length} {t(locale, "exam.list.questions")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {exam.time_limit_minutes} {t(locale, "exam.list.minutes")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        exam.is_published
                          ? "border-emerald-500/30 text-emerald-600"
                          : "border-amber-500/30 text-amber-600"
                      }`}
                    >
                      {exam.is_published ? t(locale, "admin.exams.published") : t(locale, "admin.exams.draft")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleTogglePublish}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${
                  exam.is_published
                    ? "border-red-500/20 text-red-600 hover:bg-red-500/5"
                    : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Rocket className="size-3.5" />
                {exam.is_published ? "Cancel Launch" : "Launch Exam"}
              </button>
            </div>

            <form action={createPrePostExam} className="space-y-5">
              <input type="hidden" name="id" value={exam.id} />
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
                  {t(locale, "admin.prepost.totalQuestions", { count: questions.length })}
                </h2>
                <p className="text-xs text-muted-foreground">{t(locale, "admin.prepost.manageDesc")}</p>
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
                    examId={exam.id}
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
                              {q.option_image_urls?.[key] && <img src={q.option_image_urls[key]} alt="" className="ml-1 size-5 rounded object-cover" />}
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
                            await deletePrePostQuestion(fd);
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
        </>
      ) : null}
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
  onClose: (scrollY?: number) => void;
}) {
  const { locale } = useLocale();
  const actionFn = question ? updatePrePostQuestion : createPrePostQuestion;
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
    formData.set("examId", examId);
    if (question) formData.set("id", question.id);
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
