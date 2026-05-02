import { NextResponse } from "next/server";
import { readAllSessionMeta } from "@/lib/session-meta";
import { estimateCost } from "@/lib/cost";
import type {
  UsageSummary,
  TimeSeriesPoint,
  ToolUsageEntry,
  LanguageEntry,
  SessionSummary,
  ClaudeUsageResponse,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = readAllSessionMeta();

    // Summary aggregation
    const summary: UsageSummary = {
      totalSessions: sessions.length,
      totalInputTokens: sessions.reduce((s, x) => s + x.input_tokens, 0),
      totalOutputTokens: sessions.reduce((s, x) => s + x.output_tokens, 0),
      totalCacheReadTokens: sessions.reduce((s, x) => s + (x.cache_read_input_tokens ?? 0), 0),
      totalCacheCreationTokens: sessions.reduce((s, x) => s + (x.cache_creation_input_tokens ?? 0), 0),
      estimatedCostUSD: sessions.reduce(
        (s, x) => s + estimateCost(x.input_tokens, x.output_tokens),
        0
      ),
      totalLinesAdded: sessions.reduce((s, x) => s + x.lines_added, 0),
      totalLinesRemoved: sessions.reduce((s, x) => s + x.lines_removed, 0),
      totalFilesModified: sessions.reduce((s, x) => s + x.files_modified, 0),
      totalDurationMinutes: sessions.reduce((s, x) => s + x.duration_minutes, 0),
      totalUserMessages: sessions.reduce((s, x) => s + x.user_message_count, 0),
      totalAssistantMessages: sessions.reduce((s, x) => s + x.assistant_message_count, 0),
      usesTaskAgent: sessions.some((x) => x.uses_task_agent),
      usesMcp: sessions.some((x) => x.uses_mcp),
    };

    // Tool breakdown
    const toolMap = new Map<string, number>();
    for (const s of sessions) {
      for (const [tool, count] of Object.entries(s.tool_counts)) {
        toolMap.set(tool, (toolMap.get(tool) ?? 0) + count);
      }
    }
    const toolBreakdown: ToolUsageEntry[] = Array.from(toolMap.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count);

    // Language breakdown
    const langMap = new Map<string, number>();
    for (const s of sessions) {
      for (const [lang, count] of Object.entries(s.languages)) {
        langMap.set(lang, (langMap.get(lang) ?? 0) + count);
      }
    }
    const languageBreakdown: LanguageEntry[] = Array.from(langMap.entries())
      .map(([lang, count]) => ({ language: lang, count }))
      .sort((a, b) => b.count - a.count);

    // Time series (daily buckets)
    const dailyMap = new Map<string, TimeSeriesPoint>();
    for (const s of sessions) {
      const date = s.start_time.split("T")[0];
      const existing = dailyMap.get(date) ?? {
        date,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        sessions: 0,
      };
      dailyMap.set(date, {
        ...existing,
        inputTokens: existing.inputTokens + s.input_tokens,
        outputTokens: existing.outputTokens + s.output_tokens,
        cacheReadTokens: existing.cacheReadTokens + (s.cache_read_input_tokens ?? 0),
        sessions: existing.sessions + 1,
      });
    }
    const timeSeries: TimeSeriesPoint[] = Array.from(dailyMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    // Recent sessions (last 10, enriched)
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
    const recentSessions: SessionSummary[] = sortedSessions.slice(0, 10).map((s) => {
      const topTools: ToolUsageEntry[] = Object.entries(s.tool_counts)
        .map(([tool, count]) => ({ tool, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const topLanguages: LanguageEntry[] = Object.entries(s.languages)
        .map(([lang, count]) => ({ language: lang, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      return {
        sessionId: s.session_id,
        projectPath: s.project_path,
        startTime: s.start_time,
        durationMinutes: s.duration_minutes,
        inputTokens: s.input_tokens,
        outputTokens: s.output_tokens,
        estimatedCostUSD: estimateCost(s.input_tokens, s.output_tokens),
        linesAdded: s.lines_added,
        linesRemoved: s.lines_removed,
        filesModified: s.files_modified,
        toolCount: Object.keys(s.tool_counts).length,
        topTools,
        topLanguages,
      };
    });

    const response: ClaudeUsageResponse = {
      summary,
      timeSeries,
      toolBreakdown,
      languageBreakdown,
      recentSessions,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[claude-usage] Failed to read transcript data:", err);
    return NextResponse.json(
      { error: "Failed to read usage data", detail: String(err) },
      { status: 500 }
    );
  }
}
