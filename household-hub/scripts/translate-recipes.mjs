#!/usr/bin/env node
/**
 * Fill nameEn and nameFil for all dinner recipes using MyMemory translate API.
 * Usage: node scripts/translate-recipes.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const path = join(process.cwd(), "data", "dinner-recipes.json");
const data = JSON.parse(readFileSync(path, "utf-8"));

function hasCjk(text) {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

function isLatin(text) {
  if (!text?.trim()) return false;
  const latin = (text.match(/[a-zA-Z0-9\s\-',.&()/]/g) ?? []).length;
  return latin / text.length > 0.55;
}

async function translate(text, langpair) {
  if (!text.trim()) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.responseData?.translatedText?.trim() ?? text;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Known manual overrides for common dishes (better quality)
const manual = {
  "牛油蒜片香煎比目魚": {
    nameEn: "Pan-fried Halibut with Garlic Butter",
    nameFil: "Piniritong Halibut na may Bawang at Mentega",
  },
  "芝士吞拿魚焗西蘭花": {
    nameEn: "Baked Broccoli with Tuna and Cheese",
    nameFil: "Broccoli na may Tuna at Keso",
  },
  "蒜頭洋蔥雞湯": {
    nameEn: "Garlic Onion Chicken Soup",
    nameFil: "Sopas na Manok na may Bawang at Sibuyas",
  },
  "蜜椒薯仔牛柳粒": {
    nameEn: "Honey Pepper Beef with Potato Cubes",
    nameFil: "Baka na may Pulot at Paminta na may Patatas",
  },
  "金華火腿津白": {
    nameEn: "Creamed Cabbage with Ham",
    nameFil: "Repolyo na may Ham at Cream",
  },
};

let updated = 0;
for (const r of data.recipes) {
  if (manual[r.name]) {
    Object.assign(r, manual[r.name]);
    updated++;
    continue;
  }

  // Determine English source
  let enSource = r.name;
  if (r.nameEn && isLatin(r.nameEn) && !hasCjk(r.nameEn)) {
    enSource = r.nameEn;
  } else if (hasCjk(r.name)) {
    // Translate Chinese name to English
    enSource = await translate(r.name, "zh-CN|en");
    await sleep(350);
  } else if (isLatin(r.name)) {
    enSource = r.name;
  }

  if (!r.nameEn || hasCjk(r.nameEn) || !isLatin(r.nameEn)) {
    r.nameEn = enSource;
    updated++;
  }

  if (!r.nameFil?.trim()) {
    r.nameFil = await translate(r.nameEn, "en|tl");
    await sleep(350);
    updated++;
  }

  process.stdout.write(".");
}

writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
console.log(`\nDone. Updated fields on ${updated} recipe entries.`);
