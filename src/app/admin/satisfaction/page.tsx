"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, BarChart3, Layers, Pencil, X, Check, ArrowRight } from "lucide-react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/satisfaction";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import type { SatisfactionCategory } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

export default function AdminSatisfactionPage() {
  const { locale } = useLocale();
  const [categories, setCategories] = useState<SatisfactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  async function fetchData() {
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => { if (!cancelled) setCategories(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    const formData = new FormData();
    formData.set("name", newCatName);
    await addCategory(formData);
    setNewCatName("");
    fetchData();
  }

  async function handleUpdateCategory(id: string) {
    if (!editCatName.trim()) return;
    const formData = new FormData();
    formData.set("name", editCatName);
    await updateCategory(id, formData);
    setEditingCatId(null);
    fetchData();
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm(t(locale, "admin.satisfaction.deleteCategoryConfirm"))) return;
    await deleteCategory(id);
    fetchData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        badge="Admin"
        title={t(locale, "admin.satisfaction.title")}
        description={t(locale, "admin.satisfaction.desc")}
        action={
          <Link
            href="/admin/satisfaction/analysis"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <BarChart3 className="size-4" />
            {t(locale, "admin.satisfaction.viewAnalysis")}
          </Link>
        }
      />

      {/* Add Category */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder={t(locale, "admin.satisfaction.newCategoryPlaceholder")}
            className="h-12 flex-1 rounded-xl border border-border bg-background px-5 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <button
            onClick={handleAddCategory}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <Plus className="size-4" />
            {t(locale, "admin.satisfaction.addCategory")}
          </button>
        </div>
      </GlassCard>

      {/* Category List */}
      {categories.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Layers className="mx-auto mb-3 size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t(locale, "admin.satisfaction.noCategories")}</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <GlassCard key={cat.id} className="p-4 sm:p-5 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted shrink-0">
                    <Layers className="size-4 text-primary" />
                  </div>

                  {editingCatId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateCategory(cat.id)}
                        className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateCategory(cat.id)} className="rounded-lg p-2 text-primary hover:bg-primary/5">
                        <Check className="size-4" />
                      </button>
                      <button onClick={() => setEditingCatId(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-base font-semibold text-foreground truncate">{cat.name}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-end sm:self-auto">
                  {editingCatId !== cat.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditCatName(cat.name);
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
                  <Link
                    href={`/admin/satisfaction/${cat.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px shrink-0"
                  >
                    {t(locale, "admin.satisfaction.manage")}
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
