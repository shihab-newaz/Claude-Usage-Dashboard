import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureSynced } from "@/lib/db/ensureSynced";

export const dynamic = "force-dynamic";

// GET /api/sessions/[id] - fetch a single session with its tools and languages.
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

    const tools = db.prepare(`
      SELECT tool_name AS tool, call_count AS count
      FROM session_tools
      WHERE session_id = ?
      ORDER BY count DESC
    `).all(id) as Array<{ tool: string; count: number }>;

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
