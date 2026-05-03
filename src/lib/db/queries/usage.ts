import type Database from "better-sqlite3";
import { estimateCost } from "@/lib/cost";
import type {
  LanguageEntry,
  ModelUsageEntry,
  SessionSummary,
  TimeSeriesPoint,
  ToolUsageEntry,
  UsageSummary,
} from "@/lib/types";

function buildDateFilter(dateFrom?: string, dateTo?: string): { clause: string; params: string[] } {
  if (dateFrom && dateTo) return { clause: "WHERE start_time >= ? AND start_time <= ?", params: [dateFrom, dateTo + "T23:59:59.999Z"] };
  if (dateFrom) return { clause: "WHERE start_time >= ?", params: [dateFrom] };
  if (dateTo) return { clause: "WHERE start_time <= ?", params: [dateTo + "T23:59:59.999Z"] };
  return { clause: "", params: [] };
}

export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

export function getUsageSummary(db: Database.Database, filter: DateRangeFilter = {}): UsageSummary {
  const { clause, params } = buildDateFilter(filter.dateFrom, filter.dateTo);
  const row = db.prepare(`
    SELECT
      COUNT(*)                                      AS totalSessions,
      COALESCE(SUM(input_tokens), 0)               AS totalInputTokens,
      COALESCE(SUM(output_tokens), 0)              AS totalOutputTokens,
      COALESCE(SUM(cache_read_input_tokens), 0)    AS totalCacheReadTokens,
      COALESCE(SUM(cache_creation_input_tokens), 0) AS totalCacheCreationTokens,
      COALESCE(SUM(user_message_count), 0)         AS totalUserMessages,
      COALESCE(SUM(assistant_message_count), 0)    AS totalAssistantMessages,
      COALESCE(SUM(duration_minutes), 0)           AS totalDurationMinutes,
      COALESCE(SUM(lines_added), 0)                AS totalLinesAdded,
      COALESCE(SUM(lines_removed), 0)            AS totalLinesRemoved,
      COALESCE(SUM(files_modified), 0)             AS totalFilesModified,
      MAX(uses_task_agent)                         AS usesTaskAgent,
      MAX(uses_mcp)                                AS usesMcp
    FROM sessions
    ${clause}
  `).get(...params) as Record<string, unknown>;

  const totalInputTokens = row.totalInputTokens as number;
  const totalOutputTokens = row.totalOutputTokens as number;

  return {
    totalSessions: row.totalSessions as number,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens: row.totalCacheReadTokens as number,
    totalCacheCreationTokens: row.totalCacheCreationTokens as number,
    estimatedCostUSD: estimateCost(totalInputTokens, totalOutputTokens),
    totalLinesAdded: row.totalLinesAdded as number,
    totalLinesRemoved: row.totalLinesRemoved as number,
    totalFilesModified: row.totalFilesModified as number,
    totalDurationMinutes: row.totalDurationMinutes as number,
    totalUserMessages: row.totalUserMessages as number,
    totalAssistantMessages: row.totalAssistantMessages as number,
    usesTaskAgent: !!row.usesTaskAgent,
    usesMcp: !!row.usesMcp,
  };
}

export function getUsageTimeSeries(db: Database.Database, filter: DateRangeFilter = {}): TimeSeriesPoint[] {
  const { clause, params } = buildDateFilter(filter.dateFrom, filter.dateTo);
  const rows = db.prepare(`
    SELECT
      DATE(start_time) AS date,
      SUM(input_tokens)            AS inputTokens,
      SUM(output_tokens)           AS outputTokens,
      SUM(cache_read_input_tokens) AS cacheReadTokens,
      COUNT(*)                     AS sessions
    FROM sessions
    ${clause}
    GROUP BY DATE(start_time)
    ORDER BY date ASC
  `).all(...params) as Array<{
    date: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    sessions: number;
  }>;

  return rows.map((row) => ({
    date: row.date,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    cacheReadTokens: row.cacheReadTokens,
    sessions: row.sessions,
  }));
}

