import * as fs from "fs";
import * as path from "path";
import { SESSION_META_DIR } from "./paths";
import type { SourceSessionMeta } from "./types/source";

export function readAllSessionMeta(): SourceSessionMeta[] {
  if (!fs.existsSync(SESSION_META_DIR)) {
    return [];
  }

  let files: string[];
  try {
    files = fs.readdirSync(SESSION_META_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }

  const results: SourceSessionMeta[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(SESSION_META_DIR, file), "utf-8");
      const parsed = JSON.parse(content) as SourceSessionMeta;
      results.push(parsed);
    } catch (err) {
      console.warn(`Skipping corrupt session meta file: ${file}`, err);
    }
  }

  return results;
}
