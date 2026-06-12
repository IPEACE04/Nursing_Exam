"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Target,
  Flame,
  TrendingUp,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { AttemptWithExam, ExamWithQuestionCount } from "@/types";
import { StatCard } from "@/components/premium/stat-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

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

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithExam[]>([]);
  const [recommendedExams, setRecommendedExams] = useState<
    ExamWithQuestionCount[]
  >([]);
  const [userRank, setUserRank] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    async function fetchData() {
      const supabase = createSupabaseBrowserClient();

      const [attemptsRes, examsRes, rankRes] = await Promise.all([
        supabase
          .from("exam_attempts")
          .select(`*, exams ( title )`)
          .eq("user_id", uid)
          .order("completed_at", { ascending: false }),
        supabase
          .from("exams")
          .select(`*, questions ( id )`)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.rpc("get_user_rank", { target_user_id: uid }),
      ]);

      if (attemptsRes.data) {
        setAttempts(
          attemptsRes.data.map((a: Record<string, unknown>) => ({
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

      if (examsRes.data) {
        setRecommendedExams(
          examsRes.data
            .filter((e) => {
              const qs = e.questions as unknown as { id: string }[] | null;
              return (qs?.length ?? 0) > 0;
            })
            .map((e) => ({
              ...e,
              question_count: (e.questions as unknown as { id: string }[])
                .length,
            }))
        );
      }

      if (rankRes.data != null) {
        setUserRank(rankRes.data as number);
      }

      setLoadingData(false);
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
  const readiness = totalExams > 0 ? avgScore : 0;

  const chartData = [...attempts].reverse().map((a, i) => ({
    index: i + 1,
    คะแนน: a.percentage,
    label:
      a.exam_title.slice(0, 10) + (a.exam_title.length > 10 ? ".." : ""),
  }));

  const chartConfig = {
    คะแนน: { label: "คะแนน", color: "var(--chart-1)" },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground mb-1">
            สวัสดี!! พร้อมจะเริ่มสอบแล้วรึยัง <span role="img" aria-label="wave">👋</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            แดชบอร์ดของคุณ
          </h1>
        </div>
        <Link href="/exam" className="btn-premium px-5 py-2.5 text-sm rounded-xl shadow-sm shrink-0">
          เริ่มทำข้อสอบ <ArrowRight className="size-4 ml-1" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatCard
          icon={<Activity className="size-6" />}
          label="ทำไปแล้ว"
          value={totalExams}
          suffix="ครั้ง"
          delay={0}
          accent="primary"
        />
        <StatCard
          icon={<Target className="size-6" />}
          label="คะแนนเฉลี่ย"
          value={avgScore}
          suffix="%"
          delay={0.05}
          accent="primary"
        />
        <StatCard
          icon={<Flame className="size-6" />}
          label="คะแนนสูงสุด"
          value={maxScore}
          suffix="%"
          delay={0.1}
          accent="primary"
        />
        <StatCard
          icon={<TrendingUp className="size-6" />}
          label="ความพร้อมสอบ"
          value={readiness}
          suffix="%"
          delay={0.15}
          accent="primary"
        />
      </div>

      {/* Satisfaction Survey */}
      <div className="pb-4">
      <Link href="/satisfaction">
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardCheck className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  แบบประเมินความพึงพอใจ
                </p>
                <p className="text-sm text-muted-foreground">
                  ช่วยประเมินการใช้งาน NurseUp เพื่อให้เราปรับปรุงให้ดีขึ้น
                </p>
              </div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground shrink-0" />
          </div>
        </motion.div>
      </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        {/* Progress Card */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-bold text-foreground">พัฒนาการ</h2>
            <span className="text-xs text-muted-foreground">20 ครั้งล่าสุด</span>
          </div>
          
          {chartData.length > 1 ? (
            <ChartContainer config={chartConfig} className="aspect-[2/1] sm:aspect-[2.5/1] w-full">
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
          ) : (
             <div className="flex h-32 sm:h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">
                  ยังไม่มีข้อมูล ทดลองทำข้อสอบเพื่อดูพัฒนาการ
                </p>
             </div>
          )}
        </div>

        {/* Ranking Card */}
        <div className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-bold text-foreground">อันดับของคุณ</h2>
            <Link href="/ranking" className="text-xs text-primary hover:underline font-medium">ดูทั้งหมด</Link>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {userRank > 0 ? (
               <div className="text-center">
                 <span className="text-5xl sm:text-6xl font-bold text-foreground">{userRank}</span>
                 <p className="text-sm text-muted-foreground mt-2">จากผู้ใช้งานทั้งหมด</p>
               </div>
            ) : (
               <p className="text-sm text-muted-foreground text-center">
                 ทำข้อสอบเพื่อจัดอันดับ
               </p>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg font-bold text-foreground">ประวัติล่าสุด</h2>
          <Link href="/history" className="text-xs text-primary hover:underline font-medium">ดูทั้งหมด</Link>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {attempts.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-muted-foreground text-center">
                ยังไม่มีประวัติ — เริ่มทำข้อสอบชุดแรกของคุณ
              </p>
            </div>
          ) : (
            attempts.slice(0, 5).map((attempt) => (
              <Link
                key={attempt.id}
                href={`/exam/${attempt.exam_id}/result/${attempt.id}`}
                className="group flex items-center justify-between rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/30 px-4 py-3 transition-all duration-200"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className={`flex size-10 sm:size-11 items-center justify-center rounded-xl text-xs sm:text-sm font-bold shrink-0 ${
                      attempt.percentage >= 80
                        ? "bg-emerald-500/10 text-emerald-600"
                        : attempt.percentage >= 50
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-destructive/10 text-destructive"
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
