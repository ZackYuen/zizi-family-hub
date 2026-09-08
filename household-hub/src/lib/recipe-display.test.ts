import assert from "node:assert/strict";
import test from "node:test";
import {
  adminDishPickerLabel,
  adminRecipeSubtitle,
  adminRecipeTitle,
  getRecipeDisplayName,
} from "./recipe-display";
import type { DinnerRecipe } from "./types";

function recipe(
  partial: Pick<DinnerRecipe, "id" | "name" | "category"> & Partial<DinnerRecipe>
): DinnerRecipe {
  return { index: 1, link: "", ...partial };
}

const kingOyster = recipe({
  id: "d-1",
  name: "酥炸杏鮑菇",
  nameEn: "Crispy fried king oyster mushroom",
  nameFil: "Pritong kabute",
  category: "Vegetable",
});

test("admin list title follows English and never uses Filipino", () => {
  assert.equal(
    adminRecipeTitle(kingOyster, "en"),
    "Crispy fried king oyster mushroom"
  );
  assert.equal(adminRecipeTitle(kingOyster, "fil"), "Crispy fried king oyster mushroom");
  assert.equal(adminRecipeSubtitle(kingOyster, "en"), "酥炸杏鮑菇");
  assert.notEqual(adminRecipeTitle(kingOyster, "en"), kingOyster.nameFil);
});

test("admin list title follows Chinese when 繁中 is chosen", () => {
  assert.equal(adminRecipeTitle(kingOyster, "zh"), "酥炸杏鮑菇");
  assert.equal(
    adminRecipeSubtitle(kingOyster, "zh"),
    "Crispy fried king oyster mushroom"
  );
});

test("admin dish picker puts chosen language first", () => {
  assert.equal(
    adminDishPickerLabel(kingOyster, "en"),
    "Crispy fried king oyster mushroom / 酥炸杏鮑菇"
  );
  assert.equal(
    adminDishPickerLabel(kingOyster, "zh"),
    "酥炸杏鮑菇 / Crispy fried king oyster mushroom"
  );
  assert.equal(getRecipeDisplayName(kingOyster, "en"), "Crispy fried king oyster mushroom");
});

test("admin dish picker falls back to English when no Chinese name", () => {
  const r = recipe({
    id: "d-2",
    name: "Honey wings",
    nameEn: "Honey chicken wings",
    nameFil: "Mga pakpak ng pulot",
    category: "Meat",
  });
  assert.equal(adminDishPickerLabel(r, "en"), "Honey chicken wings");
  assert.equal(adminRecipeTitle(r, "en"), "Honey chicken wings");
  assert.equal(adminRecipeTitle(r, "zh"), "Honey chicken wings");
});
