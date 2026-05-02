"use client";

import { useClaudeUsage } from "@/hooks/useClaudeUsage";
import { MetricCard } from "@/components/common/MetricCard";
import { AreaChart } from "@/components/charts/AreaChart";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { SessionsTable } from "@/components/common/SessionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUSD } from "@/lib/cost";
import { format } from "date-fns";
import {
  MessageSquare,
  Zap,
  TrendingUp,
  Clock,
  Code,
  DollarSign,
  FileEdit,
} from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function ClaudeUsagePage() {
  const { data, isLoading, isError, error } = useClaudeUsage();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        Failed to load usage data: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  const { summary, timeSeries, toolBreakdown, languageBreakdown, recentSessions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Claude Code Usage</h1>
        <p className="text-muted-foreground">
          Aggregated from {summary.totalSessions} sessions &mdash; last updated{" "}
          {format(new Date(data.generatedAt), "MMM d, yyyy HH:mm:ss")}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Sessions" value={summary.totalSessions} icon={MessageSquare} />
        <MetricCard
          label="Total Input Tokens"
          value={summary.totalInputTokens.toLocaleString()}
          icon={Zap}
        />
        <MetricCard
          label="Total Output Tokens"
          value={summary.totalOutputTokens.toLocaleString()}
          icon={TrendingUp}
        />
        <MetricCard
          label="Estimated Cost"
          value={formatUSD(summary.estimatedCostUSD)}
          icon={DollarSign}
        />
        <MetricCard
          label="Lines Added"
          value={summary.totalLinesAdded.toLocaleString()}
          icon={FileEdit}
        />
        <MetricCard
          label="Lines Removed"
          value={summary.totalLinesRemoved.toLocaleString()}
          icon={FileEdit}
        />
        <MetricCard
          label="Files Modified"
          value={summary.totalFilesModified.toLocaleString()}
          icon={Code}
        />
        <MetricCard
          label="Total Duration"
          value={`${Math.round(summary.totalDurationMinutes)}m`}
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="tokens">
        <TabsList>
          <TabsTrigger value="tokens">Token Usage Over Time</TabsTrigger>
          <TabsTrigger value="tools">Tool Breakdown</TabsTrigger>
          <TabsTrigger value="languages">Language Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Token Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={timeSeries}
                xAxisKey="date"
                series={[
                  { key: "inputTokens", color: "#6366f1", label: "Input Tokens" },
                  { key: "outputTokens", color: "#10b981", label: "Output Tokens" },
                  { key: "cacheReadTokens", color: "#f59e0b", label: "Cache Read" },
                ]}
                height={320}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Tool Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart
                data={toolBreakdown.map((t) => ({ name: t.tool, value: t.count }))}
                height={320}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle>Language Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={languageBreakdown.slice(0, 15).map((l) => ({
                  name: l.language,
                  value: l.count,
                }))}
                height={320}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionsTable sessions={recentSessions} />
        </CardContent>
      </Card>
    </div>
  );
}