export function getToolBreakdown(db: Database.Database, filter: DateRangeFilter = {}): ToolUsageEntry[] {
  const { clause, params } = buildDateFilter(filter.dateFrom, filter.dateTo);
  const rows = db.prepare(`
    SELECT tool_name AS tool, SUM(st.call_count) AS count
    FROM session_tools st
    WHERE st.session_id IN (SELECT id FROM sessions ${clause})
    GROUP BY tool_name
    ORDER BY count DESC
  `).all(...params) as Array<{ tool: string; count: number }>;

  return rows.map((row) => ({ tool: row.tool, count: row.count }));
}

export function getLanguageBreakdown(db: Database.Database, filter: DateRangeFilter = {}): LanguageEntry[] {
  const { clause, params } = buildDateFilter(filter.dateFrom, filter.dateTo);
  const rows = db.prepare(`
    SELECT language, SUM(sl.file_count) AS count
    FROM session_languages sl
    WHERE sl.session_id IN (SELECT id FROM sessions ${clause})
    GROUP BY language
    ORDER BY count DESC
  `).all(...params) as Array<{ language: string; count: number }>;

  return rows.map((row) => ({ language: row.language, count: row.count }));
}

export function getModelBreakdown(db: Database.Database, filter: DateRangeFilter = {}): ModelUsageEntry[] {
  const { clause, params } = buildDateFilter(filter.dateFrom, filter.dateTo);
  const rows = db.prepare(`
    SELECT
      model,
      SUM(sm.input_tokens)   AS inputTokens,
      SUM(sm.output_tokens)  AS outputTokens,
      SUM(sm.message_count)  AS messageCount
    FROM session_models sm
    WHERE sm.session_id IN (SELECT id FROM sessions ${clause})
    GROUP BY model
    ORDER BY inputTokens DESC
  `).all(...params) as Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
    messageCount: number;
  }>;

  return rows.map((row) => ({
    model: row.model,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    messageCount: row.messageCount,
    estimatedCostUSD: estimateCost(row.inputTokens, row.outputTokens),
  }));
}

export function getRecentSessions(db: Database.Database, limit = 10, filter: DateRangeFilter = {}): SessionSummary[] {
  const { clause, params } = buildDateFilter(filter.dateFrom, filter.dateTo);
  const rows = db.prepare(`
    SELECT id, project_path, start_time, duration_minutes,
           input_tokens, output_tokens, lines_added, lines_removed,
           files_modified, tool_count
    FROM sessions
    ${clause}
    ORDER BY start_time DESC
    LIMIT ?
  `).all(...params, limit) as Array<Record<string, unknown>>;

  if (rows.length === 0) return [];

  const sessionIds = rows.map((row) => row.id as string);
  const placeholders = sessionIds.map(() => "?").join(",");

  const toolsBySession = new Map<string, ToolUsageEntry[]>();
  const toolRows = db.prepare(`
    SELECT session_id, tool_name AS tool, call_count AS count
    FROM (
      SELECT session_id, tool_name, call_count,
             ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY call_count DESC) AS rn
      FROM session_tools
      WHERE session_id IN (${placeholders})
    )
    WHERE rn <= 5
    ORDER BY session_id, count DESC
  `).all(...sessionIds) as Array<{ session_id: string; tool: string; count: number }>;

  for (const row of toolRows) {
    const tools = toolsBySession.get(row.session_id) ?? [];
    tools.push({ tool: row.tool, count: row.count });
    toolsBySession.set(row.session_id, tools);
  }

  const languagesBySession = new Map<string, LanguageEntry[]>();
  const languageRows = db.prepare(`
    SELECT session_id, language, file_count AS count
    FROM (
      SELECT session_id, language, file_count,
             ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY file_count DESC) AS rn
      FROM session_languages
      WHERE session_id IN (${placeholders})
    )
    WHERE rn <= 5
    ORDER BY session_id, count DESC
  `).all(...sessionIds) as Array<{ session_id: string; language: string; count: number }>;

  for (const row of languageRows) {
    const languages = languagesBySession.get(row.session_id) ?? [];
    languages.push({ language: row.language, count: row.count });
    languagesBySession.set(row.session_id, languages);
  }

  return rows.map((row) => {
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
      linesAdded: row.lines_added as number,
      linesRemoved: row.lines_removed as number,
      filesModified: row.files_modified as number,
      toolCount: row.tool_count as number,
      topTools: toolsBySession.get(sessionId) ?? [],
      topLanguages: languagesBySession.get(sessionId) ?? [],
    };
  });
}