import assert from "node:assert/strict";
import test from "node:test";
import {
  conflictCategories,
  groupRecipeIds,
  matchRecipe,
  mergeCategoryIds,
  numberedRecipeLine,
  parseMenuCommand,
  scoreRecipeMatch,
  searchSimilarRecipes,
  splitDishTokens,
} from "./wa-menu-parse";
import type { DinnerRecipe } from "./types";

function recipe(
  partial: Pick<DinnerRecipe, "id" | "name" | "nameEn" | "category"> &
    Partial<DinnerRecipe>
): DinnerRecipe {
  return {
    index: 1,
    link: "",
    ...partial,
  };
}

test("parseMenuCommand today / tomorrow / menu", () => {
  assert.deepEqual(parseMenuCommand("today"), {
    action: "show",
    days: ["today"],
  });
  assert.deepEqual(parseMenuCommand("tonight dinner"), {
    action: "show",
    days: ["today"],
  });
  assert.deepEqual(parseMenuCommand("tomorrow clear"), {
    action: "clear",
    days: ["tomorrow"],
  });
  assert.deepEqual(parseMenuCommand("bukas honey wings, garlic cabbage"), {
    action: "set",
    assignments: [
      {
        day: "tomorrow",
        dishes: ["honey wings", "garlic cabbage"],
      },
    ],
  });
  assert.deepEqual(
    parseMenuCommand(
      "menu today: honey wings, cabbage\ntomorrow: salmon miso"
    ),
    {
      action: "set",
      assignments: [
        { day: "today", dishes: ["honey wings", "cabbage"] },
        { day: "tomorrow", dishes: ["salmon miso"] },
      ],
    }
  );
  assert.deepEqual(parseMenuCommand("menu"), {
    action: "show",
    days: ["today", "tomorrow"],
  });
  assert.equal(parseMenuCommand("add https://youtu.be/abc"), null);
  assert.equal(parseMenuCommand("what is tonight dinner"), null);
});

test("parseMenuCommand pick numbers", () => {
  assert.deepEqual(parseMenuCommand("today 1"), {
    action: "pick",
    day: "today",
    numbers: [1],
  });
  assert.deepEqual(parseMenuCommand("today 1, 4"), {
    action: "pick",
    day: "today",
    numbers: [1, 4],
  });
  assert.deepEqual(parseMenuCommand("1"), {
    action: "pick",
    day: "pending",
    numbers: [1],
  });
  assert.deepEqual(parseMenuCommand("pick 2 3"), {
    action: "pick",
    day: "pending",
    numbers: [2, 3],
  });
  assert.equal(parseMenuCommand("today honey wings")?.action, "set");
});

test("parseMenuCommand overwrite / also", () => {
  assert.deepEqual(parseMenuCommand("overwrite"), {
    action: "merge",
    mode: "overwrite",
  });
  assert.deepEqual(parseMenuCommand("tonight also"), {
    action: "merge",
    mode: "also",
  });
  assert.deepEqual(parseMenuCommand("replace"), {
    action: "merge",
    mode: "overwrite",
  });
  assert.deepEqual(parseMenuCommand("keep"), {
    action: "merge",
    mode: "also",
  });
  assert.deepEqual(parseMenuCommand("addmore"), {
    action: "merge",
    mode: "also",
  });
  assert.equal(parseMenuCommand("add https://youtu.be/abc"), null);
});

test("splitDishTokens keeps youtube urls", () => {
  assert.deepEqual(
    splitDishTokens("https://youtu.be/abcDEF12345, garlic cabbage"),
    ["https://youtu.be/abcDEF12345", "garlic cabbage"]
  );
  assert.deepEqual(
    splitDishTokens(
      "https://www.instagram.com/reel/Db4MquIBejD/?igsi=abc==, cabbage"
    ),
    [
      "https://www.instagram.com/reel/Db4MquIBejD/?igsi=abc==",
      "cabbage",
    ]
  );
});

test("matchRecipe prefers honey wings and salmon miso", () => {
  const recipes: DinnerRecipe[] = [
    recipe({
      id: "d-1090",
      name: "蜜糖雞翼",
      nameEn: "Honey Chicken Wings",
      category: "Meat",
    }),
    recipe({
      id: "d-yt-miso",
      name: "鮭魚味噌湯",
      nameEn: "Salmon miso soup",
      category: "Soup",
    }),
    recipe({
      id: "d-cabbage",
      name: "蒜蓉白菜",
      nameEn: "Stir-fried baby cabbage with garlic",
      category: "Vegetable",
    }),
    recipe({
      id: "d-napa",
      name: "金華火腿白菜",
      nameEn: "Napa cabbage with Jinhua ham",
      category: "Vegetable",
    }),
  ];
  const wings = matchRecipe("honey wings", recipes);
  assert.ok("recipe" in wings && wings.recipe?.id === "d-1090");
  const soup = matchRecipe("salmon miso", recipes);
  assert.ok("recipe" in soup && soup.recipe?.id === "d-yt-miso");
  const garlic = matchRecipe("garlic cabbage", recipes);
  assert.ok("recipe" in garlic && garlic.recipe?.id === "d-cabbage");
  assert.ok(scoreRecipeMatch("honey wings", recipes[0]) > 70);
  const cabbageHits = searchSimilarRecipes("cabbage", recipes);
  assert.ok(cabbageHits.length >= 2);
  assert.ok(cabbageHits.some((h) => h.recipe.id === "d-cabbage"));
  assert.ok(cabbageHits.some((h) => h.recipe.id === "d-napa"));
  assert.match(numberedRecipeLine(1, recipes[0]), /^1\. /);
});

test("same category conflict vs merge keeps other cats", () => {
  const existing = groupRecipeIds([
    recipe({ id: "m1", name: "old meat", nameEn: "old meat", category: "Meat" }),
    recipe({ id: "v1", name: "old veg", nameEn: "old veg", category: "Vegetable" }),
  ]);
  const incoming = groupRecipeIds([
    recipe({ id: "m2", name: "new meat", nameEn: "new meat", category: "Meat" }),
  ]);
  assert.deepEqual(conflictCategories(existing, incoming), ["Meat"]);
  assert.deepEqual(mergeCategoryIds(existing, incoming, "overwrite"), {
    Meat: ["m2"],
    Vegetable: ["v1"],
    Soup: [],
  });
  assert.deepEqual(mergeCategoryIds(existing, incoming, "also"), {
    Meat: ["m1", "m2"],
    Vegetable: ["v1"],
    Soup: [],
  });
  const soupOnly = groupRecipeIds([
    recipe({ id: "s1", name: "soup", nameEn: "soup", category: "Soup" }),
  ]);
  assert.deepEqual(conflictCategories(existing, soupOnly), []);
  assert.deepEqual(mergeCategoryIds(existing, soupOnly, "also").Soup, ["s1"]);
  assert.deepEqual(mergeCategoryIds(existing, soupOnly, "also").Meat, ["m1"]);
});
