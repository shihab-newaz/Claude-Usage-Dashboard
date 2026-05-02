"use client";

import { useParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { MetricCard } from "@/components/common/MetricCard";
import { BarChart } from "@/components/charts/BarChart";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Clock,
  Zap,
  TrendingUp,
  MessageSquare,
  Terminal,
  DollarSign,
  ArrowLeft,
  Database,
} from "lucide-react";
import Link from "next/link";

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { data: session, isLoading, isError, error } = useSession(sessionId);

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#ef4444]">
        Failed to load session: {String(error)}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#888888]">
        Session not found
      </div>
    );
  }

  const projectName = session.project_path.split(/[/\\]/).pop() ?? session.project_path;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] pb-6">
        <Link
          href="/claude-usage"
          className="inline-flex items-center gap-2 text-sm text-[#888888] hover:text-[#faff69] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#faff69]">
            <Database className="h-6 w-6 text-[#0a0a0a]" />
          </div>
          <div>
            <h1 className="text-[32px] font-bold tracking-[-1px] text-[#ffffff]">
              {projectName}
            </h1>
            <p className="text-[13px] text-[#888888]">
              Session {session.id.slice(0, 8)}... •{" "}
              {format(new Date(session.start_time), "yyyy-MM-dd HH:mm")}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Duration"
          value={`${Math.round(session.duration_minutes)}m`}
          icon={Clock}
        />
        <MetricCard
          label="Input Tokens"
          value={session.input_tokens.toLocaleString()}
          icon={Zap}
        />
        <MetricCard
          label="Output Tokens"
          value={session.output_tokens.toLocaleString()}
          icon={TrendingUp}
        />
        <MetricCard
          label="Est. Cost"
          value={`$${((session.input_tokens / 1000 * 0.00125) + (session.output_tokens / 1000 * 0.005)).toFixed(4)}`}
          icon={DollarSign}
        />
        <MetricCard
          label="User Messages"
          value={session.user_message_count}
          icon={MessageSquare}
        />
        <MetricCard
          label="Assistant Messages"
          value={session.assistant_message_count}
          icon={MessageSquare}
        />
        <MetricCard
          label="Tool Invocations"
          value={session.tool_count}
          icon={Terminal}
        />
        <MetricCard
          label="Messages/Min"
          value={session.duration_minutes > 0
            ? ((session.user_message_count + session.assistant_message_count) / session.duration_minutes).toFixed(1)
            : "0"}
          icon={TrendingUp}
        />
      </div>

      {/* Cache Metrics */}
      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Cache Performance
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Cache Read</p>
            <p className="text-2xl font-bold text-[#3b82f6]">
              {(session.cache_read_input_tokens / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Cache Create</p>
            <p className="text-2xl font-bold text-[#22c55e]">
              {(session.cache_creation_input_tokens / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Cache Hit Rate</p>
            <p className="text-2xl font-bold text-[#faff69]">
              {session.input_tokens > 0
                ? ((session.cache_read_input_tokens / session.input_tokens) * 100).toFixed(0)
                : 0}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Total Cache</p>
            <p className="text-2xl font-bold text-[#888888]">
              {((session.cache_read_input_tokens + session.cache_creation_input_tokens) / 1000).toFixed(1)}k
            </p>
          </div>
        </div>
      </div>

      {/* Tool Breakdown */}
      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Tool Breakdown
        </h3>
        {session.topTools.length > 0 ? (
          <BarChart
            data={session.topTools.slice(0, 10).map((t) => ({
              name: t.tool,
              value: t.count,
            }))}
            height={280}
          />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-[#888888]">
            No tool data available
          </div>
        )}
      </div>

      {/* Session Metadata */}
      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Session Details
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Session ID</p>
            <p className="text-[#cccccc] font-mono text-xs break-all">{session.id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Start Time</p>
            <p className="text-[#cccccc]">{format(new Date(session.start_time), "yyyy-MM-dd HH:mm:ss")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">End Time</p>
            <p className="text-[#cccccc]">
              {session.end_time ? format(new Date(session.end_time), "yyyy-MM-dd HH:mm:ss") : "In progress"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Project Path</p>
            <p className="text-[#cccccc] font-mono text-xs break-all">{session.project_path}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Task Agent</p>
            <p className={`font-semibold ${session.uses_task_agent ? "text-[#22c55e]" : "text-[#888888]"}`}>
              {session.uses_task_agent ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">MCP Used</p>
            <p className={`font-semibold ${session.uses_mcp ? "text-[#22c55e]" : "text-[#888888]"}`}>
              {session.uses_mcp ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}