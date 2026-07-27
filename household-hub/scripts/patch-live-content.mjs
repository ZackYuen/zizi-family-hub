#!/usr/bin/env node
/**
 * Patch LIVE Admin content in Supabase (production truth).
 *
 * Default agent workflow:
 *   1. Fetch live:  npm run fetch-live
 *   2. Build a patch JSON (append-only / upsert-by-id / set fields)
 *   3. Apply:       npm run patch-live -- path/to/patch.json
 *
 * Never use this to dump whole content.json over Admin data.
 * content.json remains seed/backup only.
 *
 * Write path (first that works):
 *   A) SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL → direct upsert
 *   B) ADMIN_PASSWORD → login cookie → PUT /api/admin/content
 *
 * Patch shape (all keys optional):
 * {
 *   "appendAppliances": [ { id, kind, ... } ],
 *   "upsertAppliances": [ { id, ... } ],
 *   "appendHkLifeGuides": [ ... ],
 *   "upsertHkLifeGuides": [ ... ],
 *   "upsertGroundRules": [ { id, consequences, ... } ],
 *   "appendFamilyPreferences": [ ... ],
 *   "set": { "ziziSchool": { ... }, "homeArea": { ... } },
 *   "dryRun": true
 * }
 *
 * Env:
 *   LIVE_BASE_URL   default https://zizi-family-hub.vercel.app
 *   ADMIN_PASSWORD  for Admin API path
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for direct path
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base =
  process.env.LIVE_BASE_URL || "https://zizi-family-hub.vercel.app";
const password = process.env.ADMIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const patchPath = process.argv[2];
if (!patchPath) {
  console.error("Usage: node scripts/patch-live-content.mjs <patch.json>");
  process.exit(1);
}

const patch = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), patchPath), "utf8")
);

function upsertById(list = [], items = []) {
  const map = new Map(list.map((x) => [x.id, x]));
  for (const item of items) {
    if (!item?.id) throw new Error("upsert item missing id");
    map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  }
  return [...map.values()];
}

function appendById(list = [], items = []) {
  const ids = new Set(list.map((x) => x.id));
  const out = [...list];
  for (const item of items) {
    if (!item?.id) throw new Error("append item missing id");
    if (!ids.has(item.id)) {
      out.push(item);
      ids.add(item.id);
    }
  }
  return out;
}

function sortPriority(list) {
  return [...list].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}

function applyPatch(content, patchObj) {
  const next = structuredClone(content);
  if (patchObj.appendAppliances?.length) {
    next.appliances = sortPriority(
      appendById(next.appliances ?? [], patchObj.appendAppliances)
    );
  }
  if (patchObj.upsertAppliances?.length) {
    next.appliances = sortPriority(
      upsertById(next.appliances ?? [], patchObj.upsertAppliances)
    );
  }
  if (patchObj.appendHkLifeGuides?.length) {
    next.hkLifeGuides = sortPriority(
      appendById(next.hkLifeGuides ?? [], patchObj.appendHkLifeGuides)
    );
  }
  if (patchObj.upsertHkLifeGuides?.length) {
    next.hkLifeGuides = sortPriority(
      upsertById(next.hkLifeGuides ?? [], patchObj.upsertHkLifeGuides)
    );
  }
  if (patchObj.appendFamilyPreferences?.length) {
    next.familyPreferences = sortPriority(
      appendById(next.familyPreferences ?? [], patchObj.appendFamilyPreferences)
    );
  }
  if (patchObj.upsertGroundRules?.length) {
    next.groundRules = sortPriority(
      upsertById(next.groundRules ?? [], patchObj.upsertGroundRules)
    );
  }
  if (patchObj.appendGroundRules?.length) {
    next.groundRules = sortPriority(
      appendById(next.groundRules ?? [], patchObj.appendGroundRules)
    );
  }
  if (patchObj.set && typeof patchObj.set === "object") {
    for (const [key, value] of Object.entries(patchObj.set)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        next[key] &&
        typeof next[key] === "object" &&
        !Array.isArray(next[key])
      ) {
        next[key] = { ...next[key], ...value };
      } else {
        next[key] = value;
      }
    }
  }
  next.lastUpdated = new Date().toISOString();
  return next;
}

async function loadLiveContent() {
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("key", "content")
      .maybeSingle();
    if (error) throw error;
    if (!data?.data) throw new Error("No content row in Supabase");
    return { content: data.data, source: "supabase-direct" };
  }

  const liveRes = await fetch(`${base}/api/live`, {
    headers: { Accept: "application/json" },
  });
  if (!liveRes.ok) {
    throw new Error(`Failed /api/live ${liveRes.status}`);
  }
  const livePayload = await liveRes.json();
  return {
    content: livePayload.content,
    source: livePayload.source || "api-live",
  };
}

async function saveViaSupabase(content) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.from("app_data").upsert({
    key: "content",
    data: content,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function saveViaAdminApi(content) {
  if (!password) {
    throw new Error(
      "Need ADMIN_PASSWORD or SUPABASE_SERVICE_ROLE_KEY to save live content"
    );
  }
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!loginRes.ok) {
    throw new Error(
      `Admin login failed ${loginRes.status}: ${await loginRes.text()}`
    );
  }
  const setCookies =
    typeof loginRes.headers.getSetCookie === "function"
      ? loginRes.headers.getSetCookie()
      : [];
  const raw = setCookies.length
    ? setCookies
    : [loginRes.headers.get("set-cookie")].filter(Boolean);
  const cookieHeader = raw
    .map((c) => String(c).split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
  if (!cookieHeader) throw new Error("Admin login returned no session cookie");

  const putRes = await fetch(`${base}/api/admin/content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(content),
  });
  if (!putRes.ok) {
    throw new Error(
      `Admin Save failed ${putRes.status}: ${await putRes.text()}`
    );
  }
  return putRes.json();
}

const { content: liveContent, source } = await loadLiveContent();
console.log("Live source:", source);
console.log("Live lastUpdated:", liveContent.lastUpdated);

const content = applyPatch(liveContent, patch);

const outDir = path.join(__dirname, "../.live-cache");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "patched-content.json"),
  JSON.stringify(content, null, 2)
);

if (patch.dryRun) {
  console.log(
    "dryRun=true — wrote .live-cache/patched-content.json only (no Save)"
  );
  process.exit(0);
}

if (supabaseUrl && supabaseKey) {
  await saveViaSupabase(content);
  console.log("Saved via Supabase service role.");
} else {
  const saved = await saveViaAdminApi(content);
  console.log("Saved via Admin API → Supabase.");
  console.log(
    "New lastUpdated:",
    saved.content?.lastUpdated || content.lastUpdated
  );
}
console.log("Also wrote:", path.join(outDir, "patched-content.json"));
