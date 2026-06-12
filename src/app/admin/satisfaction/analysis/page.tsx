"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, FileText, Star, MessageSquare } from "lucide-react";
import { getAnalysis } from "@/actions/satisfaction";
import type { SatisfactionAnalysis } from "@/types";
import { PageHeader } from "@/components/premium/page-header";
import { GlassCard } from "@/components/premium/glass-card";
import { LoadingSpinner } from "@/components/premium/loading-spinner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AnalysisPage() {
  const [analysis, setAnalysis] = useState<SatisfactionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalysis().then((data) => {
      setAnalysis(data);
      setLoading(false);
    });
  }, []);

  async function handleExportPDF() {
    if (!analysis) return;

    let html = `
      <html><head><meta charset="utf-8"><style>
        body { font-family: 'IBM Plex Sans Thai', sans-serif; padding: 40px; color: #333; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #4A90D9; color: white; padding: 12px 8px; text-align: left; }
        td { padding: 10px 8px; border-bottom: 1px solid #eee; }
        .bar { background: #4A90D9; height: 24px; border-radius: 4px; }
        .bar-bg { background: #f0f0f0; border-radius: 4px; }
        h2 { margin-top: 30px; font-size: 18px; color: #4A90D9; }
        .feedback { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .feedback-meta { font-size: 12px; color: #999; margin-bottom: 5px; }
      </style></head><body>
        <h1>NurseCise — รายงานความพึงพอใจ</h1>
        <p class="subtitle">ผู้ตอบทั้งหมด ${analysis.total_responses} คน</p>
        <h2>คะแนนเฉลี่ยรายข้อ</h2>
        <table>
          <tr><th>คำถาม</th><th>คะแนนเฉลี่ย</th><th>จำนวนผู้ตอบ</th></tr>
    `;

    analysis.average_per_question.forEach((q) => {
      const pct = (q.avg_score / 5) * 100;
      html += `
        <tr>
          <td>${q.question_text}</td>
          <td><div class="bar-bg"><div class="bar" style="width:${pct}%"></div></div> ${q.avg_score}/5</td>
          <td>${q.total_scores}</td>
        </tr>
      `;
    });

    html += `</table><h2>ข้อเสนอแนะ</h2>`;

    if (analysis.feedbacks.length === 0) {
      html += `<p style="color:#999">ไม่มีข้อเสนอแนะ</p>`;
    } else {
      analysis.feedbacks.forEach((f) => {
        html += `
          <div class="feedback">
            <p class="feedback-meta">${f.user_name} · ${formatDate(f.created_at)}</p>
            <p>${f.feedback}</p>
          </div>
        `;
      });
    }

    html += `</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `satisfaction-report-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const chartData = analysis.average_per_question.map((q) => ({
    name:
      q.question_text.length > 30
        ? q.question_text.slice(0, 30) + ".."
        : q.question_text,
    score: q.avg_score,
  }));

  const chartConfig = {
    score: { label: "คะแนนเฉลี่ย", color: "var(--chart-1)" },
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        badge="Analysis"
        title="ผลวิเคราะห์ความพึงพอใจ"
        description={`ผู้ตอบทั้งหมด ${analysis.total_responses} คน`}
        action={
          <button onClick={handleExportPDF} className="btn-premium">
            <FileText className="size-4" />
            Export Report
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <GlassCard className="p-5 sm:p-6 text-center">
          <BarChart3 className="mx-auto size-8 text-primary mb-2" />
          <p className="text-3xl font-bold text-foreground">{analysis.total_responses}</p>
          <p className="text-sm text-muted-foreground">ผู้ตอบทั้งหมด</p>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6 text-center">
          <Star className="mx-auto size-8 text-amber-500 mb-2" />
          <p className="text-3xl font-bold text-foreground">
            {analysis.total_responses > 0
              ? (
                  analysis.average_per_question.reduce(
                    (sum, q) => sum + q.avg_score,
                    0
                  ) / analysis.average_per_question.length
                ).toFixed(1)
              : "0.0"}
          </p>
          <p className="text-sm text-muted-foreground">คะแนนรวมเฉลี่ย</p>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6 text-center">
          <MessageSquare className="mx-auto size-8 text-emerald-500 mb-2" />
          <p className="text-3xl font-bold text-foreground">{analysis.feedbacks.length}</p>
          <p className="text-sm text-muted-foreground">ข้อเสนอแนะ</p>
        </GlassCard>
      </div>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          คะแนนเฉลี่ยรายข้อ
        </h2>
        <ChartContainer config={chartConfig} className="aspect-[2/1] sm:aspect-[2.5/1] w-full max-h-96">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 40, right: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 5]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={160}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="score"
              fill="var(--chart-1)"
              radius={[0, 6, 6, 0]}
              barSize={20}
            />
          </BarChart>
        </ChartContainer>
      </GlassCard>

      {analysis.feedbacks.length > 0 && (
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">
            ข้อเสนอแนะ ({analysis.feedbacks.length})
          </h2>
          <div className="space-y-3">
            {analysis.feedbacks.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/40 bg-muted/30 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {f.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(f.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{f.feedback}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
