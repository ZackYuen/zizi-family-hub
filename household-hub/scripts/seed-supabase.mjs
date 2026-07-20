#!/usr/bin/env node
/**
 * Seed Supabase with content.json and dinner-recipes.json
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const root = process.cwd();
const content = JSON.parse(
  readFileSync(join(root, "data", "content.json"), "utf-8")
);
const recipes = JSON.parse(
  readFileSync(join(root, "data", "dinner-recipes.json"), "utf-8")
);

const supabase = createClient(url, key);

const rows = [
  { key: "content", data: content },
  { key: "dinner_recipes", data: recipes },
];

for (const row of rows) {
  const { error } = await supabase.from("app_data").upsert({
    ...row,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error(`Failed to seed ${row.key}:`, error.message);
    process.exit(1);
  }
  console.log(`Seeded: ${row.key}`);
}

console.log("Done! Supabase is ready.");
