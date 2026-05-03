"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClaudeUsageResponse } from "@/lib/types";

async function fetchClaudeUsage(dateFrom?: string, dateTo?: string): Promise<ClaudeUsageResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const url = "/api/claude-usage" + (params.size ? "?" + params.toString() : "");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch usage data");
  return res.json();
}

export function useClaudeUsage(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["claude-usage", { dateFrom, dateTo }],
    queryFn: () => fetchClaudeUsage(dateFrom, dateTo),
    staleTime: 30_000,
    retry: 2,
  });
}