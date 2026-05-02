import * as os from "os";
import * as path from "path";

export const CLAUDE_BASE_DIR = path.join(os.homedir(), ".claude");
export const SESSION_META_DIR = path.join(CLAUDE_BASE_DIR, "usage-data", "session-meta");
export const HISTORY_FILE = path.join(CLAUDE_BASE_DIR, "history.jsonl");
