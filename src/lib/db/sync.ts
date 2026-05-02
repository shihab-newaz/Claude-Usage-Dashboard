import * as path from "path";
import { getDb } from "./index";
import { parseJsonlFile, getJsonlFiles } from "./parser";
import { CLAUDE_BASE_DIR } from "../paths";

// Scans all ~/.claude/projects/*/.jsonl files, parses them, and upserts into the DB.
// Idempotent — ON CONFLICT DO UPDATE means re-parsing a session replaces its data.
export function syncAllSessions(): void {
  const db = getDb();
  const projectsDir = path.join(CLAUDE_BASE_DIR, "projects");
  const jsonlFiles = getJsonlFiles(projectsDir);

  // Upsert session row — replaces all fields on conflict using the session id as key
  const upsertSession = db.prepare(`
    INSERT INTO sessions (id, project_path, start_time, end_time, duration_minutes,
      input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens,
      user_message_count, assistant_message_count, tool_count,
      uses_task_agent, uses_mcp, lines_added, lines_removed, files_modified, last_parsed_at)
    VALUES (@id, @projectPath, @startTime, @endTime, @durationMinutes,
      @inputTokens, @outputTokens, @cacheReadInputTokens, @cacheCreationInputTokens,
      @userMessageCount, @assistantMessageCount, @toolCount,
      @usesTaskAgent, @usesMcp, 0, 0, 0, @lastParsedAt)
    ON CONFLICT(id) DO UPDATE SET
      project_path = excluded.project_path,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      duration_minutes = excluded.duration_minutes,
      input_tokens = excluded.input_tokens,
      output_tokens = excluded.output_tokens,
      cache_read_input_tokens = excluded.cache_read_input_tokens,
      cache_creation_input_tokens = excluded.cache_creation_input_tokens,
      user_message_count = excluded.user_message_count,
      assistant_message_count = excluded.assistant_message_count,
      tool_count = excluded.tool_count,
      uses_task_agent = excluded.uses_task_agent,
      uses_mcp = excluded.uses_mcp,
      last_parsed_at = excluded.last_parsed_at
  `);

  // Per-session tool call counts — upserted after deleting existing rows for this session
  const upsertTool = db.prepare(`
    INSERT INTO session_tools (session_id, tool_name, call_count)
    VALUES (@sessionId, @toolName, @callCount)
    ON CONFLICT(session_id, tool_name) DO UPDATE SET call_count = excluded.call_count
  `);

  // Per-session language file counts — derived from Write/Edit tool file_path extensions
  const upsertLang = db.prepare(`
    INSERT INTO session_languages (session_id, language, file_count)
    VALUES (@sessionId, @language, @fileCount)
    ON CONFLICT(session_id, language) DO UPDATE SET file_count = excluded.file_count
  `);

  // Per-session model usage — tracks which models were used and their token totals
  const upsertModel = db.prepare(`
    INSERT INTO session_models (session_id, model, input_tokens, output_tokens, message_count)
    VALUES (@sessionId, @model, @inputTokens, @outputTokens, @messageCount)
    ON CONFLICT(session_id, model) DO UPDATE SET
      input_tokens = excluded.input_tokens,
      output_tokens = excluded.output_tokens,
      message_count = excluded.message_count
  `);

  // Wipe child rows before re-inserting to avoid stale data from old parsed runs
  const deleteTools = db.prepare(`DELETE FROM session_tools WHERE session_id = ?`);
  const deleteLangs = db.prepare(`DELETE FROM session_languages WHERE session_id = ?`);
  const deleteModels = db.prepare(`DELETE FROM session_models WHERE session_id = ?`);

  const lastParsedAt = new Date().toISOString();

  for (const file of jsonlFiles) {
    const parsed = parseJsonlFile(file);
    if (!parsed) continue;

    const toolCount = Object.values(parsed.toolCounts).reduce((a, b) => a + b, 0);

    const sessionRow = {
      id: parsed.id,
      projectPath: parsed.projectPath,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      durationMinutes: parsed.durationMinutes,
      inputTokens: parsed.inputTokens,
      outputTokens: parsed.outputTokens,
      cacheReadInputTokens: parsed.cacheReadInputTokens,
      cacheCreationInputTokens: parsed.cacheCreationInputTokens,
      userMessageCount: parsed.userMessageCount,
      assistantMessageCount: parsed.assistantMessageCount,
      toolCount,
      usesTaskAgent: parsed.usesTaskAgent ? 1 : 0,
      usesMcp: parsed.usesMcp ? 1 : 0,
      lastParsedAt,
    };

    // Run all writes for this session in a single transaction — all-or-nothing
    db.transaction(() => {
      upsertSession.run(sessionRow);
      deleteTools.run(parsed.id);
      deleteLangs.run(parsed.id);
      deleteModels.run(parsed.id);
      for (const [toolName, callCount] of Object.entries(parsed.toolCounts)) {
        upsertTool.run({ sessionId: parsed.id, toolName, callCount });
      }
      for (const [model, stats] of Object.entries(parsed.modelCounts)) {
        upsertModel.run({
          sessionId: parsed.id,
          model,
          inputTokens: stats.inputTokens,
          outputTokens: stats.outputTokens,
          messageCount: stats.messageCount,
        });
      }
      // languages are not populated by parseJsonlFile in this implementation
    })();
  }
}