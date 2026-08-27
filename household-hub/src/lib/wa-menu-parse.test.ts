import assert from "node:assert/strict";
import test from "node:test";
import {
  matchRecipe,
  parseMenuCommand,
  scoreRecipeMatch,
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

test("splitDishTokens keeps youtube urls", () => {
  assert.deepEqual(
    splitDishTokens("https://youtu.be/abcDEF12345, garlic cabbage"),
    ["https://youtu.be/abcDEF12345", "garlic cabbage"]
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
});
