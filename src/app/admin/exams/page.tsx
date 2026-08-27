"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  FileText,
  Pencil,
  Trash2,
  GraduationCap,
  Rocket,
} from "lucide-react";
import { togglePublish, deleteExam, createExam, getAdminExams } from "@/actions/admin";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

interface ExamWithCount {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  is_published: boolean;
  question_count: number;
  created_at: string;
}

export default function AdminExamsPage() {
  const { locale } = useLocale();
  const [exams, setExams] = useState<ExamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, startCreateTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const data = await getAdminExams();
      setExams(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleTogglePublish(id: string, current: boolean) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("is_published", String(current));
    await togglePublish(fd);
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_published: !current } : e))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm(t(locale, "admin.exams.deleteConfirm"))) return;
    const fd = new FormData();
    fd.set("id", id);
    await deleteExam(fd);
    setExams((prev) => prev.filter((e) => e.id !== id));
  }

  function handleCreateExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("timeLimit", formData.get("time_limit_minutes") as string);
    setCreateError("");

    startCreateTransition(async () => {
      const result = await createExam(formData);
      if ("error" in result) {
        setCreateError(result.error ?? "ไม่สามารถสร้างชุดข้อสอบได้ กรุณาลองใหม่");
        return;
      }

      setExams((previous) => [result.exam, ...previous]);
      form.reset();
      setShowCreate(false);
    });
  }

  if (loading) return <LoadingSpinner />;

  const filtered = exams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title={t(locale, "admin.exams.title")}
        description={t(locale, "admin.exams.desc")}
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <Plus className="size-4" />
            {t(locale, "admin.exams.create")}
          </button>
        }
      />

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6">
              <form
                onSubmit={handleCreateExam}
                className="space-y-5"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">{t(locale, "admin.exams.createTitle")}</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t(locale, "admin.exams.name")}</label>
                  <input
                    name="title"
                    required
                    placeholder={t(locale, "admin.exams.namePlaceholder")}
                    className="h-12 w-full rounded-xl border border-border bg-background px-5 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t(locale, "admin.exams.description")}</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder={t(locale, "admin.exams.descPlaceholder")}
                    className="w-full resize-none rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t(locale, "admin.exams.timeLimit")}</label>
                  <input
                    name="time_limit_minutes"
                    type="number"
                    defaultValue={60}
                    min={1}
                    className="h-12 w-32 rounded-xl border border-border bg-background px-5 text-base text-foreground transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
                  >
                    <Plus className="size-4" />
                    {isCreating ? t(locale, "common.saving") : t(locale, "admin.exams.createBtn")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:translate-y-px"
                  >
                    {t(locale, "common.cancel")}
                  </button>
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          placeholder={t(locale, "common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background px-5 pl-10 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* Exam list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <GlassCard className="py-12 text-center">
            <GraduationCap className="mx-auto mb-3 size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {search ? t(locale, "admin.exams.noResults") : t(locale, "admin.exams.noExams")}
            </p>
          </GlassCard>
        ) : (
          filtered.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassCard className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
                        {exam.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${
                          exam.is_published
                            ? "border-emerald-500/30 text-emerald-600"
                            : "border-amber-500/30 text-amber-600"
                        }`}
                      >
                        {exam.is_published ? t(locale, "admin.exams.published") : t(locale, "admin.exams.draft")}
                      </span>
                    </div>
                    {exam.description && (
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-1">
                        {exam.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3 sm:size-3.5" />
                        {exam.question_count} {t(locale, "exam.list.questions")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 sm:size-3.5" />
                        {exam.time_limit_minutes} {t(locale, "exam.list.minutes")}
                      </span>
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => handleTogglePublish(exam.id, exam.is_published)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold transition-all border ${
                          exam.is_published
                            ? "border-red-500/20 text-red-600 hover:bg-red-500/5"
                            : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        <Rocket className="size-3 sm:size-3.5" />
                        <span className="hidden sm:inline">{exam.is_published ? "Cancel Launch" : "Launch Exam"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <Link
                      href={`/admin/exams/${exam.id}`}
                      className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5 sm:size-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5 sm:size-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
