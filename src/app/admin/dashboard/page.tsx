"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ClipboardList, BarChart3, AlertTriangle, BookOpen } from "lucide-react";
import { getAdminStats } from "@/actions/admin";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";
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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 sm:space-y-8 md:space-y-10"
    >
      <PageHeader
        title={t(locale, "admin.nav.dashboard")}
        description={t(locale, "admin.dashboard.title")}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4">
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
          <div className="flex flex-col items-start gap-4">
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
          <div className="flex flex-col items-start gap-4">
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
          <div className="flex flex-col items-start gap-4">
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
            <ol className="divide-y divide-border">
              {itemAnalysis.map((item, index) => {
                const errorRate = Math.min(100, Math.max(0, Math.round(item.errorRate)));

                return (
                  <li key={`${item.question}-${index}`} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-semibold text-destructive">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p title={item.question} className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
                            {item.question}
                          </p>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                            {errorRate}%
                          </span>
                        </div>
                        <div
                          className="mt-2 h-2 overflow-hidden rounded-full bg-border"
                          role="progressbar"
                          aria-label={t(locale, "admin.dashboard.worstRate")}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={errorRate}
                        >
                          <div className="h-full rounded-full bg-[var(--chart-5)] transition-[width] duration-300" style={{ width: `${errorRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
