import type { DinnerRecipe } from "./types";

export function instagramShortcode(url: string): string | null {
  const u = url.trim();
  const m =
    u.match(
      /(?:instagram\.com|instagr\.am)\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]{5,})/i
    );
  return m?.[1] ?? null;
}

export function canonicalInstagramUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${shortcode}/`;
}

export function isRecipeMediaUrl(url: string): boolean {
  return /youtu\.?be|youtube\.com/i.test(url) || Boolean(instagramShortcode(url));
}

export function parseAddCommand(question: string): { url: string } | null {
  const q = question.trim();
  const m = q.match(/^add(?:\s+meal|\s+recipe)?\s+([\s\S]+)$/i);
  if (!m) return null;
  const rest = m[1]
    .trim()
    .replace(/^["“«]+/, "")
    .replace(/["”»]+$/, "")
    .trim();
  const raw =
    rest.match(/https?:\/\/\S+/i)?.[0]?.replace(/[),.;]+$/g, "") ||
    rest.match(/(?:youtu\.be\/|youtube\.com\/|instagram\.com\/|instagr\.am\/)\S+/i)?.[0];
  if (!raw) return null;
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (!isRecipeMediaUrl(href)) return null;
  return { url: href };
}

export function inferRecipeCategory(blob: string): DinnerRecipe["category"] {
  const t = blob.toLowerCase();
  if (/soup|湯|sabaw|broth|味噌|miso\s*soup|燉湯|煲湯/.test(t)) return "Soup";
  const hasVeg =
    /vegetable|veggie|蔬菜|gulay|tofu|豆腐|cabbage|白菜|broccoli|spinach|kangkong|茄子|eggplant|青菜/.test(
      t
    );
  const hasMeat =
    /pork|beef|chicken|lamb|mutton|fish|salmon|shrimp|prawn|肉|豬|牛|雞|魚|蝦|karne/.test(
      t
    );
  if (hasVeg && !hasMeat) return "Vegetable";
  return "Meat";
}
