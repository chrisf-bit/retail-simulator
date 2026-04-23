import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

export const PERSISTENCE_DIR = process.env.PERSISTENCE_DIR ?? "./.persistence/sessions";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

let ensured = false;

async function ensureDir(): Promise<void> {
  if (ensured) return;
  await fs.mkdir(PERSISTENCE_DIR, { recursive: true });
  ensured = true;
}

function fileFor(sessionId: string): string {
  return path.join(PERSISTENCE_DIR, `${sessionId}.json`);
}

/**
 * Write a session snapshot to disk atomically: write to a .tmp file, then
 * rename onto the real path. Safe for concurrent readers.
 */
export async function writeSessionFile(sessionId: string, data: unknown): Promise<void> {
  await ensureDir();
  const filepath = fileFor(sessionId);
  const tmpPath = `${filepath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data), "utf8");
  await fs.rename(tmpPath, filepath);
}

/**
 * Synchronous write used from a SIGTERM handler when we need to flush pending
 * state before the process exits.
 */
export function writeSessionFileSync(sessionId: string, data: unknown): void {
  fsSync.mkdirSync(PERSISTENCE_DIR, { recursive: true });
  const filepath = fileFor(sessionId);
  const tmpPath = `${filepath}.tmp`;
  fsSync.writeFileSync(tmpPath, JSON.stringify(data), "utf8");
  fsSync.renameSync(tmpPath, filepath);
}

export interface PersistedEntry<T> {
  sessionId: string;
  data: T;
  updatedAt: number;
}

export async function readAllSessionFiles<T extends { updatedAt?: number }>(): Promise<PersistedEntry<T>[]> {
  try {
    await ensureDir();
  } catch {
    return [];
  }
  const entries = await fs.readdir(PERSISTENCE_DIR).catch(() => [] as string[]);
  const out: PersistedEntry<T>[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const sessionId = name.replace(/\.json$/, "");
    const filepath = path.join(PERSISTENCE_DIR, name);
    try {
      const raw = await fs.readFile(filepath, "utf8");
      const data = JSON.parse(raw) as T;
      out.push({ sessionId, data, updatedAt: data.updatedAt ?? 0 });
    } catch (err) {
      console.warn(`[persistence] failed to read ${name}:`, err);
    }
  }
  return out;
}

export async function deleteSessionFile(sessionId: string): Promise<void> {
  try {
    await fs.unlink(fileFor(sessionId));
  } catch {
    // ignore, file may already be gone
  }
}
