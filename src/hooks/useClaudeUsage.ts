"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClaudeUsageResponse } from "@/lib/types";

async function fetchClaudeUsage(): Promise<ClaudeUsageResponse> {
  const res = await fetch("/api/claude-usage");
  if (!res.ok) throw new Error("Failed to fetch usage data");
  return res.json();
}

export function useClaudeUsage() {
  return useQuery({
    queryKey: ["claude-usage"],
    queryFn: fetchClaudeUsage,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
