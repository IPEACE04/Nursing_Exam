"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  updateExam,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/actions/admin";

interface Question {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  explanation_text: string | null;
  sort_order: number;
}

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

  if (loading || !exam) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-[#1a2744] border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <button
        onClick={() => router.push("/admin/exams")}
        className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        กลับไปรายการข้อสอบ
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-[#1a2744]">
          แก้ไขชุดข้อสอบ
        </h2>
        <form action={updateExam} className="space-y-4">
          <input type="hidden" name="id" value={examId} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              ชื่อชุดข้อสอบ
            </label>
            <input
              name="title"
              type="text"
              defaultValue={exam.title}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              คำอธิบาย
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={exam.description ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              เวลาที่กำหนด (นาที)
            </label>
            <input
              name="timeLimit"
              type="number"
              defaultValue={exam.time_limit_minutes}
              min={1}
              required
              className="w-full max-w-32 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            บันทึก
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1a2744]">
            คำถามทั้งหมด ({questions.length} ข้อ)
          </h2>
          <button
            onClick={() => {
              setShowAddQuestion(true);
              setEditQuestionId(null);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Plus className="size-3.5" />
            เพิ่มคำถาม
          </button>
        </div>

        {(showAddQuestion || editQuestionId) && (
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
        )}

        <div className="mt-4 space-y-3">
          {questions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              ยังไม่มีคำถาม เพิ่มคำถามแรกเลย
            </p>
          ) : (
            questions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      <span className="text-slate-400">ข้อ {i + 1}: </span>
                      {q.question_text}
                    </p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(q.options).map(([key, val]) => (
                        <span
                          key={key}
                          className={`mr-2 inline-block rounded-md px-2 py-0.5 text-xs ${
                            key === q.correct_option
                              ? "bg-emerald-50 font-medium text-emerald-600"
                              : "bg-slate-50 text-slate-500"
                          }`}
                        >
                          {key}. {val as string}
                          {key === q.correct_option && " ✓"}
                        </span>
                      ))}
                    </div>
                    {q.explanation_text && (
                      <p className="mt-1 text-xs text-amber-600">
                        เฉลย: {q.explanation_text}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditQuestionId(q.id);
                        setShowAddQuestion(false);
                      }}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:bg-slate-50"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <form action={deleteQuestion}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="examId" value={examId} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 p-1.5 text-red-400 transition-colors hover:bg-red-50"
                        onClick={(e) => {
                          if (!confirm("ลบคำถามนี้?")) e.preventDefault();
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
      className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3"
    >
      <input type="hidden" name="examId" value={examId} />
      {question && <input type="hidden" name="id" value={question.id} />}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          คำถาม
        </label>
        <textarea
          name="questionText"
          rows={2}
          defaultValue={qText}
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {["A", "B", "C", "D"].map((key) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              ตัวเลือก {key}
            </label>
            <input
              name={`option${key}`}
              type="text"
              defaultValue={(opt as Record<string, string>)[key] ?? ""}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          เฉลย (คำตอบที่ถูก)
        </label>
        <select
          name="correctOption"
          defaultValue={correct}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          คำอธิบายเฉลย
        </label>
        <textarea
          name="explanation"
          rows={2}
          defaultValue={explanation}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700"
        >
          <Check className="size-3.5" />
          {question ? "บันทึก" : "เพิ่ม"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <X className="size-3.5" />
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
