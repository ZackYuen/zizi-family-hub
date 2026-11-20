/**
 * Short-lived in-memory cache for large Supabase `app_data` documents.
 *
 * Warm Vercel isolates (WhatsApp bot polls ~every 60s) reuse the last payload
 * instead of re-downloading `content` / `dinner_recipes` on every request.
 * After TTL, a tiny `updated_at` peek is enough when the row has not changed.
 */

export const DEFAULT_APP_DATA_CACHE_TTL_MS = 90_000;

export type AppDataCacheState = "hit" | "miss" | "revalidated";

export interface AppDataCacheEntry<T> {
  value: T;
  updatedAt: string | null;
  loadedAt: number;
  writeGen: number;
}

export function appDataCacheTtlMs(): number {
  const raw = Number(process.env.APP_DATA_CACHE_TTL_MS);
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return DEFAULT_APP_DATA_CACHE_TTL_MS;
}

const memory = new Map<string, AppDataCacheEntry<unknown>>();
const inflight = new Map<
  string,
  Promise<{ value: unknown; state: AppDataCacheState }>
>();
const writeGen = new Map<string, number>();

function nextWriteGen(key: string): number {
  const n = (writeGen.get(key) ?? 0) + 1;
  writeGen.set(key, n);
  return n;
}

export function peekAppDataCache<T>(key: string): AppDataCacheEntry<T> | undefined {
  return memory.get(key) as AppDataCacheEntry<T> | undefined;
}

export function seedAppDataCache<T>(
  key: string,
  value: T,
  updatedAt: string | null,
  now = Date.now()
): void {
  memory.set(key, {
    value,
    updatedAt,
    loadedAt: now,
    writeGen: nextWriteGen(key),
  });
}

export function invalidateAppDataCache(key?: string): void {
  if (key) {
    memory.delete(key);
    nextWriteGen(key);
    return;
  }
  memory.clear();
  for (const existing of writeGen.keys()) {
    nextWriteGen(existing);
  }
}

/** Test helper — also resets in-flight loaders. */
export function resetAppDataCacheForTests(): void {
  memory.clear();
  inflight.clear();
  writeGen.clear();
}

export async function rememberAppData<T>(opts: {
  key: string;
  ttlMs?: number;
  now?: number;
  load: () => Promise<{ value: T; updatedAt: string | null }>;
  peekUpdatedAt?: () => Promise<string | null | undefined>;
}): Promise<{ value: T; state: AppDataCacheState }> {
  const now = opts.now ?? Date.now();
  const ttl = opts.ttlMs ?? appDataCacheTtlMs();
  const existing = memory.get(opts.key) as AppDataCacheEntry<T> | undefined;
  if (existing && now - existing.loadedAt < ttl) {
    return { value: existing.value, state: "hit" };
  }

  const pending = inflight.get(opts.key);
  if (pending) {
    return pending as Promise<{ value: T; state: AppDataCacheState }>;
  }

  const genAtStart = writeGen.get(opts.key) ?? 0;
  const task = (async (): Promise<{ value: T; state: AppDataCacheState }> => {
    try {
      if (existing && opts.peekUpdatedAt) {
        try {
          const remoteUpdatedAt = await opts.peekUpdatedAt();
          if (
            remoteUpdatedAt != null &&
            remoteUpdatedAt === existing.updatedAt
          ) {
            if ((writeGen.get(opts.key) ?? 0) !== genAtStart) {
              const seeded = memory.get(opts.key) as AppDataCacheEntry<T> | undefined;
              if (seeded) return { value: seeded.value, state: "hit" };
            }
            memory.set(opts.key, {
              ...existing,
              loadedAt: opts.now ?? Date.now(),
            });
            return { value: existing.value, state: "revalidated" };
          }
        } catch {
          // Peek failed — fall through to a full document load.
        }
      }

      const loaded = await opts.load();
      if ((writeGen.get(opts.key) ?? 0) !== genAtStart) {
        const seeded = memory.get(opts.key) as AppDataCacheEntry<T> | undefined;
        if (seeded) return { value: seeded.value, state: "hit" };
      }
      memory.set(opts.key, {
        value: loaded.value,
        updatedAt: loaded.updatedAt,
        loadedAt: opts.now ?? Date.now(),
        writeGen: genAtStart,
      });
      return { value: loaded.value, state: existing ? "revalidated" : "miss" };
    } finally {
      inflight.delete(opts.key);
    }
  })();

  inflight.set(opts.key, task);
  return task;
}
