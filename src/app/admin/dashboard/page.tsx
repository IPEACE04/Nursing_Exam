"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ClipboardList, BarChart3, AlertTriangle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalAttempts } = await supabase
        .from("exam_attempts")
        .select("*", { count: "exact", head: true });

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

      const { count: totalExams } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true });

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-[#1a2744] border-t-transparent" />
      </div>
    );
  }

  const chartConfig = {
    errorRate: { label: "อัตราผิด", color: "var(--chart-5)" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold text-[#1a2744]">
          แดชบอร์ดผู้ดูแลระบบ
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ภาพรวมระบบและสถิติการใช้งาน
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50">
              <Users className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                ผู้ใช้ทั้งหมด
              </p>
              <p className="text-2xl font-semibold text-[#1a2744]">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
              <ClipboardList className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                ข้อสอบที่ทำ
              </p>
              <p className="text-2xl font-semibold text-[#1a2744]">
                {stats.totalAttempts}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50">
              <BarChart3 className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                คะแนนเฉลี่ย
              </p>
              <p className="text-2xl font-semibold text-[#1a2744]">
                {stats.avgScore}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50">
              <ClipboardList className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                ชุดข้อสอบ
              </p>
              <p className="text-2xl font-semibold text-[#1a2744]">
                {stats.totalExams}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="size-5 text-red-500" />
          <h2 className="text-base font-semibold text-[#1a2744]">
            ข้อสอบที่ทำผิดมากที่สุด (Item Analysis)
          </h2>
        </div>

        {itemAnalysis.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
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
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ChartContainer>
        )}
      </motion.div>
    </motion.div>
  );
}
