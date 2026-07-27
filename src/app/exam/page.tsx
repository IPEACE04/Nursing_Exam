"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, FileText, Play, BookOpen, ClipboardCheck } from "lucide-react";
import { getPublishedExams } from "@/actions/exam";
import type { ExamWithQuestionCount } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { useLocale } from "@/context/locale-context";
import { t } from "@/lib/translations";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function ExamListPage() {
  const { locale } = useLocale();
  const [exams, setExams] = useState<ExamWithQuestionCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExams() {
      const data = await getPublishedExams();
      setExams(data as ExamWithQuestionCount[]);
      setLoading(false);
    }

    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const prePostExam = exams.find((e) => (e as unknown as Record<string, unknown>).type === "pre_post_test");
  const normalExams = exams.filter((e) => (e as unknown as Record<string, unknown>).type !== "pre_post_test");

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 md:space-y-10 pt-4">
      <PageHeader
        badge={t(locale, "exam.list.title")}
        title={t(locale, "exam.list.title")}
        description={t(locale, "exam.list.desc")}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {exams.length === 0 ? (
          <GlassCard className="py-20 text-center">
            <BookOpen className="mx-auto mb-4 size-16 text-muted-foreground/30" />
            <p className="text-base text-muted-foreground">
              {t(locale, "exam.list.empty")}
            </p>
          </GlassCard>
        ) : (
          <>
            {prePostExam && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="size-4 text-primary" />
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    PreTest / PostTest
                  </h2>
                </div>
                <motion.div variants={itemAnim} className="group">
                  <GlassCard
                    hover
                    className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between border-primary/20"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground line-clamp-1">
                          {prePostExam.title}
                        </h3>
                        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Pre/Post
                        </span>
                      </div>
                      {prePostExam.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {prePostExam.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <FileText className="size-4" />
                          {prePostExam.question_count} {t(locale, "exam.list.questions")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-4" />
                          {prePostExam.time_limit_minutes} {t(locale, "exam.list.minutes")}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/exam/${prePostExam.id}`}
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
                    >
                      <Play className="size-5" />
                      {t(locale, "exam.list.start")}
                    </Link>
                  </GlassCard>
                </motion.div>
              </div>
            )}

            {normalExams.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pt-2">
                  <BookOpen className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {t(locale, "exam.list.normalExams")} ({normalExams.length})
                  </h2>
                </div>
                {normalExams.map((exam) => (
                  <motion.div
                    key={exam.id}
                    variants={itemAnim}
                    className="group"
                  >
                    <GlassCard
                      hover
                      className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground line-clamp-1">
                          {exam.title}
                        </h3>
                        {exam.description && (
                          <p className="mt-1.5 line-clamp-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {exam.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <FileText className="size-4" />
                          {exam.question_count} {t(locale, "exam.list.questions")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-4" />
                          {exam.time_limit_minutes} {t(locale, "exam.list.minutes")}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/exam/${exam.id}`}
                        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
                      >
                        <Play className="size-5" />
                        {t(locale, "exam.list.start")}
                      </Link>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
