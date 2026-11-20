import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_APP_DATA_CACHE_TTL_MS,
  invalidateAppDataCache,
  peekAppDataCache,
  rememberAppData,
  resetAppDataCacheForTests,
  seedAppDataCache,
} from "./app-data-cache";

test("fresh load is a miss and later reads within TTL are hits", async () => {
  resetAppDataCacheForTests();
  let loads = 0;
  const load = async () => {
    loads += 1;
    return { value: { n: loads }, updatedAt: "t1" };
  };

  const first = await rememberAppData({
    key: "content",
    ttlMs: 90_000,
    now: 1_000,
    load,
  });
  assert.equal(first.state, "miss");
  assert.deepEqual(first.value, { n: 1 });
  assert.equal(loads, 1);

  const second = await rememberAppData({
    key: "content",
    ttlMs: 90_000,
    now: 1_000 + 60_000,
    load,
  });
  assert.equal(second.state, "hit");
  assert.deepEqual(second.value, { n: 1 });
  assert.equal(loads, 1);
});

test("after TTL, unchanged updated_at peeks instead of reloading the document", async () => {
  resetAppDataCacheForTests();
  let loads = 0;
  let peeks = 0;
  const load = async () => {
    loads += 1;
    return { value: "doc", updatedAt: "v1" };
  };
  const peekUpdatedAt = async () => {
    peeks += 1;
    return "v1";
  };

  await rememberAppData({
    key: "content",
    ttlMs: 90_000,
    now: 0,
    load,
    peekUpdatedAt,
  });
  const later = await rememberAppData({
    key: "content",
    ttlMs: 90_000,
    now: 90_000,
    load,
    peekUpdatedAt,
  });
  assert.equal(later.state, "revalidated");
  assert.equal(later.value, "doc");
  assert.equal(loads, 1);
  assert.equal(peeks, 1);
});

test("after TTL, a new updated_at reloads the full document", async () => {
  resetAppDataCacheForTests();
  let loads = 0;
  const load = async () => {
    loads += 1;
    return { value: `doc-${loads}`, updatedAt: `v${loads}` };
  };
  const peekUpdatedAt = async () => "v2";

  await rememberAppData({
    key: "dinner_recipes",
    ttlMs: 1_000,
    now: 0,
    load,
    peekUpdatedAt,
  });
  const later = await rememberAppData({
    key: "dinner_recipes",
    ttlMs: 1_000,
    now: 1_000,
    load,
    peekUpdatedAt,
  });
  assert.equal(later.state, "revalidated");
  assert.equal(later.value, "doc-2");
  assert.equal(loads, 2);
});

test("concurrent loaders share one in-flight fetch", async () => {
  resetAppDataCacheForTests();
  let loads = 0;
  let release: (value: { value: string; updatedAt: string | null }) => void =
    () => {};
  const load = () => {
    loads += 1;
    return new Promise<{ value: string; updatedAt: string | null }>((resolve) => {
      release = resolve;
    });
  };

  const a = rememberAppData({ key: "content", ttlMs: 90_000, now: 0, load });
  const b = rememberAppData({ key: "content", ttlMs: 90_000, now: 0, load });
  release({ value: "one", updatedAt: "t" });
  const [ra, rb] = await Promise.all([a, b]);
  assert.equal(loads, 1);
  assert.equal(ra.value, "one");
  assert.equal(rb.value, "one");
  assert.equal(ra.state, "miss");
  assert.equal(rb.state, "miss");
});

test("seed/invalidate make Admin writes visible before TTL", async () => {
  resetAppDataCacheForTests();
  let loads = 0;
  const load = async () => {
    loads += 1;
    return { value: "old", updatedAt: "t1" };
  };
  await rememberAppData({ key: "content", ttlMs: 90_000, now: 0, load });
  seedAppDataCache("content", "new", "t2", 10);
  const hit = await rememberAppData({
    key: "content",
    ttlMs: 90_000,
    now: 20,
    load,
  });
  assert.equal(hit.state, "hit");
  assert.equal(hit.value, "new");
  assert.equal(loads, 1);

  invalidateAppDataCache("content");
  const miss = await rememberAppData({
    key: "content",
    ttlMs: 90_000,
    now: 30,
    load,
  });
  assert.equal(miss.state, "miss");
  assert.equal(miss.value, "old");
  assert.equal(loads, 2);
});

test("a save during load keeps the seeded value", async () => {
  resetAppDataCacheForTests();
  let releaseLoad: (value: { value: string; updatedAt: string | null }) => void =
    () => {};
  const load = () =>
    new Promise<{ value: string; updatedAt: string | null }>((resolve) => {
      releaseLoad = resolve;
    });

  const pending = rememberAppData({
    key: "content",
    ttlMs: 90_000,
    now: 0,
    load,
  });
  seedAppDataCache("content", "saved", "t-saved", 5);
  releaseLoad({ value: "stale-from-supabase", updatedAt: "t-old" });
  const result = await pending;
  assert.equal(result.value, "saved");
  assert.equal(peekAppDataCache<string>("content")?.value, "saved");
});

test("null peek after TTL reloads the document instead of treating it as unchanged", async () => {
  resetAppDataCacheForTests();
  let loads = 0;
  const load = async () => {
    loads += 1;
    return { value: `doc-${loads}`, updatedAt: null };
  };
  await rememberAppData({
    key: "content",
    ttlMs: 10,
    now: 0,
    load,
    peekUpdatedAt: async () => null,
  });
  const later = await rememberAppData({
    key: "content",
    ttlMs: 10,
    now: 10,
    load,
    peekUpdatedAt: async () => null,
  });
  assert.equal(later.value, "doc-2");
  assert.equal(loads, 2);
});

test("default TTL is short-lived (covers ~one 60s poll, not minutes)", () => {
  assert.equal(DEFAULT_APP_DATA_CACHE_TTL_MS, 90_000);
});
