"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, FileText, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { togglePublish, deleteExam, createExam } from "@/actions/admin";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<
    { id: string; title: string; description: string | null; time_limit_minutes: number; is_published: boolean; question_count: number; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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

  if (loading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">
            จัดการชุดข้อสอบ
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            สร้าง แก้ไข และจัดการชุดข้อสอบทั้งหมด
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="size-4" />
          สร้างข้อสอบ
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <h2 className="mb-4 text-base font-semibold text-[#1a2744]">
            สร้างชุดข้อสอบใหม่
          </h2>
          <form action={createExam} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                ชื่อชุดข้อสอบ
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
                placeholder="เช่น ข้อสอบวิชาการพยาบาลผู้ใหญ่ 1"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                คำอธิบาย
              </label>
              <textarea
                name="description"
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
                placeholder="รายละเอียดของชุดข้อสอบนี้"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                เวลาที่กำหนด (นาที)
              </label>
              <input
                name="timeLimit"
                type="number"
                defaultValue={60}
                min={1}
                required
                className="w-full max-w-32 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                สร้าง
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-3">
        {exams.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <FileText className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="text-sm text-slate-500">ยังไม่มีชุดข้อสอบ</p>
          </div>
        ) : (
          exams.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-all hover:shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {exam.title}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      exam.is_published
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
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
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
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

              <div className="flex items-center gap-2">
                <form action={togglePublish}>
                  <input type="hidden" name="id" value={exam.id} />
                  <input
                    type="hidden"
                    name="current"
                    value={String(exam.is_published)}
                  />
                  <button
                    type="submit"
                    className={`rounded-lg border p-2 text-xs transition-colors ${
                      exam.is_published
                        ? "border-slate-200 text-slate-400 hover:bg-slate-50"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    }`}
                    title={exam.is_published ? " unpublish" : "Publish"}
                  >
                    {exam.is_published ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </form>

                <a
                  href={`/admin/exams/${exam.id}`}
                  className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="size-4" />
                </a>

                <form action={deleteExam}>
                  <input type="hidden" name="id" value={exam.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-200 p-2 text-red-400 transition-colors hover:bg-red-50"
                    onClick={(e) => {
                      if (!confirm("ลบชุดข้อสอบนี้?  action นี้ไม่สามารถย้อนกลับได้"))
                        e.preventDefault();
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
