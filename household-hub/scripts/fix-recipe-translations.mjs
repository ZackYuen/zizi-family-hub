#!/usr/bin/env node
/** Fix bad auto-translations and apply readable EN/FIL names */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const path = join(process.cwd(), "data", "dinner-recipes.json");
const data = JSON.parse(readFileSync(path, "utf-8"));

const byId = {
  "d-1450": {
    nameEn: "Pan-fried Halibut with Garlic Butter",
    nameFil: "Piniritong Halibut na may Bawang at Mentega",
  },
  "d-65": {
    nameEn: "Baked Broccoli with Tuna and Cheese",
    nameFil: "Broccoli na may Tuna at Keso",
  },
  "d-119": {
    nameEn: "Garlic Onion Chicken Soup",
    nameFil: "Sopas na Manok na may Bawang at Sibuyas",
  },
  "d-7": {
    nameEn: "Honey Pepper Beef with Potato Cubes",
    nameFil: "Baka na may Pulot at Paminta na may Patatas",
  },
  "d-88": {
    nameEn: "Creamed Cabbage with Ham",
    nameFil: "Repolyo na may Ham at Cream",
  },
};

const subTemplates = {
  Meat: {
    Pork: { en: "Pork Dish", fil: "Ulam na Baboy" },
    Beef: { en: "Beef Dish", fil: "Ulam na Baka" },
    Chicken: { en: "Chicken Dish", fil: "Ulam na Manok" },
    Fish: { en: "Fish Dish", fil: "Ulam na Isda" },
    Salmon: { en: "Salmon Dish", fil: "Ulam na Salmon" },
    Shrimp: { en: "Shrimp Dish", fil: "Ulam na Hipon" },
    Egg: { en: "Egg Dish", fil: "Ulam na Itlog" },
    Mutton: { en: "Mutton Dish", fil: "Ulam na Kambing" },
    _default: { en: "Meat Dish", fil: "Ulam na Karne" },
  },
  Vegetable: {
    Broccoli: { en: "Broccoli Dish", fil: "Ulam na Broccoli" },
    Mushrooms: { en: "Mushroom Dish", fil: "Ulam na Kabute" },
    Tomato: { en: "Tomato Dish", fil: "Ulam na Kamatis" },
    "Green Beans": { en: "Green Bean Dish", fil: "Ulam na Sitaw" },
    Pumpkin: { en: "Pumpkin Dish", fil: "Ulam na Kalabasa" },
    Tofu: { en: "Tofu Dish", fil: "Ulam na Tofu" },
    Spinach: { en: "Spinach Dish", fil: "Ulam na Spinach" },
    Kale: { en: "Kale Dish", fil: "Ulam na Kale" },
    _default: { en: "Vegetable Dish", fil: "Ulam na Gulay" },
  },
  Soup: {
    Chicken: { en: "Chicken Soup", fil: "Sopas na Manok" },
    Beef: { en: "Beef Soup", fil: "Sabaw na Baka" },
    Fish: { en: "Fish Soup", fil: "Sabaw na Isda" },
    Tofu: { en: "Tofu Soup", fil: "Sabaw na Tofu" },
    Pumpkin: { en: "Pumpkin Soup", fil: "Sabaw na Kalabasa" },
    Onion: { en: "Onion Soup", fil: "Sabaw na Sibuyas" },
    Shrimp: { en: "Shrimp Soup", fil: "Sabaw na Hipon" },
    _default: { en: "Soup", fil: "Sabaw" },
  },
};

function isBad(text) {
  if (!text?.trim()) return true;
  if (/@|Email|sportbenzin|salmo\.ee/i.test(text)) return true;
  if (/orchid|ratio of garlic|rotten|Chiton/i.test(text)) return true;
  return false;
}

function isLatin(text) {
  if (!text?.trim()) return false;
  if (/[\u4e00-\u9fff]/.test(text)) return false;
  const latin = (text.match(/[a-zA-Z0-9\s\-',.&()/]/g) ?? []).length;
  return latin / text.length > 0.55;
}

function templateFor(r) {
  const cat = subTemplates[r.category] ?? subTemplates.Meat;
  const sub = r.subCategory && cat[r.subCategory] ? cat[r.subCategory] : cat._default;
  return sub;
}

let fixed = 0;
for (const r of data.recipes) {
  if (byId[r.id]) {
    Object.assign(r, byId[r.id]);
    fixed++;
    continue;
  }

  const tpl = templateFor(r);

  if (isBad(r.nameEn) || !isLatin(r.nameEn)) {
    r.nameEn = tpl.en;
    fixed++;
  }

  if (isBad(r.nameFil)) {
    r.nameFil = tpl.fil;
    fixed++;
  } else if (!r.nameFil?.trim() && isLatin(r.nameEn)) {
    // keep good nameFil from translate script if valid
    r.nameFil = tpl.fil;
    fixed++;
  }
}

writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
console.log(`Fixed ${fixed} recipe name fields.`);
