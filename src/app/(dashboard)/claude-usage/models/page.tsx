"use client";

import { useClaudeUsage } from "@/hooks/useClaudeUsage";
import { MetricCard } from "@/components/common/MetricCard";
import { BarChart } from "@/components/charts/BarChart";
import { PieChart } from "@/components/charts/PieChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, MessageSquare, DollarSign, Zap } from "lucide-react";

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

export default function ModelsPage() {
  const { data, isLoading, isError, error } = useClaudeUsage();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#ef4444]">
        Failed to load model data: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const { modelBreakdown, summary } = data;
  const totalInputTokens = modelBreakdown.reduce((sum, m) => sum + m.inputTokens, 0);
  const totalOutputTokens = modelBreakdown.reduce((sum, m) => sum + m.outputTokens, 0);
  const totalCost = modelBreakdown.reduce((sum, m) => sum + m.estimatedCostUSD, 0);
  const totalMessages = modelBreakdown.reduce((sum, m) => sum + m.messageCount, 0);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#faff69] text-lg">›</span>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-[#ffffff]">
            Model Usage
          </h1>
        </div>
        <p className="text-[13px] text-[#888888] pl-7">
          {modelBreakdown.length} model{modelBreakdown.length !== 1 ? "s" : ""} across {summary.totalSessions} sessions
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Unique Models" value={modelBreakdown.length} icon={Cpu} />
        <MetricCard label="Total Messages" value={totalMessages.toLocaleString()} icon={MessageSquare} />
        <MetricCard label="Total Cost" value={`$${totalCost.toFixed(4)}`} icon={DollarSign} />
        <MetricCard label="Avg Cost/Model" value={`$${(totalCost / modelBreakdown.length).toFixed(4)}`} icon={Zap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
            Input Tokens by Model
          </h3>
          <BarChart
            data={modelBreakdown.slice(0, 10).map((m) => ({
              name: m.model.length > 20 ? m.model.slice(0, 20) + "…" : m.model,
              value: m.inputTokens,
            }))}
            height={300}
          />
        </div>

        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
            Output Tokens by Model
          </h3>
          <BarChart
            data={modelBreakdown.slice(0, 10).map((m) => ({
              name: m.model.length > 20 ? m.model.slice(0, 20) + "…" : m.model,
              value: m.outputTokens,
            }))}
            height={300}
          />
        </div>
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Message Distribution
        </h3>
        <PieChart
          data={modelBreakdown.map((m) => ({ name: m.model, value: m.messageCount }))}
          height={300}
        />
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Model Details
        </h3>
        <div className="space-y-3">
          {modelBreakdown.map((model) => (
            <div
              key={model.model}
              className="flex items-center justify-between rounded-lg bg-[#121212] border border-[#2a2a2a] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#ffffff] truncate">{model.model}</p>
                <p className="text-xs text-[#888888]">{model.messageCount.toLocaleString()} messages</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-[#faff69] font-semibold">{model.inputTokens.toLocaleString()}</p>
                  <p className="text-[10px] text-[#888888] uppercase">input</p>
                </div>
                <div className="text-right">
                  <p className="text-[#3b82f6] font-semibold">{model.outputTokens.toLocaleString()}</p>
                  <p className="text-[10px] text-[#888888] uppercase">output</p>
                </div>
                <div className="text-right">
                  <p className="text-[#22c55e] font-semibold">${model.estimatedCostUSD.toFixed(4)}</p>
                  <p className="text-[10px] text-[#888888] uppercase">cost</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}