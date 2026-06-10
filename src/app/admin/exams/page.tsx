"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Clock, FileText, Eye, EyeOff, Pencil, Trash2, GraduationCap, Search } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { togglePublish, deleteExam, createExam } from "@/actions/admin";
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

export default function AdminExamsPage() {
  const [exams, setExams] = useState<
    { id: string; title: string; description: string | null; time_limit_minutes: number; is_published: boolean; question_count: number; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("exams")
        .select("*, questions ( id )")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (data) {
        setExams(
          data.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            title: e.title as string,
            description: e.description as string | null,
            time_limit_minutes: e.time_limit_minutes as number,
            is_published: e.is_published as boolean,
            question_count: ((e.questions as { id: string }[]) || []).length,
            created_at: e.created_at as string,
          }))
        );
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <PageHeader
        badge="Admin"
        title="จัดการชุดข้อสอบ"
        description="สร้าง แก้ไข และจัดการชุดข้อสอบทั้งหมด"
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-premium"
          >
            <Plus className="size-4" />
            สร้างข้อสอบ
          </button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="ค้นหาชุดข้อสอบ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card/80 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 backdrop-blur-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard>
            <h2 className="mb-4 text-base font-semibold text-foreground">
              สร้างชุดข้อสอบใหม่
            </h2>
            <form action={createExam} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  ชื่อชุดข้อสอบ
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="เช่น ข้อสอบวิชาการพยาบาลผู้ใหญ่ 1"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  คำอธิบาย
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="รายละเอียดของชุดข้อสอบนี้"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  เวลาที่กำหนด (นาที)
                </label>
                <input
                  name="timeLimit"
                  type="number"
                  defaultValue={60}
                  min={1}
                  required
                  className="w-full max-w-32 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-premium"
                >
                  สร้าง
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-ghost"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <GlassCard className="py-16 text-center">
            <GraduationCap className="mx-auto mb-4 size-14 text-muted-foreground/30" />
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
              <GlassCard hover className="flex items-center justify-between px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {exam.title}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        exam.is_published
                          ? "bg-chart-3/10 text-chart-3"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {exam.is_published ? (
                        <Eye className="size-3" />
                      ) : (
                        <EyeOff className="size-3" />
                      )}
                      {exam.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="size-3.5" />
                      {exam.question_count} ข้อ
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {exam.time_limit_minutes} นาที
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <form action={togglePublish}>
                    <input type="hidden" name="id" value={exam.id} />
                    <input
                      type="hidden"
                      name="current"
                      value={String(exam.is_published)}
                    />
                    <button
                      type="submit"
                      className={`btn-ghost p-2 ${
                        exam.is_published
                          ? "text-muted-foreground"
                          : "text-chart-3"
                      }`}
                      title={exam.is_published ? "Unpublish" : "Publish"}
                    >
                      {exam.is_published ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </form>

                  <Link
                    href={`/admin/exams/${exam.id}`}
                    className="btn-ghost p-2"
                  >
                    <Pencil className="size-4" />
                  </Link>

                  <form action={deleteExam}>
                    <input type="hidden" name="id" value={exam.id} />
                    <button
                      type="submit"
                      className="btn-ghost p-2 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        if (!confirm("ลบชุดข้อสอบนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"))
                          e.preventDefault();
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
