import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { syncAllSessions } from "@/lib/db/sync";
import { estimateCost } from "@/lib/cost";
import type {
  UsageSummary,
  TimeSeriesPoint,
  ToolUsageEntry,
  LanguageEntry,
  ModelUsageEntry,
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

    // Model breakdown — aggregate token usage and message count per model
    const modelRows = db.prepare(`
      SELECT
        model,
        SUM(input_tokens)    AS inputTokens,
        SUM(output_tokens)  AS outputTokens,
        SUM(message_count)  AS messageCount
      FROM session_models
      GROUP BY model
      ORDER BY inputTokens DESC
    `).all() as Array<{ model: string; inputTokens: number; outputTokens: number; messageCount: number }>;
    const modelBreakdown: ModelUsageEntry[] = modelRows.map((r) => ({
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      messageCount: r.messageCount,
      estimatedCostUSD: estimateCost(r.inputTokens, r.outputTokens),
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

    const sessionIds = recentRows.map((r) => r.id as string);

    // Batch-fetch top-5 tools per session — single query instead of N per-session queries
    const toolsStmt = db.prepare(`
      SELECT session_id, tool_name AS tool, call_count AS count
      FROM (
        SELECT session_id, tool_name, call_count,
               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY call_count DESC) AS rn
        FROM session_tools
        WHERE session_id IN (${sessionIds.map(() => "?").join(",")})
      )
      WHERE rn <= 5
      ORDER BY session_id, count DESC
    `);
    const toolsBySession = new Map<string, ToolUsageEntry[]>();
    for (const row of toolsStmt.all(...sessionIds) as Array<{ session_id: string; tool: string; count: number }>) {
      const arr = toolsBySession.get(row.session_id) ?? [];
      arr.push({ tool: row.tool, count: row.count });
      toolsBySession.set(row.session_id, arr);
    }

    // Batch-fetch top-5 languages per session — single query instead of N per-session queries
    const langsStmt = db.prepare(`
      SELECT session_id, language, file_count AS count
      FROM (
        SELECT session_id, language, file_count,
               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY file_count DESC) AS rn
        FROM session_languages
        WHERE session_id IN (${sessionIds.map(() => "?").join(",")})
      )
      WHERE rn <= 5
      ORDER BY session_id, count DESC
    `);
    const langsBySession = new Map<string, LanguageEntry[]>();
    for (const row of langsStmt.all(...sessionIds) as Array<{ session_id: string; language: string; count: number }>) {
      const arr = langsBySession.get(row.session_id) ?? [];
      arr.push({ language: row.language, count: row.count });
      langsBySession.set(row.session_id, arr);
    }

    const recentSessions: SessionSummary[] = recentRows.map((row) => {
      const sessionId = row.id as string;
      const inputTokens = row.input_tokens as number;
      const outputTokens = row.output_tokens as number;

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
        topTools: toolsBySession.get(sessionId) ?? [],
        topLanguages: langsBySession.get(sessionId) ?? [],
      };
    });

    const response: ClaudeUsageResponse = {
      summary,
      timeSeries,
      toolBreakdown,
      languageBreakdown,
      modelBreakdown,
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