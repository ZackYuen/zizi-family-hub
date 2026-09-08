import assert from "node:assert/strict";
import test from "node:test";
import {
  extractJsonLdRecipe,
  extractRecipePageUrl,
  recipePageUrlCandidates,
  repairUtf8Mojibake,
  unwrapYoutubeRedirect,
} from "./youtube-recipe";

test("extractRecipePageUrl skips YouTube and keeps chef blog", () => {
  const text = `
Watch: https://www.youtube.com/watch?v=_mSgHcAhO10
Full recipe: https://www.chefslabo.com/post/fried-rice-traditional-japanese-style-炒飯
`;
  assert.equal(
    extractRecipePageUrl(text),
    "https://www.chefslabo.com/post/fried-rice-traditional-japanese-style-%E7%82%92%E9%A3%AF"
  );
});

test("extractRecipePageUrl unwraps youtube.com/redirect", () => {
  const target =
    "https://www.chefslabo.com/post/fried-rice-traditional-japanese-style";
  const text = `https://www.youtube.com/redirect?event=video_description&q=${encodeURIComponent(target)}`;
  assert.equal(extractRecipePageUrl(text), target);
});

test("extractRecipePageUrl returns null when only video hosts", () => {
  assert.equal(
    extractRecipePageUrl("https://youtu.be/_mSgHcAhO10 https://www.instagram.com/p/abc"),
    null
  );
});

test("unwrapYoutubeRedirect leaves normal URLs", () => {
  assert.equal(
    unwrapYoutubeRedirect("https://www.chefslabo.com/post/fried-rice"),
    "https://www.chefslabo.com/post/fried-rice"
  );
});

test("extractJsonLdRecipe reads schema.org Recipe from any site", () => {
  const html = `<html><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: "Tomato egg",
    recipeIngredient: ["Eggs 2", "Tomato 2 pcs"],
    recipeInstructions: [
      { "@type": "HowToStep", text: "Scramble eggs." },
      { "@type": "HowToStep", text: "Add tomato." },
    ],
  })}</script></html>`;
  const text = extractJsonLdRecipe(html);
  assert.match(text, /Tomato egg/);
  assert.match(text, /Eggs 2/);
  assert.match(text, /Scramble eggs/);
});

test("repairs mojibake percent-encoding of 炒飯 in recipe URLs", () => {
  const raw =
    "https://www.chefslabo.com/post/fried-rice-traditional-japanese-style-%C3%A7%C2%82%C2%92%C3%A9%C2%A3%C2%AF";
  const decoded = decodeURIComponent(new URL(raw).pathname);
  assert.match(repairUtf8Mojibake(decoded), /炒飯/);
  const candidates = recipePageUrlCandidates(raw);
  assert.ok(
    candidates.some((u) => {
      try {
        return decodeURIComponent(new URL(u).pathname).includes("炒飯");
      } catch {
        return u.includes("%E7%82%92");
      }
    }),
    `expected a 炒飯 candidate, got ${candidates.join(" | ")}`
  );
});
