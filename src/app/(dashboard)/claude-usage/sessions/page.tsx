"use client";

import { useClaudeUsage } from "@/hooks/useClaudeUsage";
import { SessionsTable } from "@/components/common/SessionsTable";
import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock, DollarSign } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export default function SessionsPage() {
  const { data, isLoading, isError, error } = useClaudeUsage();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#ef4444]">
        Failed to load sessions: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const { summary, recentSessions } = data;

  return (
    <div className="space-y-8">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#faff69] text-lg">›</span>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-[#ffffff]">
            All Sessions
          </h1>
        </div>
        <p className="text-[13px] text-[#888888] pl-7">
          {summary.totalSessions} sessions total
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Sessions" value={summary.totalSessions} icon={MessageSquare} />
        <MetricCard label="Total Duration" value={`${Math.round(summary.totalDurationMinutes)}m`} icon={Clock} />
        <MetricCard label="Est. Total Cost" value={`$${summary.estimatedCostUSD.toFixed(2)}`} icon={DollarSign} />
        <MetricCard label="User Messages" value={summary.totalUserMessages} icon={MessageSquare} />
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          All Sessions
        </h3>
        <SessionsTable sessions={recentSessions} />
      </div>
    </div>
  );
}