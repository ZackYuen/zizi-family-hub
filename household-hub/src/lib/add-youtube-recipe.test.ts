import assert from "node:assert/strict";
import test from "node:test";
import {
  inferRecipeCategory,
  parseAddCommand,
} from "./add-youtube-parse";

test("parseAddCommand accepts ?add youtube urls", () => {
  assert.deepEqual(
    parseAddCommand("add https://www.youtube.com/watch?v=fdSLImmLav4"),
    { url: "https://www.youtube.com/watch?v=fdSLImmLav4" }
  );
  assert.deepEqual(
    parseAddCommand('add meal "https://youtu.be/abcDEF12345"'),
    { url: "https://youtu.be/abcDEF12345" }
  );
  assert.deepEqual(
    parseAddCommand("add recipe https://www.youtube.com/shorts/fdSLImmLav4"),
    { url: "https://www.youtube.com/shorts/fdSLImmLav4" }
  );
  assert.equal(parseAddCommand("add charcoal chicken tonight"), null);
  assert.equal(parseAddCommand("save https://youtu.be/abcDEF12345"), null);
});

test("inferRecipeCategory picks soup / veg / meat", () => {
  assert.equal(inferRecipeCategory("鮭魚味噌湯 salmon miso soup"), "Soup");
  assert.equal(inferRecipeCategory("蒜蓉白菜 stir-fry cabbage 蔬菜"), "Vegetable");
  assert.equal(inferRecipeCategory("honey garlic chicken wings"), "Meat");
});
