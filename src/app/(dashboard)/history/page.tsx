"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { BarChart3, Clock, Target, ExternalLink, TrendingUp, ClipboardList } from "lucide-react";
import { getHistory } from "@/actions/exam";
import { useAuth } from "@/context/auth-context";
import type { AttemptWithExam } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

const HistoryChart = dynamic(
  () => import("@/components/premium/history-chart").then((m) => ({ default: m.HistoryChart })),
  { ssr: false, loading: () => <div className="flex h-40 items-center justify-center"><span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div> }
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

interface ExamAttemptRow {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  total_questions: number;
  time_spent_seconds: number;
  completed_at: string;
  exams: { title: string } | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchHistory() {
      const data = await getHistory();

      if (data && data.length > 0) {
        setAttempts(
          (data as unknown as ExamAttemptRow[]).map((a) => ({
            id: a.id,
            user_id: a.user_id,
            exam_id: a.exam_id,
            score: a.score,
            total_questions: a.total_questions,
            time_spent_seconds: a.time_spent_seconds,
            completed_at: a.completed_at,
            exam_title: a.exams?.title ?? "",
            percentage:
              a.total_questions > 0
                ? Math.round((a.score / a.total_questions) * 100)
                : 0,
          }))
        );
      }
      setLoading(false);
    }

    fetchHistory();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const totalExams = attempts.length;
  const avgScore =
    totalExams > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.percentage, 0) / totalExams
        )
      : 0;
  const bestScore =
    totalExams > 0
      ? Math.max(...attempts.map((a) => a.percentage))
      : 0;

  const chartData = [...attempts].reverse().map((a, i) => ({
    index: i + 1,
    คะแนน: a.percentage,
    label: formatShortDate(a.completed_at),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 sm:space-y-10 md:space-y-12"
    >
      <PageHeader
        badge="History"
        title="ประวัติการสอบ"
        description="ติดตามพัฒนาการและผลการสอบที่ผ่านมาทั้งหมด"
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <ClipboardList className="size-6 text-primary shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                ข้อสอบทั้งหมด
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{totalExams}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <Target className="size-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                คะแนนเฉลี่ย
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{avgScore}%</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <BarChart3 className="size-6 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                คะแนนสูงสุด
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{bestScore}%</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {chartData.length > 1 && (
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 sm:mb-5 flex items-center gap-2.5">
            <TrendingUp className="size-5 sm:size-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">พัฒนาการคะแนน</h2>
          </div>
          <HistoryChart data={chartData} />
        </GlassCard>
      )}

      <div className="space-y-3 sm:space-y-4">
        {attempts.length === 0 ? (
          <GlassCard className="py-16 text-center">
            <ClipboardList className="mx-auto mb-4 size-14 text-muted-foreground/30" />
            <p className="text-base text-muted-foreground">ยังไม่มีประวัติการสอบ</p>
            <Link
              href="/exam"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-5"
            >
              เริ่มทำข้อสอบเลย
            </Link>
          </GlassCard>
        ) : (
          attempts.map((attempt, i) => {
            return (
              <Link
                key={attempt.id}
                href={`/exam/${attempt.exam_id}/result/${attempt.id}`}
              >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ x: 3 }}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 sm:px-6 sm:py-5 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`flex size-11 sm:size-12 items-center justify-center rounded-xl border text-xs sm:text-sm font-bold transition-all duration-300 group-hover:scale-105 shrink-0 ${
                    attempt.percentage >= 80
                      ? "border-emerald-500/20 text-emerald-600"
                      : attempt.percentage >= 50
                        ? "border-amber-500/20 text-amber-600"
                        : "border-destructive/20 text-destructive"
                  }`}>
                    {attempt.percentage}%
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-foreground truncate">
                      {attempt.exam_title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="size-4 text-muted-foreground shrink-0" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(attempt.completed_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm sm:text-base font-medium text-muted-foreground">
                    {attempt.score}/{attempt.total_questions}
                  </span>
                  <ExternalLink className="size-4 sm:size-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </motion.div>
              </Link>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
