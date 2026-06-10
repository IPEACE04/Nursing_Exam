"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { useAuth } from "@/context/auth-context";
import type { LeaderboardEntry } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { cn } from "@/lib/utils";

const rankIcons = [
  <Crown key="1" className="size-5 text-accent" />,
  <Medal key="2" className="size-5 text-muted-foreground" />,
  <Award key="3" className="size-5 text-chart-4" />,
];

export default function RankingPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase.rpc("get_leaderboard", {
        limit_count: 50,
      });

      if (!error && data) {
        setEntries(
          data.map(
            (row: {
              user_id: string;
              name: string;
              avatar_url: string | null;
              total_exams: number;
              avg_score: number;
              total_score: number;
            }) => ({
              user_id: row.user_id,
              name: row.name ?? "ไม่ระบุ",
              avatar_url: row.avatar_url,
              total_exams: Number(row.total_exams),
              avg_score: Number(row.avg_score),
              total_score: Number(row.total_score),
            })
          )
        );
      }
      setLoading(false);
    }

    fetchRanking();
  }, []);

  const topThree = entries.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <PageHeader
        badge="Leaderboard"
        title="อันดับผู้เรียน"
        description="คะแนนเฉลี่ยสูงสุดของนักศึกษาทั้งหมดในแพลตฟอร์ม"
      />

      {loading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Trophy className="mx-auto mb-4 size-14 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            ยังไม่มีข้อมูลการจัดอันดับ
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            เริ่มทำข้อสอบเพื่อขึ้นอันดับ!
          </p>
        </GlassCard>
      ) : (
        <>
          {topThree.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 0, 2].map((idx) => {
                const entry = topThree[idx];
                const isFirst = idx === 0;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex flex-col items-center rounded-2xl border border-border/60 bg-card/80 p-5 text-center backdrop-blur-sm",
                      isFirst && "order-2 -mt-2 border-accent/30 shadow-lg",
                      idx === 1 && "order-1",
                      idx === 2 && "order-3"
                    )}
                  >
                    <div className="mb-2">{rankIcons[idx]}</div>
                    <Avatar
                      className={cn(
                        "mb-2",
                        isFirst ? "size-16 ring-2 ring-accent/40" : "size-12"
                      )}
                    >
                      <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                        {entry.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.name}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      {entry.avg_score}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.total_exams} ครั้ง
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isCurrentUser = entry.user_id === user?.id;
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border px-5 py-3.5 backdrop-blur-sm transition-all hover:shadow-md",
                    isCurrentUser
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/60 bg-card/80"
                  )}
                >
                  <div className="flex w-8 items-center justify-center">
                    {i < 3 ? (
                      rankIcons[i]
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                    )}
                  </div>

                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {entry.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-primary">(คุณ)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.total_exams} ครั้ง
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {entry.avg_score}%
                    </p>
                    <p className="text-xs text-muted-foreground">คะแนนเฉลี่ย</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
