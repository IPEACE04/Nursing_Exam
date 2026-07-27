"use client";

import { useEffect, useState, useCallback } from "react";
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
import type { Question } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  is_published: boolean;
}

export default function AdminPrePostTestPage() {
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        title="จัดการข้อสอบ PreTest & PostTest"
        description="สร้างและจัดการชุดข้อสอบ PreTest/PostTest (มีได้เพียง 1 ชุดเท่านั้น)"
      />

      {!exam && !showCreateExam ? (
        <GlassCard className="py-12 text-center">
          <GraduationCap className="mx-auto mb-3 size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ยังไม่ได้สร้างชุด PreTest/PostTest</p>
          <button
            onClick={() => setShowCreateExam(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-4"
          >
            <Plus className="size-4" />
            สร้างเลย
          </button>
        </GlassCard>
      ) : showCreateExam && !exam ? (
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <HelpCircle className="size-5 text-primary shrink-0" />
            <div>
              <h2 className="font-semibold text-foreground">สร้างชุด PreTest/PostTest</h2>
              <p className="text-xs text-muted-foreground">ตั้งค่าชื่อ เวลา และคำอธิบาย</p>
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
                ชื่อชุดข้อสอบ
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="เช่น PreTest & PostTest"
                className="h-12 w-full rounded-xl border border-border bg-background px-5 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                คำอธิบาย
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="คำอธิบายเกี่ยวกับ PreTest/PostTest"
                className="w-full rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                เวลาที่กำหนด (นาที)
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
              สร้าง
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
                      {questions.length} ข้อ
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {exam.time_limit_minutes} นาที
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        exam.is_published
                          ? "border-emerald-500/30 text-emerald-600"
                          : "border-amber-500/30 text-amber-600"
                      }`}
                    >
                      {exam.is_published ? "เผยแพร่" : "ร่าง"}
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
                  ชื่อชุดข้อสอบ
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
                  คำอธิบาย
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
                  เวลาที่กำหนด (นาที)
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
                บันทึก
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">
                  คำถามทั้งหมด ({questions.length} ข้อ)
                </h2>
                <p className="text-xs text-muted-foreground">จัดการคำถามในชุด PreTest/PostTest</p>
              </div>
              <button
                onClick={() => {
                  setShowAddQuestion(true);
                  setEditQuestionId(null);
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
              >
                <Plus className="size-4" />
                เพิ่มคำถาม
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
                  <p className="text-sm text-muted-foreground">ยังไม่มีคำถาม เพิ่มคำถามแรกเลย</p>
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
                          <span className="text-muted-foreground">ข้อ {i + 1}: </span>
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
                            <span className="font-medium text-foreground">เฉลย:</span> {q.explanation_text}
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
                            if (!confirm("ลบคำถามนี้?")) return;
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
  onClose: () => void;
}) {
  const actionFn = question ? updatePrePostQuestion : createPrePostQuestion;
  const qText = question?.question_text ?? "";
  const opt = question?.options ?? { A: "", B: "", C: "", D: "" };
  const correct = question?.correct_option ?? "A";
  const explanation = question?.explanation_text ?? "";

  return (
    <form
      action={async (formData) => {
        formData.set("examId", examId);
        if (question) formData.set("id", question.id);
        await actionFn(formData);
        onClose();
      }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Plus className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {question ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}
        </span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          คำถาม
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
              ตัวเลือก {key}
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
            เฉลย (คำตอบที่ถูก)
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
            คำอธิบายเฉลย
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
          {question ? "บันทึก" : "เพิ่ม"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:translate-y-px"
        >
          <X className="size-4" />
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
