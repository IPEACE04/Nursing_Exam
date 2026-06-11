"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, FileText, Play, BookOpen } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { ExamWithQuestionCount } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function ExamListPage() {
  const [exams, setExams] = useState<ExamWithQuestionCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExams() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("exams")
        .select(`*, questions ( id )`)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (data) {
        setExams(
          data
            .filter((e) => {
              const qs = e.questions as unknown as { id: string }[] | null;
              return (qs?.length ?? 0) > 0;
            })
            .map((e) => ({
              ...e,
              question_count: (e.questions as unknown as { id: string }[])
                .length,
            }))
        );
      }
      setLoading(false);
    }

    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 px-5 py-6 sm:py-8 sm:px-6">
      <PageHeader
        badge="Exam Library"
        title="คลังข้อสอบ"
        description="เลือกชุดข้อสอบที่ต้องการฝึกทำ — ระบบจับเวลาและเฉลยละเอียดทันทีหลังส่ง"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {exams.length === 0 ? (
          <GlassCard className="py-20 text-center">
            <BookOpen className="mx-auto mb-4 size-16 text-muted-foreground/30" />
            <p className="text-base text-muted-foreground">
              ยังไม่มีชุดข้อสอบในขณะนี้
            </p>
          </GlassCard>
        ) : (
          exams.map((exam) => (
            <motion.div
              key={exam.id}
              variants={itemAnim}
              className="group"
            >
              <GlassCard
                hover
                className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-1">
                    {exam.title}
                  </h3>
                  {exam.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm sm:text-base text-muted-foreground">
                      {exam.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText className="size-4" />
                      {exam.question_count} ข้อ
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4" />
                      {exam.time_limit_minutes} นาที
                    </span>
                  </div>
                </div>
                <Link
                  href={`/exam/${exam.id}`}
                  className="btn-premium shrink-0"
                >
                  <Play className="size-5" />
                  เริ่มสอบ
                </Link>
              </GlassCard>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
