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
      className="space-y-6 sm:space-y-8 md:space-y-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground mb-1">
            {t(locale, "dashboard.greeting")} <span role="img" aria-label="wave">👋</span>
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {t(locale, "dashboard.title")}
          </h1>
        </div>
        <Link
          href="/exam"
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
        >
          {t(locale, "dashboard.startExam")} <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
        <StatCard
          icon={<Activity className="size-6" />}
          label={t(locale, "dashboard.examsDone")}
          value={totalExams}
          suffix={t(locale, "dashboard.times")}
          delay={0}
          accent="primary"
        />
        <StatCard
          icon={<Target className="size-6" />}
          label={t(locale, "dashboard.avgScore")}
          value={avgScore}
          suffix="%"
          delay={0.05}
          accent="emerald"
        />
        <StatCard
          icon={<Flame className="size-6" />}
          label={t(locale, "dashboard.bestScore")}
          value={maxScore}
          suffix="%"
          delay={0.1}
          accent="amber"
        />
        <StatCard
          icon={<BookOpen className="size-6" />}
          label={t(locale, "dashboard.remaining")}
          value={remainingCount}
          suffix={t(locale, "dashboard.sets")}
          delay={0.15}
          accent="primary"
        />
      </div>

      {/* Satisfaction Survey */}
      <div className="pb-4">
        <Link href="/satisfaction">
          <motion.div
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ClipboardCheck className="size-6 text-primary" />
                <div>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    {t(locale, "dashboard.satisfactionTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(locale, "dashboard.satisfactionDesc")}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 text-muted-foreground shrink-0" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-3">
        {/* Progress Card */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{t(locale, "dashboard.progress")}</h2>
            <span className="text-xs text-muted-foreground">{t(locale, "dashboard.last20")}</span>
          </div>
          
          {chartData.length > 1 ? (
            <ProgressChart data={chartData} />
          ) : (
             <div className="flex h-32 sm:h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">
                  {t(locale, "dashboard.noProgressData")}
                </p>
             </div>
          )}
        </div>

        {/* Ranking Card */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{t(locale, "dashboard.yourRank")}</h2>
            <Link href="/ranking" className="text-xs text-primary hover:underline font-medium">{t(locale, "common.viewAll")}</Link>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {userRank > 0 ? (
               <div className="text-center">
                 <span className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground font-heading">{userRank}</span>
                 <p className="text-sm text-muted-foreground mt-2">{t(locale, "dashboard.ofAllUsers")}</p>
               </div>
            ) : (
               <p className="text-sm text-muted-foreground text-center">
                 {t(locale, "dashboard.noRank")}
               </p>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t(locale, "dashboard.recentHistory")}</h2>
          <Link href="/history" className="text-xs text-primary hover:underline font-medium">{t(locale, "common.viewAll")}</Link>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {attempts.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-muted-foreground text-center">
                {t(locale, "dashboard.noHistory")}
              </p>
            </div>
          ) : (
            attempts.slice(0, 5).map((attempt) => (
              <Link
                key={attempt.id}
                href={`/exam/${attempt.exam_id}/result/${attempt.id}`}
                className="group flex items-center justify-between rounded-xl border border-transparent hover:border-border hover:bg-muted/30 px-4 py-3 transition-all duration-200"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`flex size-10 sm:size-11 items-center justify-center rounded-xl text-xs sm:text-sm font-bold shrink-0 border ${
                      attempt.percentage >= 80
                        ? "border-emerald-500/20 text-emerald-600"
                        : attempt.percentage >= 50
                          ? "border-amber-500/20 text-amber-600"
                          : "border-destructive/20 text-destructive"
                    }`}
                  >
                    {attempt.percentage}%
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-foreground truncate">
                      {attempt.exam_title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(attempt.completed_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground shrink-0">
                  <span className="font-medium">
                    {attempt.score}/{attempt.total_questions}
                  </span>
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
