"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Trash2, BarChart3 } from "lucide-react";
import { getAdminQuestions, addQuestion, deleteQuestion, updateQuestion } from "@/actions/satisfaction";
import type { SatisfactionQuestion } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

export default function AdminSatisfactionPage() {
  const [questions, setQuestions] = useState<SatisfactionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function fetchData() {
    const data = await getAdminQuestions();
    setQuestions(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleAdd() {
    if (!newQuestion.trim()) return;
    const formData = new FormData();
    formData.set("question_text", newQuestion);
    await addQuestion(formData);
    setNewQuestion("");
    fetchData();
  }

  async function handleUpdate(id: string) {
    if (!editText.trim()) return;
    const formData = new FormData();
    formData.set("question_text", editText);
    await updateQuestion(id, formData);
    setEditingId(null);
    fetchData();
  }

  async function handleToggleActive(q: SatisfactionQuestion) {
    const formData = new FormData();
    formData.set("question_text", q.question_text);
    formData.set("is_active", String(!q.is_active));
    await updateQuestion(q.id, formData);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบคำถามนี้?")) return;
    await deleteQuestion(id);
    fetchData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        badge="Admin"
        title="จัดการแบบประเมิน"
        description="เพิ่ม แก้ไข เปิด/ปิด หรือลบคำถามในแบบประเมินความพึงพอใจ"
        action={
          <Link href="/admin/satisfaction/analysis" className="btn-premium">
            <BarChart3 className="size-4" />
            ดูผลวิเคราะห์
          </Link>
        }
      />

      {/* Add Question */}
      <GlassCard className="p-5 sm:p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          เพิ่มคำถามใหม่
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="พิมพ์คำถาม..."
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button onClick={handleAdd} className="btn-premium">
            <Plus className="size-4" />
            เพิ่ม
          </button>
        </div>
      </GlassCard>

      {/* Questions List */}
      {questions.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">ยังไม่มีคำถาม</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <GlassCard key={q.id} className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground shrink-0 w-6">
                  {q.sort_order}.
                </span>

                {editingId === q.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(q.id)}
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
                      autoFocus
                    />
                    <button onClick={() => handleUpdate(q.id)} className="btn-premium text-xs px-3 py-1.5">
                      บันทึก
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-3 py-1.5">
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${!q.is_active && "line-through text-muted-foreground"}`}>
                      {q.question_text}
                    </span>

                    <button
                      onClick={() => handleToggleActive(q)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        q.is_active
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {q.is_active ? "เปิด" : "ปิด"}
                    </button>

                    <button
                      onClick={() => {
                        setEditingId(q.id);
                        setEditText(q.question_text);
                      }}
                      className="text-xs btn-ghost px-3 py-1.5"
                    >
                      แก้ไข
                    </button>

                    <button
                      onClick={() => handleDelete(q.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
