"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ClipboardList, BarChart3, AlertTriangle, BookOpen, Shield } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttempts: 0,
    avgScore: 0,
    totalExams: 0,
  });
  const [itemAnalysis, setItemAnalysis] = useState<
    { question: string; errorRate: number; total: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createSupabaseBrowserClient();

      const [{ count: totalUsers }, { count: totalAttempts }, { count: totalExams }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("exam_attempts").select("*", { count: "exact", head: true }),
          supabase.from("exams").select("*", { count: "exact", head: true }),
        ]);

      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("score, total_questions");

      let avgScore = 0;
      if (attempts && attempts.length > 0) {
        const totalPct = attempts.reduce(
          (sum, a) =>
            sum +
            (a.total_questions > 0
              ? (a.score / a.total_questions) * 100
              : 0),
          0
        );
        avgScore = Math.round(totalPct / attempts.length);
      }

      setStats({
        totalUsers: totalUsers ?? 0,
        totalAttempts: totalAttempts ?? 0,
        avgScore,
        totalExams: totalExams ?? 0,
      });

      const { data: wrongAnswers } = await supabase
        .from("user_answers")
        .select("is_correct, questions!inner ( question_text )");

      if (wrongAnswers) {
        const grouped: Record<
          string,
          { question_text: string; wrong: number; total: number }
        > = {};
        wrongAnswers.forEach((a) => {
          const q = a.questions as unknown as { question_text: string };
          const text = q?.question_text ?? "Unknown";
          if (!grouped[text]) {
            grouped[text] = { question_text: text, wrong: 0, total: 0 };
          }
          grouped[text].total++;
          if (!a.is_correct) grouped[text].wrong++;
        });

        const sorted = Object.values(grouped)
          .map((g) => ({
            question: g.question_text.length > 40
              ? g.question_text.slice(0, 40) + "..."
              : g.question_text,
            errorRate: Math.round((g.wrong / g.total) * 100),
            total: g.total,
          }))
          .sort((a, b) => b.errorRate - a.errorRate)
          .slice(0, 10);

        setItemAnalysis(sorted);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const chartConfig = {
    errorRate: { label: "อัตราผิด (%)", color: "var(--chart-5)" },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Admin Dashboard"
        description="ภาพรวมระบบและสถิติการใช้งานทั้งหมด"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-primary/8 border border-primary/15">
              <Users className="size-5 sm:size-6 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
                ผู้ใช้ทั้งหมด
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <ClipboardList className="size-5 sm:size-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
                ข้อสอบที่ทำ
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {stats.totalAttempts}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-amber-500/8 border border-amber-500/15">
              <BarChart3 className="size-5 sm:size-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
                คะแนนเฉลี่ย
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {stats.avgScore}%
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-purple-500/8 border border-purple-500/15">
              <BookOpen className="size-5 sm:size-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
                ชุดข้อสอบ
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {stats.totalExams}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <motion.div variants={itemAnim}>
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 sm:mb-5 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              ข้อสอบที่ทำผิดมากที่สุด
            </h2>
          </div>

          {itemAnalysis.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลการตอบข้อสอบ
            </p>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-[2/1] w-full max-h-80"
            >
              <BarChart
                data={itemAnalysis}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="question"
                  width={200}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="errorRate"
                  fill="var(--chart-5)"
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                />
              </BarChart>
            </ChartContainer>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
