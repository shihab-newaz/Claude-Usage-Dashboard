import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { syncAllSessions } from "@/lib/db/sync";

export const dynamic = "force-dynamic";

// Throttle sync to once per minute
let _lastSync = 0;
const SYNC_INTERVAL = 60_000;

function ensureSynced() {
  const now = Date.now();
  if (now - _lastSync > SYNC_INTERVAL) {
    syncAllSessions();
    _lastSync = now;
  }
}

// GET /api/sessions/[id] — fetch a single session with its tools and languages
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureSynced();
    const { id } = await params;
    const db = getDb();

    const session = db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Per-session tool counts, sorted by call frequency
    const tools = db.prepare(`
      SELECT tool_name AS tool, call_count AS count
      FROM session_tools
      WHERE session_id = ?
      ORDER BY count DESC
    `).all(id) as Array<{ tool: string; count: number }>;

    // Per-session language breakdown from Write/Edit file extensions
    const languages = db.prepare(`
      SELECT language, file_count AS count
      FROM session_languages
      WHERE session_id = ?
      ORDER BY count DESC
    `).all(id) as Array<{ language: string; count: number }>;

    return NextResponse.json({
      ...session,
      topTools: tools,
      topLanguages: languages,
    });
  } catch (err) {
    console.error("[session] Failed:", err);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}