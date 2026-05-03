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
  type DateRangeFilter,
} from "@/lib/db/queries/usage";
import type { ClaudeUsageResponse } from "@/lib/types";

// Always render fresh - never cache local session data.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    ensureSynced();
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const filter: DateRangeFilter = { dateFrom, dateTo };

    const response: ClaudeUsageResponse = {
      summary: getUsageSummary(db, filter),
      timeSeries: getUsageTimeSeries(db, filter),
      toolBreakdown: getToolBreakdown(db, filter),
      languageBreakdown: getLanguageBreakdown(db, filter),
      modelBreakdown: getModelBreakdown(db, filter),
      recentSessions: getRecentSessions(db, 10, filter),
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