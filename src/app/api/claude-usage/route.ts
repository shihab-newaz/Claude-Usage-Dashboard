import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureSynced } from "@/lib/db/ensureSynced";
import {
  getLanguageBreakdown,
  getModelBreakdown,
  getRecentSessions,
  getToolBreakdown,
  getUsageSummary,
  getUsageTimeSeries,
} from "@/lib/db/queries/usage";
import type { ClaudeUsageResponse } from "@/lib/types";

// Always render fresh - never cache local session data.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    ensureSynced();
    const db = getDb();

    const response: ClaudeUsageResponse = {
      summary: getUsageSummary(db),
      timeSeries: getUsageTimeSeries(db),
      toolBreakdown: getToolBreakdown(db),
      languageBreakdown: getLanguageBreakdown(db),
      modelBreakdown: getModelBreakdown(db),
      recentSessions: getRecentSessions(db),
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
