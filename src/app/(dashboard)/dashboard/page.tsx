"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Activity,
  Target,
  Flame,
  BookOpen,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getDashboardData, getPrePostTestGate } from "@/actions/exam";
import type { AttemptWithExam } from "@/types";
import { StatCard } from "@/components/premium/stat-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

const ProgressChart = dynamic(
  () => import("@/components/premium/progress-chart").then((m) => ({ default: m.ProgressChart })),
  { ssr: false, loading: () => <div className="flex h-40 items-center justify-center"><span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div> }
);

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { locale } = useLocale();
  const [attempts, setAttempts] = useState<AttemptWithExam[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const [data, gate] = await Promise.all([
          getDashboardData(),
          getPrePostTestGate(),
        ]);
        const attemptsData = data.attempts as unknown as ExamAttemptRow[];
        if (attemptsData.length > 0) {
          const mapped = attemptsData.map((a) => ({
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
          }));
          setAttempts(mapped);
        }
        setUserRank(data.rank as number);
        setRemainingCount(gate.remainingExams.length);
      } catch {
        setAttempts([]);
        setUserRank(0);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [user]);

  if (isLoading || loadingData) {
    return <LoadingSpinner />;
  }

  const totalExams = attempts.length;
  const avgScore =
    totalExams > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.percentage, 0) / totalExams
        )
      : 0;
  const maxScore =
    attempts.length > 0
      ? Math.max(...attempts.map((a) => a.percentage))
      : 0;

  const chartData = [...attempts].reverse().map((a, i) => ({
    index: i + 1,
    คะแนน: a.percentage,
    label:
      a.exam_title.slice(0, 10) + (a.exam_title.length > 10 ? ".." : ""),
  }));

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5 sm:space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
          {t(locale, "dashboard.title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t(locale, "dashboard.greeting")}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="learning-panel flex min-w-0 items-center justify-between gap-5 bg-secondary p-5 sm:p-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">{t(locale, "dashboard.practiceTitle")}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t(locale, "dashboard.practiceDesc")}</p>
            <Link href="/exam" className="mt-4 inline-flex h-11 items-center gap-3 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              {t(locale, "dashboard.startExam")} <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="learning-panel flex flex-col justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">{t(locale, "dashboard.yourRank")}</h2>
            <Link href="/ranking" className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-primary hover:underline">
              {t(locale, "common.viewAll")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {userRank > 0 ? (
            <div className="flex items-end gap-3">
              <span className="font-heading text-5xl font-semibold leading-none tracking-tight text-primary tabular-nums">{userRank}</span>
              <p className="pb-1 text-xs leading-relaxed text-muted-foreground">{t(locale, "dashboard.ofAllUsers")}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t(locale, "dashboard.noRank")}</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard compact icon={<Activity className="size-6" />} label={t(locale, "dashboard.examsDone")} value={totalExams} suffix={t(locale, "dashboard.times")} delay={0} accent="primary" />
        <StatCard compact icon={<Target className="size-6" />} label={t(locale, "dashboard.avgScore")} value={avgScore} suffix="%" delay={0.05} accent="emerald" />
        <StatCard compact icon={<Flame className="size-6" />} label={t(locale, "dashboard.bestScore")} value={maxScore} suffix="%" delay={0.1} accent="amber" />
        <StatCard compact icon={<BookOpen className="size-6" />} label={t(locale, "dashboard.remaining")} value={remainingCount} suffix={t(locale, "dashboard.sets")} delay={0.15} accent="primary" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="learning-panel min-w-0 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">{t(locale, "dashboard.progress")}</h2>
            <span className="text-xs text-muted-foreground">{t(locale, "dashboard.last20")}</span>
          </div>
          {chartData.length > 1 ? (
            <ProgressChart data={chartData} />
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl bg-secondary/60 px-5 py-6 text-center">
              <Activity className="size-7 text-primary" />
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t(locale, "dashboard.noProgressData")}</p>
              <Link href="/exam" className="inline-flex min-h-8 items-center gap-2 text-sm font-medium text-primary hover:underline">
                {t(locale, "dashboard.startExam")} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </section>

        <section className="learning-panel min-w-0 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{t(locale, "dashboard.recentHistory")}</h2>
            <Link href="/history" className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-primary hover:underline">
              {t(locale, "common.viewAll")} <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {attempts.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl bg-secondary/60 px-5 py-6 text-center">
              <BookOpen className="size-7 text-primary" />
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t(locale, "dashboard.noHistory")}</p>
              <Link href="/exam" className="inline-flex min-h-8 items-center gap-2 text-sm font-medium text-primary hover:underline">
                {t(locale, "dashboard.startExam")} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {attempts.slice(0, 5).map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/exam/${attempt.exam_id}/result/${attempt.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-secondary"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold tabular-nums ${
                      attempt.percentage >= 80
                        ? "border-emerald-500/20 text-emerald-600"
                        : attempt.percentage >= 50
                          ? "border-amber-500/20 text-amber-600"
                          : "border-destructive/20 text-destructive"
                    }`}>
                      {attempt.percentage}%
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{attempt.exam_title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(attempt.completed_at)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium tabular-nums">{attempt.score}/{attempt.total_questions}</span>
                    <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <Link href="/satisfaction" className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors duration-150 hover:bg-secondary sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <ClipboardCheck className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t(locale, "dashboard.satisfactionTitle")}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(locale, "dashboard.satisfactionDesc")}</p>
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
