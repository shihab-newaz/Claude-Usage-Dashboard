"use client";

import { useClaudeUsage } from "@/hooks/useClaudeUsage";
import { BarChart } from "@/components/charts/BarChart";
import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Clock, DollarSign, MessageSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

interface ProjectStats {
  name: string;
  path: string;
  sessions: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: number;
  lastSession: string;
}

function buildProjectStats(data: { recentSessions: Array<{ projectPath: string; inputTokens: number; outputTokens: number; estimatedCostUSD: number; durationMinutes: number; startTime: string }> }): ProjectStats[] {
  const map = new Map<string, ProjectStats>();
  for (const s of data.recentSessions) {
    const name = s.projectPath.split(/[/\\]/).pop() ?? s.projectPath;
    const existing = map.get(s.projectPath) ?? {
      name,
      path: s.projectPath,
      sessions: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      duration: 0,
      lastSession: s.startTime,
    };
    existing.sessions += 1;
    existing.inputTokens += s.inputTokens;
    existing.outputTokens += s.outputTokens;
    existing.cost += s.estimatedCostUSD;
    existing.duration += s.durationMinutes;
    if (s.startTime > existing.lastSession) existing.lastSession = s.startTime;
    map.set(s.projectPath, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions);
}

export default function ProjectsPage() {
  const { data, isLoading, isError, error } = useClaudeUsage();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#ef4444]">
        Failed to load project data: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const projectStats = buildProjectStats(data);
  const totalProjects = projectStats.length;
  const totalSessions = projectStats.reduce((sum, p) => sum + p.sessions, 0);
  const totalCost = projectStats.reduce((sum, p) => sum + p.cost, 0);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#faff69] text-lg">›</span>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-[#ffffff]">
            Project Stats
          </h1>
        </div>
        <p className="text-[13px] text-[#888888] pl-7">
          {totalProjects} projects • {totalSessions} total sessions
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Projects" value={totalProjects} icon={FolderOpen} />
        <MetricCard label="Total Sessions" value={totalSessions} icon={MessageSquare} />
        <MetricCard label="Total Cost" value={`$${totalCost.toFixed(2)}`} icon={DollarSign} />
        <MetricCard label="Avg Sessions/Project" value={(totalSessions / totalProjects).toFixed(1)} icon={Clock} />
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Sessions per Project
        </h3>
        <BarChart
          data={projectStats.slice(0, 10).map((p) => ({
            name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name,
            value: p.sessions,
          }))}
          height={300}
        />
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Project Details
        </h3>
        <div className="space-y-3">
          {projectStats.map((project) => (
            <div
              key={project.path}
              className="flex items-center justify-between rounded-lg bg-[#121212] border border-[#2a2a2a] px-4 py-3 hover:border-[#faff69]/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#ffffff] truncate">{project.name}</p>
                <p className="text-xs text-[#888888]">{project.sessions} sessions</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-[#faff69] font-semibold">{project.inputTokens.toLocaleString()}</p>
                  <p className="text-[10px] text-[#888888] uppercase">input</p>
                </div>
                <div className="text-right">
                  <p className="text-[#3b82f6] font-semibold">{project.outputTokens.toLocaleString()}</p>
                  <p className="text-[10px] text-[#888888] uppercase">output</p>
                </div>
                <div className="text-right">
                  <p className="text-[#22c55e] font-semibold">${project.cost.toFixed(4)}</p>
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