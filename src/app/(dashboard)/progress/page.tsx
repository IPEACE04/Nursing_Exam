"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Award,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getProgressComparison, getPrePostTestHistory } from "@/actions/exam";
import type { ProgressComparison } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

const PrePostChart = dynamic(
  () => import("@/components/premium/progress-chart").then((m) => ({ default: m.ProgressChart })),
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

export default function ProgressPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { locale } = useLocale();
  const [data, setData] = useState<ProgressComparison | null>(null);
  const [history, setHistory] = useState<{ score: number; total: number; percentage: number; completed_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getProgressComparison(),
      getPrePostTestHistory(),
    ]).then(([d, h]) => {
      setData(d);
      setHistory(h);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const chartData = history.map((a, i) => ({
    index: i + 1,
    ["คะแนน"]: a.percentage,
    label: t(locale, "progress.attemptN", { n: i + 1 }),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6 sm:space-y-8 md:space-y-10"
    >
      <PageHeader
        badge="Progress"
        title={t(locale, "progress.title")}
        description={t(locale, "progress.desc")}
      />

      {!data.hasCompletedPreTest ? (
        <GlassCard className="p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-border/60 bg-muted">
            <Target className="size-8 text-muted-foreground" />
          </div>
          <p className="text-base text-muted-foreground">
            {t(locale, "progress.noData")}
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <GlassCard className="p-5 sm:p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-border/60 bg-muted">
                <Target className="size-6 text-chart-2" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                PreTest
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading">
                {data.preTest?.percentage ?? 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {data.preTest?.score ?? 0}/{data.preTest?.total ?? 0} {t(locale, "progress.questions")}
                {data.preTest && (
                  <span className="block text-xs text-muted-foreground/60">
                    {formatDate(data.preTest.completed_at)}
                  </span>
                )}
              </p>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-border/60 bg-muted">
                <Award className="size-6 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                PostTest
              </p>
              {data.hasCompletedPostTest && data.postTest ? (
                <>
                  <p className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading">
                    {data.postTest.percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.postTest.score}/{data.postTest.total} {t(locale, "progress.questions")}
                    <span className="block text-xs text-muted-foreground/60">
                      {formatDate(data.postTest.completed_at)}
                    </span>
                  </p>
                </>
              ) : (
                <div className="mt-2">
                  <Lock className="mx-auto size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mt-1">{t(locale, "progress.notTaken")}</p>
                  {!data.hasCompletedAllNormalExams && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(locale, "progress.completeAllFirst")}
                    </p>
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          {chartData.length > 1 && (
            <GlassCard className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <TrendingUp className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{t(locale, "progress.chart")}</h2>
              </div>
              <PrePostChart data={chartData} />
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-sm text-muted-foreground">
                {history.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: i === 0 ? "oklch(0.55 0.10 200)" : i === history.length - 1 ? "oklch(0.52 0.09 235)" : "oklch(0.60 0.10 85)" }}
                    />
                    <span>{t(locale, "progress.attemptN", { n: i + 1 })}</span>
                    <span className="font-medium text-foreground">{a.percentage}%</span>
                    <span className="text-xs">({formatShortDate(a.completed_at)})</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {data.hasCompletedPostTest && data.preTest && data.postTest && (
            <GlassCard className="p-5 sm:p-6 text-center">
              <div className="mx-auto mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/5">
                <TrendingUp className="size-7 sm:size-8 text-emerald-600" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t(locale, "progress.diff")}
              </p>
              <p className={`mt-2 text-4xl sm:text-5xl font-bold tracking-tight font-heading ${data.improvement >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {data.improvement > 0 ? "+" : ""}{data.improvement}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {data.improvement > 0
                  ? t(locale, "progress.improved", { n: data.postTest.score - data.preTest.score })
                  : data.improvement === 0
                    ? t(locale, "progress.same")
                    : t(locale, "progress.worse")}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <span>
                  PreTest: {data.preTest.score}/{data.preTest.total} ({data.preTest.percentage}%)
                </span>
                <ArrowRight className="size-4" />
                <span>
                  PostTest: {data.postTest.score}/{data.postTest.total} ({data.postTest.percentage}%)
                </span>
              </div>
            </GlassCard>
          )}

          {!data.hasCompletedAllNormalExams && data.remainingExams.length > 0 && (
            <GlassCard className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="size-5 text-amber-500 shrink-0" />
                <div>
                  <h2 className="font-semibold text-foreground">{t(locale, "progress.locked")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t(locale, "progress.lockedDesc")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {data.remainingExams.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                  >
                    <span className="text-sm text-foreground line-clamp-1">{e.title}</span>
                    <button
                      onClick={() => router.push(`/exam/${e.id}`)}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                    >
                      {t(locale, "progress.goDo")} <ArrowRight className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {data.hasCompletedAllNormalExams && !data.hasCompletedPostTest && (
            <GlassCard className="p-5 sm:p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle2 className="size-6 text-emerald-600" />
              </div>
              <p className="text-base font-medium text-foreground">
                {t(locale, "progress.unlocked")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t(locale, "progress.unlockedDesc")}
              </p>
              <button
                onClick={() => router.push("/exam")}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px mt-4"
              >
                <ArrowRight className="size-4" />
                {t(locale, "progress.goToExam")}
              </button>
            </GlassCard>
          )}
        </>
      )}
    </motion.div>
  );
}
