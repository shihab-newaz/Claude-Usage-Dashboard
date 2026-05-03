"use client";

import { useClaudeUsage } from "@/hooks/useClaudeUsage";
import { MetricCard } from "@/components/common/MetricCard";
import { AreaChart } from "@/components/charts/AreaChart";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { SessionsTable } from "@/components/common/SessionsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { MessageSquare, Zap, TrendingUp, Clock, DollarSign } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export default function ClaudeUsagePage() {
  const { data, isLoading, isError, error } = useClaudeUsage();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#ef4444]">
        Failed to load usage data: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const { summary, timeSeries, toolBreakdown, languageBreakdown, recentSessions } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#faff69] text-lg">›</span>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-[#ffffff]">
            Claude Code Usage
          </h1>
        </div>
        <p className="text-[13px] text-[#888888] pl-7">
          Aggregated from {summary.totalSessions} sessions — {format(new Date(data.generatedAt), "yyyy-MM-dd HH:mm:ss")}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Sessions" value={summary.totalSessions} icon={MessageSquare} />
        <MetricCard label="Input Tokens" value={summary.totalInputTokens.toLocaleString()} icon={Zap} />
        <MetricCard label="Output Tokens" value={summary.totalOutputTokens.toLocaleString()} icon={TrendingUp} />
        <MetricCard label="Est. Cost" value={`$${summary.estimatedCostUSD.toFixed(2)}`} icon={DollarSign} />
        <MetricCard label="Lines Added" value={summary.totalLinesAdded.toLocaleString()} icon={Zap} />
        <MetricCard label="Lines Removed" value={summary.totalLinesRemoved.toLocaleString()} icon={Zap} />
        <MetricCard label="Duration" value={`${Math.round(summary.totalDurationMinutes)}m`} icon={Clock} />
        <MetricCard label="User Messages" value={summary.totalUserMessages.toLocaleString()} icon={MessageSquare} />
      </div>

      {/* Charts */}
      <Tabs defaultValue="tokens" className="font-sans">
        <TabsList className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-1 mb-4">
          <TabsTrigger
            value="tokens"
            className="data-active:bg-[#faff69] data-active:text-[#0a0a0a] data-active:font-semibold rounded-lg px-4 py-2 text-sm text-[#888888] hover:text-[#ffffff] transition-all"
          >
            Token Usage
          </TabsTrigger>
          <TabsTrigger
            value="tools"
            className="data-active:bg-[#faff69] data-active:text-[#0a0a0a] data-active:font-semibold rounded-lg px-4 py-2 text-sm text-[#888888] hover:text-[#ffffff] transition-all"
          >
            Tool Breakdown
          </TabsTrigger>
          <TabsTrigger
            value="languages"
            className="data-active:bg-[#faff69] data-active:text-[#0a0a0a] data-active:font-semibold rounded-lg px-4 py-2 text-sm text-[#888888] hover:text-[#ffffff] transition-all"
          >
            Languages
          </TabsTrigger>
          <TabsTrigger
            value="models"
            className="data-active:bg-[#faff69] data-active:text-[#0a0a0a] data-active:font-semibold rounded-lg px-4 py-2 text-sm text-[#888888] hover:text-[#ffffff] transition-all"
          >
            Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
              Token Usage Over Time
            </h3>
            <AreaChart
              data={timeSeries}
              xAxisKey="date"
              series={[
                { key: "inputTokens", color: "#faff69", label: "Input" },
                { key: "outputTokens", color: "#22c55e", label: "Output" },
                { key: "cacheReadTokens", color: "#3b82f6", label: "Cache" },
              ]}
              height={280}
            />
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
              Tool Usage Breakdown
            </h3>
            <PieChart
              data={toolBreakdown.map((t) => ({ name: t.tool, value: t.count }))}
              height={280}
            />
          </div>
        </TabsContent>

        <TabsContent value="languages">
          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
              Language Breakdown
            </h3>
            {languageBreakdown.length > 0 ? (
              <BarChart
                data={languageBreakdown.slice(0, 15).map((l) => ({
                  name: l.language,
                  value: l.count,
                }))}
                height={280}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-[#888888]">
                No language data available
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="models">
          <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
              Model Distribution
            </h3>
            {data.modelBreakdown.length > 0 ? (
              <PieChart
                data={data.modelBreakdown.map((m) => ({ name: m.model, value: m.inputTokens }))}
                height={280}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-[#888888]">
                No model data available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Sessions Table */}
      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Recent Sessions
        </h3>
        <SessionsTable sessions={recentSessions} />
      </div>
    </div>
  );
}