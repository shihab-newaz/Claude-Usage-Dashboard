"use client";

import { useQuery } from "@tanstack/react-query";

interface SessionDetail {
  id: string;
  project_path: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  user_message_count: number;
  assistant_message_count: number;
  tool_count: number;
  uses_task_agent: number;
  uses_mcp: number;
  lines_added: number;
  lines_removed: number;
  files_modified: number;
  topTools: Array<{ tool: string; count: number }>;
  topLanguages: Array<{ language: string; count: number }>;
}

async function fetchSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`/api/sessions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch session");
  return res.json();
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => fetchSession(id),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}