import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { syncAllSessions } from "@/lib/db/sync";
import { estimateCost } from "@/lib/cost";
import type {
  UsageSummary,
  TimeSeriesPoint,
  ToolUsageEntry,
  LanguageEntry,
  SessionSummary,
  ClaudeUsageResponse,
} from "@/lib/types";

// Always render fresh — never cache session data
export const dynamic = "force-dynamic";

// Throttle sync to once per minute to avoid re-parsing JSONL on every request
let _lastSync = 0;
const SYNC_INTERVAL = 60_000;

function ensureSynced() {
  const now = Date.now();
  if (now - _lastSync > SYNC_INTERVAL) {
    syncAllSessions();
    _lastSync = now;
  }
}

export async function GET() {
  try {
    ensureSynced();
    const db = getDb();

    // Aggregate totals across all sessions — COALESCE prevents NULL on empty table
    const summaryRow = db.prepare(`
      SELECT
        COUNT(*)                                    AS totalSessions,
        COALESCE(SUM(input_tokens), 0)             AS totalInputTokens,
        COALESCE(SUM(output_tokens), 0)            AS totalOutputTokens,
        COALESCE(SUM(cache_read_input_tokens), 0)  AS totalCacheReadTokens,
        COALESCE(SUM(cache_creation_input_tokens), 0) AS totalCacheCreationTokens,
        COALESCE(SUM(user_message_count), 0)        AS totalUserMessages,
        COALESCE(SUM(assistant_message_count), 0)  AS totalAssistantMessages,
        COALESCE(SUM(duration_minutes), 0)         AS totalDurationMinutes,
        MAX(uses_task_agent)                       AS usesTaskAgent,
        MAX(uses_mcp)                              AS usesMcp
      FROM sessions
    `).get() as Record<string, unknown>;

    // Cost formula: input ~$1.25/M tokens, output ~$5/M tokens (Anthropic Claude pricing)
    const costRow = db.prepare(`
      SELECT SUM(
        (input_tokens / 1000.0 * 0.00125) + (output_tokens / 1000.0 * 0.005)
      ) AS estimatedCostUSD FROM sessions
    `).get() as { estimatedCostUSD: number } | undefined;

    const summary: UsageSummary = {
      totalSessions: summaryRow.totalSessions as number,
      totalInputTokens: summaryRow.totalInputTokens as number,
      totalOutputTokens: summaryRow.totalOutputTokens as number,
      totalCacheReadTokens: summaryRow.totalCacheReadTokens as number,
      totalCacheCreationTokens: summaryRow.totalCacheCreationTokens as number,
      estimatedCostUSD: costRow?.estimatedCostUSD ?? 0,
      totalLinesAdded: 0,
      totalLinesRemoved: 0,
      totalFilesModified: 0,
      totalDurationMinutes: summaryRow.totalDurationMinutes as number,
      totalUserMessages: summaryRow.totalUserMessages as number,
      totalAssistantMessages: summaryRow.totalAssistantMessages as number,
      usesTaskAgent: !!summaryRow.usesTaskAgent,
      usesMcp: !!summaryRow.usesMcp,
    };

    // Daily time series — buckets sessions by calendar date for trend charts
    const timeSeriesRows = db.prepare(`
      SELECT
        DATE(start_time) AS date,
        SUM(input_tokens)             AS inputTokens,
        SUM(output_tokens)            AS outputTokens,
        SUM(cache_read_input_tokens)  AS cacheReadTokens,
        COUNT(*)                      AS sessions
      FROM sessions
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `).all() as Array<{
      date: string;
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      sessions: number;
    }>;
    const timeSeries: TimeSeriesPoint[] = timeSeriesRows.map((r) => ({
      date: r.date,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cacheReadTokens: r.cacheReadTokens,
      sessions: r.sessions,
    }));

    // Tool breakdown — sum call_count across all sessions per tool
    const toolRows = db.prepare(`
      SELECT tool_name AS tool, SUM(call_count) AS count
      FROM session_tools
      GROUP BY tool_name
      ORDER BY count DESC
    `).all() as Array<{ tool: string; count: number }>;
    const toolBreakdown: ToolUsageEntry[] = toolRows.map((r) => ({
      tool: r.tool,
      count: r.count,
    }));

    // Language breakdown — from file extensions in Write/Edit tool calls
    const langRows = db.prepare(`
      SELECT language, SUM(file_count) AS count
      FROM session_languages
      GROUP BY language
      ORDER BY count DESC
    `).all() as Array<{ language: string; count: number }>;
    const languageBreakdown: LanguageEntry[] = langRows.map((r) => ({
      language: r.language,
      count: r.count,
    }));

    // Recent sessions — last 10, with per-session top 5 tools/languages joined separately
    const recentRows = db.prepare(`
      SELECT id, project_path, start_time, duration_minutes,
             input_tokens, output_tokens, user_message_count,
             assistant_message_count, tool_count, uses_task_agent, uses_mcp
      FROM sessions
      ORDER BY start_time DESC
      LIMIT 10
    `).all() as Array<Record<string, unknown>>;

    const recentSessions: SessionSummary[] = recentRows.map((row) => {
      const sessionId = row.id as string;
      const inputTokens = row.input_tokens as number;
      const outputTokens = row.output_tokens as number;

      const sessionTools = db.prepare(`
        SELECT tool_name AS tool, call_count AS count
        FROM session_tools
        WHERE session_id = ?
        ORDER BY count DESC
        LIMIT 5
      `).all(sessionId) as Array<{ tool: string; count: number }>;

      const sessionLangs = db.prepare(`
        SELECT language, file_count AS count
        FROM session_languages
        WHERE session_id = ?
        ORDER BY count DESC
        LIMIT 5
      `).all(sessionId) as Array<{ language: string; count: number }>;

      return {
        sessionId,
        projectPath: row.project_path as string,
        startTime: row.start_time as string,
        durationMinutes: row.duration_minutes as number,
        inputTokens,
        outputTokens,
        estimatedCostUSD: estimateCost(inputTokens, outputTokens),
        linesAdded: 0,
        linesRemoved: 0,
        filesModified: 0,
        toolCount: row.tool_count as number,
        topTools: sessionTools.map((t) => ({ tool: t.tool, count: t.count })),
        topLanguages: sessionLangs.map((l) => ({ language: l.language, count: l.count })),
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
    console.error("[claude-usage] DB query failed:", err);
    return NextResponse.json(
      { error: "Failed to read usage data", detail: String(err) },
      { status: 500 },
    );
  }
}