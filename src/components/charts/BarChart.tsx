"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarEntry {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarEntry[];
  height?: number;
  color?: string;
}

const COLORS = [
  "#faff69",
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#888888",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

export function BarChart({ data, height = 280, color }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#888888", fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#888888", fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#ffffff",
          }}
          formatter={(value) => (typeof value === "number" ? value.toLocaleString() : value)}
        />
        {data.map((_, index) => (
          <Bar
            key={index}
            dataKey="value"
            fill={color ?? COLORS[index % COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}