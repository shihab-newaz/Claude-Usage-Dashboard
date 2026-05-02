export interface ParsedSession {
  id: string;
  projectPath: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  userMessageCount: number;
  assistantMessageCount: number;
  toolCounts: Record<string, number>;
  linesAdded: number;
  linesRemoved: number;
  filesModified: number;
  usesTaskAgent: boolean;
  usesMcp: boolean;
}