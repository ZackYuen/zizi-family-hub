#!/usr/bin/env node
/**
 * Fetch LIVE Admin data (Supabase via production API).
 * Cloud agents should use this instead of reading committed content.json.
 *
 * Usage:
 *   node scripts/fetch-live-content.mjs
 *   LIVE_API_URL=https://zizi-family-hub.vercel.app/api/live node scripts/fetch-live-content.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url =
  process.env.LIVE_API_URL || "https://zizi-family-hub.vercel.app/api/live";

const res = await fetch(url, { headers: { Accept: "application/json" } });
if (!res.ok) {
  console.error("Failed to fetch live data:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const outDir = path.join(__dirname, "../.live-cache");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "live.json"), JSON.stringify(data, null, 2));
fs.writeFileSync(path.join(outDir, "knowledge.txt"), data.knowledgeText || "");

console.log("Source:", data.source);
console.log("Last updated:", data.lastUpdated);
console.log("Wrote:", path.join(outDir, "live.json"));
console.log("Note:", data.note);
