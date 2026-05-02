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

const COLORS = ["#faff69", "#22c55e", "#3b82f6", "#ef4444", "#888888", "#f59e0b", "#ec4899", "#06b6d4"];

export function PieChart({
  data,
  colors = COLORS,
  height = 280,
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
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#ffffff",
          }}
          formatter={(value) => (typeof value === "number" ? value.toLocaleString() : value)}
        />
        {showLegend && (
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-[#888888]">{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}