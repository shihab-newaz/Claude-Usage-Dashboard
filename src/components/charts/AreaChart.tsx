"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Series {
  key: string;
  color: string;
  label: string;
}

interface AreaChartProps {
  data: unknown[];
  xAxisKey: string;
  series: Series[];
  height?: number;
  showGrid?: boolean;
}

export function AreaChart({
  data,
  xAxisKey,
  series,
  height = 280,
  showGrid = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12, fill: "#888888", fontFamily: "Inter, sans-serif" }}
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
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#gradient-${s.key})`}
            name={s.label}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}