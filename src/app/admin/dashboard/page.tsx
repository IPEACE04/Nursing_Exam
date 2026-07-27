"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ClipboardList, BarChart3, AlertTriangle, BookOpen } from "lucide-react";
import { getAdminStats } from "@/actions/admin";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
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
  const { locale } = useLocale();
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
      const data = await getAdminStats();
      setStats({
        totalUsers: data.totalUsers,
        totalAttempts: data.totalAttempts,
        avgScore: data.avgScore,
        totalExams: data.totalExams,
      });
      setItemAnalysis(data.itemAnalysis);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const chartConfig = {
    errorRate: { label: t(locale, "admin.dashboard.worstRate"), color: "var(--chart-5)" },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 sm:space-y-8 md:space-y-10"
    >
      <PageHeader
        title="Admin Dashboard"
        description={t(locale, "admin.dashboard.title")}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Users className="size-6 text-primary shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t(locale, "admin.dashboard.totalUsers")}
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stats.totalUsers}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <ClipboardList className="size-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t(locale, "admin.dashboard.examsTaken")}
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stats.totalAttempts}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <BarChart3 className="size-6 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t(locale, "admin.dashboard.avgScore")}
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stats.avgScore}%</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <BookOpen className="size-6 text-purple-500 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t(locale, "admin.dashboard.examSets")}
              </p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stats.totalExams}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <motion.div variants={itemAnim}>
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 sm:mb-5 flex items-center gap-3">
            <AlertTriangle className="size-5 sm:size-6 text-destructive shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              {t(locale, "admin.dashboard.worstQuestions")}
            </h2>
          </div>

          {itemAnalysis.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t(locale, "admin.dashboard.noAttemptData")}
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
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  strokeWidth={0.5}
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
