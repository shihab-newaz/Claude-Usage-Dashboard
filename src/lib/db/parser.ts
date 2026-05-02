import * as fs from "fs";
import * as path from "path";
import type { ParsedSession } from "@/lib/types/db";

interface JsonEntry {
  type: string;
  sessionId?: string;
  cwd?: string;
  timestamp?: string;
  message?: {
    role?: string;
    model?: string;
    content?: Array<Record<string, unknown>>;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
}

// Extracts file extension from Write/Edit tool inputs for language detection.
// Returns e.g. "ts" for "src/app/page.tsx" — empty string if no valid extension.
function extractLanguages(toolName: string, input: Record<string, unknown>): Record<string, number> {
  const langs: Record<string, number> = {};
  if (toolName === "Write" || toolName === "Edit") {
    const filePath = (input.file_path as string) ?? (input.target as string) ?? "";
    const ext = path.extname(filePath).replace(/^\./, "").toLowerCase();
    if (ext) langs[ext] = 1;
  }
  return langs;
}

// Parses a single transcript .jsonl file and returns aggregated session stats.
// Returns null if the file is empty or unreadable.
// Expected format: one JSON object per line, with types "assistant", "user", etc.
export function parseJsonlFile(filePath: string): ParsedSession | null {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const lines = content.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return null;

  // Session id is the filename without extension (e.g. "5d9079c8-cbea-491f-9417-f608612b8e9a")
  const sessionId = path.basename(filePath, ".jsonl");
  const projectPath = path.dirname(filePath);

  let startTime: string | null = null;
  let endTime: string | null = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadInputTokens = 0;
  let cacheCreationInputTokens = 0;
  let userMessageCount = 0;
  let assistantMessageCount = 0;
  const toolCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};
  // Track per-model token usage and message count per session
  const modelCounts: Record<string, { inputTokens: number; outputTokens: number; messageCount: number }> = {};
  let usesTaskAgent = false;
  let usesMcp = false;
  let firstTimestampMs = 0;
  let lastTimestampMs = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as JsonEntry;
      const type = entry.type;
      const timestamp = entry.timestamp;

      if (type === "assistant") {
        assistantMessageCount++;
        const msg = entry.message;
        // Capture model from the assistant message for model usage tracking
        const model = msg?.model;
        if (model) {
          const existing = modelCounts[model] ?? { inputTokens: 0, outputTokens: 0, messageCount: 0 };
          modelCounts[model] = {
            inputTokens: existing.inputTokens + (msg.usage?.input_tokens ?? 0),
            outputTokens: existing.outputTokens + (msg.usage?.output_tokens ?? 0),
            messageCount: existing.messageCount + 1,
          };
        }
        // Accumulate token usage from each assistant turn
        if (msg?.usage) {
          inputTokens += msg.usage.input_tokens ?? 0;
          outputTokens += msg.usage.output_tokens ?? 0;
          cacheReadInputTokens += msg.usage.cache_read_input_tokens ?? 0;
          cacheCreationInputTokens += msg.usage.cache_creation_input_tokens ?? 0;
        }
        // Count tool_use blocks and detect languages from Write/Edit file paths
        const content = msg?.content;
        if (Array.isArray(content)) {
          for (const item of content) {
            if (item?.type === "tool_use") {
              const name = (item.name as string) ?? "unknown";
              toolCounts[name] = (toolCounts[name] ?? 0) + 1;
              const input = (item.input as Record<string, unknown>) ?? {};
              const langs = extractLanguages(name, input);
              for (const [lang] of Object.entries(langs)) {
                languageCounts[lang] = (languageCounts[lang] ?? 0) + 1;
              }
            }
          }
        }
      } else if (type === "user") {
        userMessageCount++;
      }

      // Track first and last timestamps to compute session duration
      if (timestamp) {
        const ms = new Date(timestamp).getTime();
        if (!startTime || ms < firstTimestampMs) {
          startTime = timestamp;
          firstTimestampMs = ms;
        }
        if (!endTime || ms > lastTimestampMs) {
          endTime = timestamp;
          lastTimestampMs = ms;
        }
      }
    } catch {
      // Skip corrupt lines — a single bad line shouldn't fail the whole parse
    }
  }

  if (!startTime) return null;

  const durationMinutes = endTime ? (lastTimestampMs - firstTimestampMs) / 60000 : 0;

  return {
    id: sessionId,
    projectPath,
    startTime,
    endTime,
    durationMinutes,
    inputTokens,
    outputTokens,
    cacheReadInputTokens,
    cacheCreationInputTokens,
    userMessageCount,
    assistantMessageCount,
    toolCounts,
    linesAdded: 0,
    linesRemoved: 0,
    filesModified: 0,
    usesTaskAgent,
    usesMcp,
    modelCounts,
  };
}

// Recursively finds all .jsonl files under a directory (depth-first).
export function getJsonlFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getJsonlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      results.push(fullPath);
    }
  }
  return results;
}