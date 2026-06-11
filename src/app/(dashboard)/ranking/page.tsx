"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Crown, Star } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { useAuth } from "@/context/auth-context";
import type { LeaderboardEntry } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import { cn } from "@/lib/utils";

const podiumColors = [
  { bg: "from-amber-400/20 to-yellow-500/10", border: "border-amber-400/30", text: "text-amber-500", icon: "text-amber-500", label: " gold" },
  { bg: "from-slate-300/20 to-gray-400/10", border: "border-slate-300/30", text: "text-slate-500", icon: "text-slate-400", label: "" },
  { bg: "from-amber-700/20 to-orange-800/10", border: "border-amber-700/30", text: "text-amber-700", icon: "text-amber-600", label: "" },
];

const rankIcons = [
  <Crown key="1" className="size-6 text-amber-500" />,
  <Medal key="2" className="size-6 text-slate-400" />,
  <Award key="3" className="size-6 text-amber-600" />,
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

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 sm:space-y-10"
    >
      <PageHeader
        badge="Rankings"
        title="อันดับผู้ใช้งาน"
        description="จัดอันดับตามคะแนนสอบเฉลี่ยสูงสุด"
      />

      {/* Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-5 items-end">
          {[1, 0, 2].map((idx) => {
            const entry = entries[idx];
            const pc = podiumColors[idx];
            const isCurrentUser = entry?.user_id === user?.id;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                className={cn(
                  "relative flex flex-col items-center rounded-2xl border bg-card/60 backdrop-blur-xl p-4 sm:p-8 shadow-clinic transition-all duration-300 hover:shadow-clinic-lg",
                  pc.border,
                  idx === 0 ? "pb-8 sm:pb-12" : idx === 2 ? "pb-7 sm:pb-10" : "pb-7.5 sm:pb-11"
                )}
              >
                <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-b opacity-40", pc.bg)} />
                <div className="relative flex flex-col items-center gap-2 sm:gap-3">
                  <div className={cn("text-2xl sm:text-3xl", pc.icon)}>
                    {rankIcons[idx]}
                  </div>
                  <Avatar className="size-12 sm:size-16 ring-2 ring-primary/20 shadow-clinic">
                    <AvatarFallback className="bg-primary/5 text-base sm:text-xl font-semibold text-primary">
                      {entry?.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm sm:text-base font-semibold text-foreground text-center leading-tight line-clamp-1">
                    {entry?.name}
                  </p>
                  <p className={cn("text-xl sm:text-3xl font-bold", pc.text)}>
                    {entry?.avg_score}%
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {entry?.total_exams} ครั้ง
                  </p>
                  {isCurrentUser && (
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                      คุณ
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Leaderboard list */}
      <GlassCard className="overflow-hidden p-0">
        <div className="divide-y divide-border/20">
          {entries.map((entry, i) => {
            const isCurrentUser = entry.user_id === user?.id;
            const rank = i + 1;
            const rankColor =
              rank === 1
                ? "text-amber-500"
                : rank === 2
                  ? "text-slate-400"
                  : rank === 3
                    ? "text-amber-600"
                    : "text-muted-foreground";

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 transition-colors",
                  isCurrentUser
                    ? "bg-primary/5"
                    : "hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                  <div className={cn(
                    "flex size-9 sm:size-11 items-center justify-center rounded-xl text-sm sm:text-base font-bold shrink-0",
                    rankColor
                  )}>
                    {rank <= 3 ? rankIcons[rank - 1] : `#${rank}`}
                  </div>
                  <Avatar className="size-9 sm:size-11 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs sm:text-sm font-semibold text-primary">
                      {entry.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-medium text-foreground truncate">
                        {entry.name}
                      </p>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] sm:text-xs font-medium text-primary shrink-0">
                          คุณ
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {entry.total_exams} ครั้งที่ทำ
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {entry.avg_score}%
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {entry.total_score} คะแนนรวม
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
}
