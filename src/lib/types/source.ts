// Raw source types — mirror the exact JSON structure in ~/.claude/usage-data/session-meta/*.json

export interface SourceSessionMeta {
  session_id: string;
  project_path: string;
  start_time: string; // ISO 8601
  duration_minutes: number;
  user_message_count: number;
  assistant_message_count: number;
  tool_counts: Record<string, number>;
  languages: Record<string, number>;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  first_prompt: string;
  user_interruptions: number;
  user_response_times: number[];
  tool_errors: number;
  uses_task_agent: boolean;
  uses_mcp: boolean;
  lines_added: number;
  lines_removed: number;
  files_modified: number;
}

export interface SourceSessionFacet {
  session_id: string;
  [key: string]: unknown;
}
