"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Star, MessageSquare, Layers } from "lucide-react";
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'IBM Plex Sans Thai', sans-serif; padding: 32px 40px; color: #1a1a2e; max-width: 900px; margin: 0 auto; }
        h1 { text-align: center; font-size: 22px; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
        h2 { font-size: 16px; color: #4A90D9; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #4A90D9; }
        h3 { font-size: 14px; color: #333; margin: 20px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 13px; }
        th { background: #4A90D9; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
        td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; }
        .bar { background: #4A90D9; height: 18px; border-radius: 4px; }
        .bar-bg { background: #f0f0f0; border-radius: 4px; }
        .feedback { background: #f9f9f9; padding: 12px 16px; margin: 8px 0; border-radius: 8px; font-size: 13px; }
        .feedback-meta { font-size: 11px; color: #999; margin-bottom: 4px; }
        .cat-header { background: #f5f7fa; padding: 8px 12px; border-radius: 6px; margin-top: 16px; font-weight: 600; font-size: 14px; color: #4A90D9; }
        .summary { display: flex; gap: 24px; justify-content: center; margin: 16px 0; }
        .summary-item { text-align: center; }
        .summary-value { font-size: 24px; font-weight: 700; color: #4A90D9; }
        .summary-label { font-size: 11px; color: #888; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <h1>NurseUp — รายงานความพึงพอใจ</h1>
        <p class="subtitle">ผู้ตอบทั้งหมด ${analysis.total_responses} คน · วันที่ ${new Date().toLocaleDateString("th-TH")}</p>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-value">${analysis.total_responses}</div>
            <div class="summary-label">ผู้ตอบ</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${analysis.total_responses > 0 ? (analysis.average_per_question.reduce((sum, q) => sum + q.avg_score, 0) / analysis.average_per_question.length).toFixed(1) : "0.0"}</div>
            <div class="summary-label">คะแนนเฉลี่ย</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${analysis.feedbacks.length}</div>
            <div class="summary-label">ข้อเสนอแนะ</div>
          </div>
        </div>
    `;

    analysis.categories.forEach((cat) => {
      html += `
        <h2>${cat.category_name}</h2>
        <p style="font-size:12px;color:#888;margin-top:-8px">เฉลี่ย ${cat.avg_score}/5 · ${cat.questions.length} คำถาม</p>
        <table>
          <tr><th style="width:70%">คำถาม</th><th style="width:15%">คะแนน</th><th style="width:15%">ผู้ตอบ</th></tr>
      `;

      const catQuestions = analysis.average_per_question.filter(
        (q) => q.category_name === cat.category_name
      );

      catQuestions.forEach((q) => {
        const pct = (q.avg_score / 5) * 100;
        html += `
          <tr>
            <td>${q.question_text}</td>
            <td><div class="bar-bg"><div class="bar" style="width:${pct}%"></div></div> ${q.avg_score}/5</td>
            <td>${q.total_scores}</td>
          </tr>
        `;
      });

      html += `</table>`;
    });

    html += `<h2>ข้อเสนอแนะ</h2>`;

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

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

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
          <button
            onClick={handleExportPDF}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:translate-y-px"
          >
            <FileText className="size-4" />
            Export Report
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <GlassCard className="p-5 sm:p-6 text-center">
          <BarChart3 className="mx-auto size-8 text-primary mb-2" />
          <p className="text-3xl font-bold tracking-tight text-foreground">{analysis.total_responses}</p>
          <p className="text-sm text-muted-foreground">ผู้ตอบทั้งหมด</p>
        </GlassCard>
        <GlassCard className="p-5 sm:p-6 text-center">
          <Star className="mx-auto size-8 text-amber-500 mb-2" />
          <p className="text-3xl font-bold tracking-tight text-foreground">
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
          <p className="text-3xl font-bold tracking-tight text-foreground">{analysis.feedbacks.length}</p>
          <p className="text-sm text-muted-foreground">ข้อเสนอแนะ</p>
        </GlassCard>
      </div>

      {analysis.categories.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Layers className="mx-auto mb-3 size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
        </GlassCard>
      ) : (
        analysis.categories.map((cat) => {
          const catChartData = cat.questions.map((q) => ({
            name:
              q.question_text.length > 30
                ? q.question_text.slice(0, 30) + ".."
                : q.question_text,
            score: q.avg_score,
          }));

          return (
            <GlassCard key={cat.category_name} className="p-5 sm:p-6 overflow-hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-muted">
                  <Layers className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {cat.category_name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    เฉลี่ย {cat.avg_score}/5 · {cat.questions.length} คำถาม
                  </p>
                </div>
              </div>
              <div className="w-full">
                <ChartContainer config={chartConfig} className="aspect-[2.5/1] w-full">
                  <BarChart
                    data={catChartData}
                    layout="vertical"
                    margin={{ left: 0, right: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="var(--border)"
                      strokeWidth={0.5}
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
                      width={140}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="score"
                      fill="var(--chart-1)"
                      radius={[0, 6, 6, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </GlassCard>
          );
        })
      )}

      {analysis.feedbacks.length > 0 && (
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
            ข้อเสนอแนะ ({analysis.feedbacks.length})
          </h2>
          <div className="space-y-3">
            {analysis.feedbacks.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {f.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {formatDate(f.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{f.feedback}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
