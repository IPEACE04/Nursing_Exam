"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Clock, Target, ExternalLink } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
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

export default function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    async function fetchHistory() {
      const supabase = createSupabaseBrowserClient();

      const { data } = await supabase
        .from("exam_attempts")
        .select(`*, exams ( title )`)
        .eq("user_id", uid)
        .order("completed_at", { ascending: false });

      if (data) {
        setAttempts(
          data.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            user_id: a.user_id as string,
            exam_id: a.exam_id as string,
            score: a.score as number,
            total_questions: a.total_questions as number,
            time_spent_seconds: a.time_spent_seconds as number,
            completed_at: a.completed_at as string,
            exam_title: ((a.exams as { title: string })?.title ?? "") as string,
            percentage:
              (a.total_questions as number) > 0
                ? Math.round(
                    ((a.score as number) / (a.total_questions as number)) * 100
                  )
                : 0,
          }))
        );
      }
      setLoading(false);
    }

    fetchHistory();
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const chartData = [...attempts].reverse().map((a, i) => ({
    index: i + 1,
    คะแนน: a.percentage,
    date: formatShortDate(a.completed_at),
    title: a.exam_title,
  }));

  const chartConfig = {
    คะแนน: { label: "คะแนน", color: "var(--chart-1)" },
  };

  const avgScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length
        )
      : 0;

  const bestScore =
    attempts.length > 0
      ? Math.max(...attempts.map((a) => a.percentage))
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <PageHeader
        badge="Analytics"
        title="ประวัติผลสอบ"
        description="วิเคราะห์พัฒนาการและย้อนดูผลสอบที่ผ่านมา"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: BarChart3,
            label: "สอบทั้งหมด",
            value: `${attempts.length} ครั้ง`,
            bg: "bg-primary/8",
            color: "text-primary",
          },
          {
            icon: Target,
            label: "คะแนนเฉลี่ย",
            value: `${avgScore}%`,
            bg: "bg-chart-3/10",
            color: "text-chart-3",
          },
          {
            icon: Target,
            label: "คะแนนสูงสุด",
            value: `${bestScore}%`,
            bg: "bg-accent/15",
            color: "text-accent-foreground",
          },
        ].map((stat, i) => (
          <GlassCard key={stat.label} delay={i * 0.05} className="p-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-11 items-center justify-center rounded-xl ${stat.bg}`}
              >
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {chartData.length > 1 && (
        <GlassCard>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            กราฟพัฒนาการ
          </h2>
          <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="คะแนน"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--chart-1)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </GlassCard>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          รายการผลสอบทั้งหมด
        </h2>
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <GlassCard className="py-12 text-center">
              <BarChart3 className="mx-auto mb-3 size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                ยังไม่มีประวัติการสอบ
              </p>
              <Link href="/exam" className="btn-premium mt-4 inline-flex">
                เริ่มทำข้อสอบเลย
              </Link>
            </GlassCard>
          ) : (
            attempts.map((attempt, i) => (
              <Link
                key={attempt.id}
                href={`/exam/${attempt.exam_id}/result/${attempt.id}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ x: 3 }}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-5 py-4 backdrop-blur-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl text-xs font-bold ${
                        attempt.percentage >= 80
                          ? "bg-chart-3/10 text-chart-3"
                          : attempt.percentage >= 50
                            ? "bg-accent/15 text-accent-foreground"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {attempt.percentage}%
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {attempt.exam_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(attempt.completed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                      <Clock className="size-3.5" />
                      {Math.floor(attempt.time_spent_seconds / 60)}น.
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {attempt.score}/{attempt.total_questions}
                    </span>
                    <ExternalLink className="size-4 text-primary" />
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
