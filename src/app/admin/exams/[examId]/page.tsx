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
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  updateExam,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/actions/admin";
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
    let cancelled = false;

    async function load() {
      const supabase = createSupabaseBrowserClient();

      const { data: examData } = await supabase
        .from("exams")
        .select("title, description, time_limit_minutes")
        .eq("id", examId)
        .single();

      if (cancelled) return;

      if (!examData) {
        router.push("/admin/exams");
        return;
      }

      setExam(examData);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("sort_order", { ascending: true });

      if (!cancelled && questionsData) {
        setQuestions(questionsData as unknown as Question[]);
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [examId, router, refreshKey]);

  if (loading || !exam) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <button
          onClick={() => router.push("/admin/exams")}
          className="mb-4 btn-ghost"
        >
          <ArrowLeft className="size-4" />
          กลับไปรายการข้อสอบ
        </button>
        <PageHeader
          badge={exam.title}
          title="แก้ไขชุดข้อสอบ"
          description="แก้ไขรายละเอียดชุดข้อสอบและจัดการคำถาม"
        />
      </div>

      <GlassCard>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8">
            <HelpCircle className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">รายละเอียด</h2>
            <p className="text-xs text-muted-foreground">ตั้งค่าชื่อ เวลา และคำอธิบาย</p>
          </div>
        </div>
        <form action={updateExam} className="space-y-4">
          <input type="hidden" name="id" value={examId} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              ชื่อชุดข้อสอบ
            </label>
            <input
              name="title"
              type="text"
              defaultValue={exam.title}
              required
              className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              คำอธิบาย
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={exam.description ?? ""}
              className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              เวลาที่กำหนด (นาที)
            </label>
            <input
              name="timeLimit"
              type="number"
              defaultValue={exam.time_limit_minutes}
              min={1}
              required
              className="w-full max-w-32 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button type="submit" className="btn-premium">
            <Check className="size-4" />
            บันทึก
          </button>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              คำถามทั้งหมด ({questions.length} ข้อ)
            </h2>
            <p className="text-xs text-muted-foreground">จัดการคำถามในชุดข้อสอบนี้</p>
          </div>
          <button
            onClick={() => {
              setShowAddQuestion(true);
              setEditQuestionId(null);
            }}
            className="btn-premium"
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
              <p className="text-sm text-muted-foreground">ยังไม่มีคำถาม เพิ่มคำถามแรกเลย</p>
            </div>
          ) : (
            questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-xl border border-border/60 bg-card/50 p-4 transition-all hover:border-border/80 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-muted-foreground">ข้อ {i + 1}: </span>
                      {q.question_text}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(q.options).map(([key, val]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs ${
                            key === q.correct_option
                              ? "bg-chart-3/10 font-medium text-chart-3"
                              : "bg-muted text-muted-foreground"
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
                      <p className="mt-1.5 text-xs text-accent-foreground/70">
                        <span className="font-medium">เฉลย:</span> {q.explanation_text}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditQuestionId(q.id);
                        setShowAddQuestion(false);
                      }}
                      className="btn-ghost p-1.5"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <form action={deleteQuestion}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="examId" value={examId} />
                      <button
                        type="submit"
                        className="btn-ghost p-1.5 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          if (!confirm("ลบคำถามนี้?")) e.preventDefault();
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </form>
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
  const action = question ? updateQuestion : createQuestion;
  const qText = question?.question_text ?? "";
  const opt = question?.options ?? { A: "", B: "", C: "", D: "" };
  const correct = question?.correct_option ?? "A";
  const explanation = question?.explanation_text ?? "";

  return (
    <form
      action={action}
      className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5 space-y-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-accent/15">
          <Plus className="size-3.5 text-accent-foreground" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {question ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}
        </span>
      </div>

      <input type="hidden" name="examId" value={examId} />
      {question && <input type="hidden" name="id" value={question.id} />}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          คำถาม
        </label>
        <textarea
          name="questionText"
          rows={2}
          defaultValue={qText}
          required
          className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
              className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            เฉลย (คำตอบที่ถูก)
          </label>
          <select
            name="correctOption"
            defaultValue={correct}
            className="rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
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
            className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="btn-premium"
        >
          <Check className="size-4" />
          {question ? "บันทึก" : "เพิ่ม"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost"
        >
          <X className="size-4" />
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
