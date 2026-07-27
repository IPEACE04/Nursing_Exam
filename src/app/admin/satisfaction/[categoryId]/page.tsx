"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  getAdminQuestions,
  getCategories,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/actions/satisfaction";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import type { SatisfactionQuestion, SatisfactionCategory } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = use(params);
  const router = useRouter();
  const { locale } = useLocale();

  const [questions, setQuestions] = useState<SatisfactionQuestion[]>([]);
  const [category, setCategory] = useState<SatisfactionCategory | null>(null);
  const [loading, setLoading] = useState(true);

  const [newQuestion, setNewQuestion] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function fetchData() {
    const [allQ, allC] = await Promise.all([
      getAdminQuestions(),
      getCategories(),
    ]);
    setCategory(allC.find((c) => c.id === categoryId) ?? null);
    setQuestions(allQ.filter((q) => q.category_id === categoryId));
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleAddQuestion() {
    if (!newQuestion.trim()) return;
    const formData = new FormData();
    formData.set("question_text", newQuestion);
    formData.set("category_id", categoryId);
    await addQuestion(formData);
    setNewQuestion("");
    fetchData();
  }

  async function handleUpdateQuestion(id: string) {
    if (!editText.trim()) return;
    const formData = new FormData();
    formData.set("question_text", editText);
    formData.set("category_id", categoryId);
    await updateQuestion(id, formData);
    setEditingId(null);
    fetchData();
  }

  async function handleToggleActive(q: SatisfactionQuestion) {
    const formData = new FormData();
    formData.set("question_text", q.question_text);
    formData.set("category_id", categoryId);
    formData.set("is_active", String(!q.is_active));
    await updateQuestion(q.id, formData);
    fetchData();
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm(t(locale, "admin.satisfaction.deleteQuestionConfirm"))) return;
    await deleteQuestion(id);
    fetchData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <button
          onClick={() => router.push("/admin/satisfaction")}
          className="mb-4 inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t(locale, "admin.satisfaction.categoryBack")}
        </button>
        <PageHeader
          badge={category?.name ?? t(locale, "admin.satisfaction.categoryFallback")}
          title={t(locale, "admin.satisfaction.manageQuestions")}
          description={t(locale, "admin.satisfaction.manageDesc")}
        />
      </div>

      {/* Add Question */}
      <GlassCard className="p-5 sm:p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t(locale, "admin.satisfaction.addInCategory", { name: category?.name ?? "" })}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
            placeholder={t(locale, "admin.satisfaction.questionPlaceholder")}
            className="h-12 flex-1 rounded-xl border border-border bg-background px-5 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <button
            onClick={handleAddQuestion}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <Plus className="size-4" />
            {t(locale, "admin.satisfaction.add")}
          </button>
        </div>
      </GlassCard>

      {/* Questions List */}
      {questions.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t(locale, "admin.satisfaction.noQuestions")}</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="divide-y divide-border/40">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-5">
                <span className="text-sm text-muted-foreground shrink-0 w-6">
                  {q.sort_order}.
                </span>

                {editingId === q.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateQuestion(q.id)}
                      className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      autoFocus
                    />
                    <button onClick={() => handleUpdateQuestion(q.id)} className="rounded-lg p-2 text-primary hover:bg-primary/5">
                      <Check className="size-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${!q.is_active && "line-through text-muted-foreground"}`}>
                      {q.question_text}
                    </span>

                    <button
                      onClick={() => handleToggleActive(q)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
                        q.is_active
                          ? "border-emerald-500/20 text-emerald-600"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {q.is_active ? t(locale, "admin.satisfaction.active") : t(locale, "admin.satisfaction.inactive")}
                    </button>

                    <button
                      onClick={() => {
                        setEditingId(q.id);
                        setEditText(q.question_text);
                      }}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
