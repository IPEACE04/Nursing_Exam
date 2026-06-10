"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Percent,
  Trophy,
  Clock,
  ArrowRight,
  Play,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { AttemptWithExam, ExamWithQuestionCount } from "@/types";
import { StatCard } from "@/components/premium/stat-card";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
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
    transition: { staggerChildren: 0.06 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
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
  const [recommendedExams, setRecommendedExams] = useState<ExamWithQuestionCount[]>([]);
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
  const totalTime = attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0);
  const hours = Math.floor(totalTime / 3600);
  const minutes = Math.floor((totalTime % 3600) / 60);

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
      className="space-y-8"
    >
      <PageHeader
        badge="Dashboard"
        title={`สวัสดี, ${profile?.name || "ผู้ใช้"}`}
        description="ภาพรวมการฝึกทำข้อสอบและพัฒนาการของคุณ"
        action={
          <Link href="/exam" className="btn-premium">
            <Play className="size-4" />
            เริ่มทำข้อสอบ
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="ข้อสอบที่ทำ"
          value={totalExams}
          delay={0}
        />
        <StatCard
          icon={<Percent className="size-5" />}
          label="คะแนนเฉลี่ย"
          value={avgScore}
          suffix="%"
          delay={0.05}
          iconBg="bg-chart-3/10"
          iconColor="text-chart-3"
        />
        <StatCard
          icon={<Trophy className="size-5" />}
          label="อันดับ"
          value={userRank || 0}
          suffix={userRank ? "" : "—"}
          delay={0.1}
          iconBg="bg-accent/15"
          iconColor="text-accent-foreground"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="เวลาสะสม"
          value={hours}
          suffix={`h ${minutes}m`}
          delay={0.15}
          iconBg="bg-chart-2/15"
          iconColor="text-chart-2"
        />
      </div>

      {recommendedExams.length > 0 && (
        <motion.div variants={itemAnim}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              แนะนำชุดข้อสอบ
            </h2>
            <Link
              href="/exam"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              ดูทั้งหมด
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedExams.map((exam, i) => (
              <GlassCard key={exam.id} hover delay={i * 0.05} className="p-5">
                <h3 className="font-semibold text-foreground">{exam.title}</h3>
                {exam.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {exam.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {exam.question_count} ข้อ · {exam.time_limit_minutes} นาที
                  </span>
                  <Link
                    href={`/exam/${exam.id}`}
                    className="btn-premium px-4 py-2 text-xs"
                  >
                    เริ่มสอบ
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      )}

      {chartData.length > 1 && (
        <GlassCard hover={false}>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            พัฒนาการคะแนน
          </h2>
          <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
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
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="คะแนน"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--chart-1)" }}
                activeDot={{ r: 6, fill: "var(--chart-2)" }}
              />
            </LineChart>
          </ChartContainer>
        </GlassCard>
      )}

      <motion.div variants={itemAnim}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          ผลสอบล่าสุด
        </h2>
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <GlassCard className="py-12 text-center">
              <ClipboardList className="mx-auto mb-3 size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                ยังไม่มีประวัติการสอบ
              </p>
              <Link href="/exam" className="btn-premium mt-4 inline-flex">
                เริ่มทำข้อสอบเลย
              </Link>
            </GlassCard>
          ) : (
            attempts.slice(0, 5).map((attempt, i) => (
              <Link
                key={attempt.id}
                href={`/exam/${attempt.exam_id}/result/${attempt.id}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
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
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {attempt.score}/{attempt.total_questions}
                    </span>
                    <ArrowRight className="size-4" />
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
