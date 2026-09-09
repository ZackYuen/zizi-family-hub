import assert from "node:assert/strict";
import test from "node:test";
import {
  formatLeftoverSuggestions,
  parseLeftoverQuery,
  suggestRecipesFromLeftovers,
} from "./leftover-suggest";
import type { DinnerRecipe } from "./types";

function recipe(
  partial: Pick<DinnerRecipe, "id" | "name" | "category"> & Partial<DinnerRecipe>
): DinnerRecipe {
  return { index: 1, link: "", ...partial };
}

test("parseLeftoverQuery reads leftover / fridge lists", () => {
  assert.equal(parseLeftoverQuery("leftover eggs tomato pork"), "eggs tomato pork");
  assert.equal(
    parseLeftoverQuery("tonight leftover eggs, tomato"),
    "eggs, tomato"
  );
  assert.equal(parseLeftoverQuery("what can I cook with eggs and tomato")?.toLowerCase().includes("eggs"), true);
  assert.equal(parseLeftoverQuery("what is for dinner"), null);
  assert.equal(parseLeftoverQuery("leftover"), "");
  assert.ok(parseLeftoverQuery("what remaining material can be cooked") != null);
});

test("suggestRecipesFromLeftovers matches ingredients not random", () => {
  const pool = [
    recipe({
      id: "d-egg",
      name: "番茄炒蛋",
      nameEn: "Tomato scrambled eggs",
      category: "Vegetable",
      ingredients: [{ en: "Eggs", zh: "蛋" }, { en: "Tomato", zh: "番茄" }],
    }),
    recipe({
      id: "d-pork",
      name: "豬柳",
      nameEn: "Pan-fried pork",
      category: "Meat",
      ingredients: [{ en: "Pork tenderloin", zh: "豬柳" }],
    }),
    recipe({
      id: "d-unrelated",
      name: "咖哩",
      nameEn: "Curry",
      category: "Meat",
      ingredients: [{ en: "Chicken" }],
    }),
  ];
  const found = suggestRecipesFromLeftovers(pool, "eggs tomato pork");
  const ids = found.map((r) => r.id);
  assert.ok(ids.includes("d-egg"));
  assert.ok(ids.includes("d-pork"));
  assert.equal(ids.includes("d-unrelated"), false);
});

test("no leftover match tells Charlene to ask Mum", () => {
  const text = formatLeftoverSuggestions(
    [
      recipe({
        id: "d-x",
        name: "X",
        nameEn: "X",
        category: "Meat",
        ingredients: [{ en: "Salmon" }],
      }),
    ],
    "dragonfruit durian",
    "en"
  );
  assert.match(text, /ask Mum/i);
});

test("empty leftover list asks Charlene then Mum", () => {
  const text = formatLeftoverSuggestions([], "", "en");
  assert.match(text, /Ask Charlene/i);
  assert.match(text, /ask Mum/i);
});
