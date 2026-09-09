import assert from "node:assert/strict";
import test from "node:test";
import { mergeSeedDinnerOverrides, normalizeDinnerOverride, resolveTonightMenu, tonightDishes } from "./dinner";

test("seed dinner override fills a date Admin has not saved", () => {
  const merged = mergeSeedDinnerOverrides(
    {},
    {
      "2026-09-08": {
        date: "2026-09-08",
        meatIds: ["d-fridge-pork-fillet-slices"],
        vegetableIds: ["d-fridge-greens-enoki"],
        soupIds: [],
      },
    }
  );
  assert.deepEqual(merged["2026-09-08"]?.meatIds, ["d-fridge-pork-fillet-slices"]);
  assert.equal(merged["2026-09-08"]?.vegetableIds[0], "d-fridge-greens-enoki");
  assert.deepEqual(merged["2026-09-08"]?.soupIds, []);
});

test("live Admin override wins over seed", () => {
  const live = {
    "2026-09-08": normalizeDinnerOverride({
      date: "2026-09-08",
      meatIds: ["d-10"],
      vegetableIds: [],
      soupIds: [],
    })!,
  };
  const merged = mergeSeedDinnerOverrides(live, {
    "2026-09-08": {
      date: "2026-09-08",
      meatIds: ["d-fridge-pork-cubes"],
      vegetableIds: ["d-fridge-greens-enoki"],
      soupIds: ["d-fridge-tomato-egg-soup"],
    },
  });
  assert.deepEqual(merged["2026-09-08"]?.meatIds, ["d-10"]);
});

test("no saved override means empty menu, not random", () => {
  const recipes = [
    {
      id: "d-a",
      index: 1,
      name: "A",
      nameEn: "Meat A",
      category: "Meat" as const,
      link: "",
    },
    {
      id: "d-b",
      index: 2,
      name: "B",
      nameEn: "Veg B",
      category: "Vegetable" as const,
      link: "",
    },
    {
      id: "d-c",
      index: 3,
      name: "C",
      nameEn: "Soup C",
      category: "Soup" as const,
      link: "",
    },
  ];
  const menu = resolveTonightMenu(recipes, "2026-09-09", null);
  assert.equal(menu.overridden, false);
  assert.equal(tonightDishes(menu).length, 0);
});
