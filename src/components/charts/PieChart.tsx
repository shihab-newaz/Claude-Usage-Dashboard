"use client";

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface PieEntry {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieEntry[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#84cc16",
  "#f59e0b",
  "#ef4444",
];

export function PieChart({
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          formatter={(value) => (typeof value === "number" ? value.toLocaleString() : value)}
        />
        {showLegend && (
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
