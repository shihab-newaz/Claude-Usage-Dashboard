import { syncAllSessions } from "./sync";

const SYNC_INTERVAL = 60_000;
let lastSync = 0;

// Shared throttle so API routes do not each re-parse JSONL independently.
export function ensureSynced(): void {
  const now = Date.now();
  if (now - lastSync > SYNC_INTERVAL) {
    syncAllSessions();
    lastSync = now;
  }
}
