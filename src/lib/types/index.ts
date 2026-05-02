import type { SourceSessionMeta } from "./source";

export type { SourceSessionMeta } from "./source";
export type { SourceSessionFacet } from "./source";

/** Aggregated totals across all sessions */
export interface UsageSummary {
  totalSessions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
  estimatedCostUSD: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  totalFilesModified: number;
  totalDurationMinutes: number;
  totalUserMessages: number;
  totalAssistantMessages: number;
  usesTaskAgent: boolean;
  usesMcp: boolean;
}

/** Single data point for time-series charts */
export interface TimeSeriesPoint {
  date: string; // "YYYY-MM-DD"
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  sessions: number;
}

/** Tool usage breakdown entry */
export interface ToolUsageEntry {
  tool: string;
  count: number;
}

/** Language breakdown entry */
export interface LanguageEntry {
  language: string;
  count: number;
}

/** Model usage breakdown entry */
export interface ModelUsageEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  messageCount: number;
  estimatedCostUSD: number;
}

/** Session-level summary for the table */
export interface SessionSummary {
  sessionId: string;
  projectPath: string;
  startTime: string; // ISO 8601
  durationMinutes: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUSD: number;
  linesAdded: number;
  linesRemoved: number;
  filesModified: number;
  toolCount: number;
  topTools: ToolUsageEntry[];
  topLanguages: LanguageEntry[];
}

/** Full API response from GET /api/claude-usage */
export interface ClaudeUsageResponse {
  summary: UsageSummary;
  timeSeries: TimeSeriesPoint[];
  toolBreakdown: ToolUsageEntry[];
  languageBreakdown: LanguageEntry[];
  modelBreakdown: ModelUsageEntry[];
  recentSessions: SessionSummary[];
  generatedAt: string; // ISO 8601
}
