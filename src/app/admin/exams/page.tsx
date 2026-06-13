"use client";

import { useEffect, useState } from "react";
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
  const [exams, setExams] = useState<ExamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

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
    if (!confirm("ลบชุดข้อสอบนี้? (การกระทำนี้ไม่สามารถย้อนกลับได้)")) return;
    const fd = new FormData();
    fd.set("id", id);
    await deleteExam(fd);
    setExams((prev) => prev.filter((e) => e.id !== id));
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
        title="จัดการข้อสอบ"
        description="สร้าง แก้ไข และจัดการชุดข้อสอบทั้งหมด"
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <Plus className="size-4" />
            สร้างข้อสอบ
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("timeLimit", fd.get("time_limit_minutes") as string);
                  await createExam(fd);
                  setShowCreate(false);
                  window.location.reload();
                }}
                className="space-y-5"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">สร้างชุดข้อสอบใหม่</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">ชื่อข้อสอบ</label>
                  <input
                    name="title"
                    required
                    placeholder="เช่น ข้อสอบการพยาบาลผู้ใหญ่ 1"
                    className="h-12 w-full rounded-xl border border-border bg-background px-5 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">คำอธิบาย</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="คำอธิบายเกี่ยวกับชุดข้อสอบนี้"
                    className="w-full resize-none rounded-xl border border-border bg-background px-5 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">เวลา (นาที)</label>
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
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
                  >
                    <Plus className="size-4" />
                    สร้าง
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:translate-y-px"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          placeholder="ค้นหาชื่อข้อสอบ..."
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
              {search ? "ไม่พบชุดข้อสอบที่ค้นหา" : "ยังไม่มีชุดข้อสอบ"}
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
              <GlassCard className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold tracking-tight text-foreground truncate">
                        {exam.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          exam.is_published
                            ? "border-emerald-500/30 text-emerald-600"
                            : "border-amber-500/30 text-amber-600"
                        }`}
                      >
                        {exam.is_published ? "เผยแพร่" : "ร่าง"}
                      </span>
                    </div>
                    {exam.description && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-1">
                        {exam.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3.5" />
                        {exam.question_count} ข้อ
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {exam.time_limit_minutes} นาที
                      </span>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => handleTogglePublish(exam.id, exam.is_published)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${
                          exam.is_published
                            ? "border-red-500/20 text-red-600 hover:bg-red-500/5"
                            : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {exam.is_published ? (
                          <>
                            <Rocket className="size-3.5" />
                            Cancel Launch
                          </>
                        ) : (
                          <>
                            <Rocket className="size-3.5" />
                            Launch Exam
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/admin/exams/${exam.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
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
