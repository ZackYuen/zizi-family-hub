#!/usr/bin/env node
/**
 * Upsert selected dinner recipes into live Supabase (Admin truth).
 *
 * Usage:
 *   ADMIN_PASSWORD=… node scripts/patch-live-recipes.mjs scripts/_patch-recipes.json
 *
 * Patch shape:
 *   { "upsertRecipes": [ { "id": "d-18", ... } ], "dryRun": false }
 */
import fs from "fs";
import path from "path";

const base =
  process.env.LIVE_BASE_URL || "https://zizi-family-hub.vercel.app";
const password = process.env.ADMIN_PASSWORD;
const patchPath = process.argv[2];

if (!patchPath) {
  console.error("Usage: ADMIN_PASSWORD=… node scripts/patch-live-recipes.mjs <patch.json>");
  process.exit(1);
}
if (!password) {
  console.error("Missing ADMIN_PASSWORD");
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

async function main() {
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed ${loginRes.status}`);
  }
  const cookie = loginRes.headers.getSetCookie?.()?.join("; ") ||
    loginRes.headers.get("set-cookie") ||
    "";

  const getRes = await fetch(`${base}/api/admin/recipes`, {
    headers: { Cookie: cookie, Accept: "application/json" },
  });
  if (!getRes.ok) throw new Error(`GET recipes ${getRes.status}`);
  const { recipes } = await getRes.json();
  const next = upsertById(recipes, patch.upsertRecipes || []);

  if (patch.dryRun) {
    console.log("dryRun — would upsert", (patch.upsertRecipes || []).map((r) => r.id));
    return;
  }

  const putRes = await fetch(`${base}/api/admin/recipes`, {
    method: "PUT",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipes: next }),
  });
  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(`PUT recipes ${putRes.status}: ${text.slice(0, 200)}`);
  }
  console.log("ok — upserted", (patch.upsertRecipes || []).map((r) => r.id));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
