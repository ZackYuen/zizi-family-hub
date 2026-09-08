import assert from "node:assert/strict";
import test from "node:test";
import { adminDishPickerLabel, getRecipeDisplayName } from "./recipe-display";
import type { DinnerRecipe } from "./types";

function recipe(
  partial: Pick<DinnerRecipe, "id" | "name" | "category"> & Partial<DinnerRecipe>
): DinnerRecipe {
  return { index: 1, link: "", ...partial };
}

test("admin dish picker shows Chinese first", () => {
  const r = recipe({
    id: "d-1",
    name: "酥炸杏鮑菇",
    nameEn: "Crispy fried king oyster mushroom",
    category: "Vegetable",
  });
  assert.equal(
    adminDishPickerLabel(r),
    "酥炸杏鮑菇 / Crispy fried king oyster mushroom"
  );
  assert.equal(getRecipeDisplayName(r, "en"), "Crispy fried king oyster mushroom");
});

test("admin dish picker falls back to English when no Chinese name", () => {
  const r = recipe({
    id: "d-2",
    name: "Honey wings",
    nameEn: "Honey chicken wings",
    category: "Meat",
  });
  assert.equal(adminDishPickerLabel(r), "Honey chicken wings");
});
