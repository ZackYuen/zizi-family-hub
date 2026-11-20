import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("leftover reminder API does not fetch recipes or dinner overrides", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/reminders/leftover/route.ts"),
    "utf8"
  );
  assert.equal(src.includes("getDinnerRecipes"), false);
  assert.equal(src.includes("getDinnerMenuOverrides"), false);
  assert.equal(src.includes("resolveTonightMenu"), false);
  assert.match(src, /getContentWithSource/);
  assert.match(src, /buildLeftoverReminderFeed/);
  assert.match(src, /X-App-Data-Cache/);
});

test("outing reminder API reads cached content, not the recipe library", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/reminders/outing/route.ts"),
    "utf8"
  );
  assert.equal(src.includes("getDinnerRecipes"), false);
  assert.match(src, /getContentWithSource/);
  assert.match(src, /X-App-Data-Cache/);
});
