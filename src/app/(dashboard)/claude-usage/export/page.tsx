"use client";

import { useState } from "react";
import { useClaudeUsage } from "@/hooks/useClaudeUsage";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

export default function ExportPage() {
  const { data, isLoading, isError, error } = useClaudeUsage();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-usage-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("JSON exported successfully");
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleExportCSV = () => {
    if (!data) return;

    const headers = ["Session ID", "Project", "Start Time", "Duration (min)", "Input Tokens", "Output Tokens", "Cost USD", "Tool Count", "User Messages", "Assistant Messages"];

    const rows = data.recentSessions.map((s) => [
      s.sessionId,
      `"${s.projectPath}"`,
      s.startTime,
      s.durationMinutes.toFixed(2),
      s.inputTokens,
      s.outputTokens,
      s.estimatedCostUSD.toFixed(4),
      s.toolCount,
      0, // not available
      0, // not available
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-sessions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("CSV exported successfully");
    setTimeout(() => setExportStatus(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="border-b border-[#2a2a2a] pb-6">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#ef4444]">
        Failed to load data: {String(error)}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[#faff69] text-lg">›</span>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-[#ffffff]">
            Export Data
          </h1>
        </div>
        <p className="text-[13px] text-[#888888] pl-7">
          Download your Claude Code usage data for external analysis
        </p>
      </div>

      {exportStatus && (
        <div className="rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 px-4 py-3 text-sm text-[#22c55e]">
          {exportStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#faff69] mb-6">
            <FileJson className="h-8 w-8 text-[#0a0a0a]" />
          </div>
          <h3 className="text-lg font-semibold text-[#ffffff] mb-2">Export JSON</h3>
          <p className="text-sm text-[#888888] mb-6 max-w-xs">
            Full usage data including summary, time series, tool breakdown, and all session details in JSON format
          </p>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-lg bg-[#faff69] px-6 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#e6eb52] transition-colors"
          >
            <Download className="h-4 w-4" />
            Download JSON
          </button>
        </div>

        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#3b82f6] mb-6">
            <FileSpreadsheet className="h-8 w-8 text-[#ffffff]" />
          </div>
          <h3 className="text-lg font-semibold text-[#ffffff] mb-2">Export CSV</h3>
          <p className="text-sm text-[#888888] mb-6 max-w-xs">
            Session-level data in CSV format for spreadsheet analysis and external tools
          </p>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-[#ffffff] hover:bg-[#2563eb] transition-colors"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Export Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Total Sessions</p>
            <p className="text-xl font-bold text-[#faff69]">{data.summary.totalSessions}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Input Tokens</p>
            <p className="text-xl font-bold text-[#faff69]">{data.summary.totalInputTokens.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Output Tokens</p>
            <p className="text-xl font-bold text-[#faff69]">{data.summary.totalOutputTokens.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium uppercase tracking-wider text-[#888888]">Est. Cost</p>
            <p className="text-xl font-bold text-[#faff69]">${data.summary.estimatedCostUSD.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}