"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Clock, Target, ExternalLink, TrendingUp, ClipboardList } from "lucide-react";
import { getHistory } from "@/actions/exam";
import { useAuth } from "@/context/auth-context";
import type { AttemptWithExam } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

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
    const uid = user.id;

    async function fetchHistory() {
      const data = await getHistory(uid);

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

  const chartConfig = {
    คะแนน: { label: "คะแนน", color: "var(--chart-1)" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 sm:space-y-10"
    >
      <PageHeader
        badge="History"
        title="ประวัติการสอบ"
        description="ติดตามพัฒนาการและผลการสอบที่ผ่านมาทั้งหมด"
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-3">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-primary/8 border border-primary/15 shrink-0">
              <ClipboardList className="size-5 sm:size-6 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
                ข้อสอบทั้งหมด
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalExams}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-emerald-500/8 border border-emerald-500/15 shrink-0">
              <Target className="size-5 sm:size-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
                คะแนนเฉลี่ย
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{avgScore}%</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-amber-500/8 border border-amber-500/15 shrink-0">
              <BarChart3 className="size-5 sm:size-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
                คะแนนสูงสุด
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{bestScore}%</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {chartData.length > 1 && (
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 sm:mb-5 flex items-center gap-2.5">
            <TrendingUp className="size-5 sm:size-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">พัฒนาการคะแนน</h2>
          </div>
          <ChartContainer config={chartConfig} className="aspect-[2/1] sm:aspect-[3/1] w-full">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="คะแนน"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--chart-1)" }}
                activeDot={{ r: 5, fill: "var(--chart-2)" }}
              />
            </LineChart>
          </ChartContainer>
        </GlassCard>
      )}

      <div className="space-y-3 sm:space-y-4">
        {attempts.length === 0 ? (
          <GlassCard className="py-16 text-center">
            <ClipboardList className="mx-auto mb-4 size-14 text-muted-foreground/30" />
            <p className="text-base text-muted-foreground">ยังไม่มีประวัติการสอบ</p>
            <Link href="/exam" className="btn-premium mt-5 inline-flex">
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
                className="group flex items-center justify-between rounded-2xl border border-border/30 bg-card/50 px-5 py-4 sm:px-6 sm:py-5 backdrop-blur-xl shadow-clinic transition-all duration-200 hover:shadow-clinic-lg"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`flex size-11 sm:size-13 items-center justify-center rounded-xl border text-xs sm:text-sm font-bold transition-all duration-300 group-hover:scale-105 shrink-0 ${
                    attempt.percentage >= 80
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : attempt.percentage >= 50
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
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
