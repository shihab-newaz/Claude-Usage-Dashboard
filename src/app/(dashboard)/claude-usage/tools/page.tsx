"use client";

import { useClaudeUsage } from "@/hooks/useClaudeUsage";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Terminal, Zap } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export default function ToolsPage() {
  const { data, isLoading, isError, error } = useClaudeUsage();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#ef4444]">
        Failed to load tool data: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const { toolBreakdown, summary } = data;
  const totalToolCalls = toolBreakdown.reduce((sum, t) => sum + t.count, 0);
  const top8 = toolBreakdown.slice(0, 8);
  const rest = toolBreakdown.slice(8);
  const restCount = rest.reduce((sum, t) => sum + t.count, 0);
  const pieData = [
    ...top8.map((t) => ({ name: t.tool, value: t.count })),
    ...(restCount > 0 ? [{ name: "Other", value: restCount }] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#faff69] text-lg">›</span>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-[#ffffff]">
            Tool Usage
          </h1>
        </div>
        <p className="text-[13px] text-[#888888] pl-7">
          {totalToolCalls.toLocaleString()} total tool calls across {summary.totalSessions} sessions
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Tool Calls" value={totalToolCalls.toLocaleString()} icon={Terminal} />
        <MetricCard label="Unique Tools" value={toolBreakdown.length} icon={Layers} />
        <MetricCard label="Top Tool" value={toolBreakdown[0]?.tool ?? "—"} icon={Zap} />
        <MetricCard label="Avg Calls/Session" value={(totalToolCalls / summary.totalSessions).toFixed(1)} icon={Terminal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
            Tool Distribution
          </h3>
          <PieChart
            data={pieData}
            height={300}
          />
        </div>

        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
            Top Tools by Call Count
          </h3>
          <BarChart
            data={toolBreakdown.slice(0, 12).map((t) => ({ name: t.tool, value: t.count }))}
            height={300}
          />
        </div>
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          All Tools
        </h3>
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {toolBreakdown.map((tool) => (
            <div
              key={tool.tool}
              className="flex items-center justify-between rounded-lg bg-[#121212] border border-[#2a2a2a] px-4 py-3"
            >
              <span className="text-sm font-medium text-[#ffffff]">{tool.tool}</span>
              <span className="text-[#faff69] font-semibold">{tool.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}