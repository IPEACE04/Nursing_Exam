"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  data: { index: number; คะแนน: number; label: string }[];
}

export function ProgressChart({ data }: Props) {
  return (
    <ChartContainer
      config={{ คะแนน: { label: "คะแนน", color: "var(--chart-1)" } }}
      className="aspect-[2/1] sm:aspect-[2.5/1] w-full"
    >
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="var(--border)"
          strokeWidth={0.5}
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
  );
}
