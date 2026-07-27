"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cookDeviceMeta } from "@/lib/cook-devices";
import { getRecipeDisplayName, getRecipeSubtitle } from "@/lib/recipe-display";
import { localized } from "@/lib/localized-text";
import { uiLocale } from "@/lib/i18n";
import type { DinnerRecipe, RecipeIngredient, TonightMenu } from "@/lib/types";

const categoryIcons = { Meat: "🥩", Vegetable: "🥬", Soup: "🍲" } as const;

const ui = {
  tonight: { en: "Tonight's Dinner", fil: "Hapunan Ngayong Gabi", zh: "今晚晚餐" },
  recipe: { en: "Watch video", fil: "Panoorin ang video", zh: "觀看影片" },
  meat: { en: "Meat", fil: "Karne", zh: "肉類" },
  vegetable: { en: "Vegetable", fil: "Gulay", zh: "蔬菜" },
  soup: { en: "Soup", fil: "Sabaw", zh: "湯" },
  loading: { en: "Loading tonight's menu...", fil: "Kinukuha ang menu...", zh: "載入餐單中…" },
  cookAt: {
    en: "Prepare & cook around 6:00 PM for Zizi dinner 6:30–8:00 PM",
    fil: "Maghanda at magluto bandang 6:00 PM — hapunan ni Zizi 6:30–8:00 PM",
    zh: "約下午 6:00 開始準備及烹調 — Zizi 晚餐 6:30–8:00 PM",
  },
  ingredients: { en: "Ingredients", fil: "Mga sangkap", zh: "材料" },
  prepNotes: { en: "Prep notes (for you)", fil: "Prep notes (para sa'yo)", zh: "準備說明" },
  noIngredients: {
    en: "No ingredients listed yet — open recipe link, or ask Sir to add in Admin.",
    fil: "Wala pang ingredients — buksan ang recipe link, o hilingin kay Sir i-add sa Admin.",
    zh: "尚未列出材料 — 可打開食譜連結，或請 Sir 在 Admin 加入。",
  },
  noPrep: {
    en: "No step notes yet. Use the ingredient list + video pictures. Ask Sir/Mum if unsure.",
    fil: "Wala pang step notes. Gamitin ang ingredients + pictures sa video. Tanungin si Sir/Mum kung hindi sure.",
    zh: "尚未有步驟說明。請用材料清單 + 影片畫面。不肯定就問 Sir/Mum。",
  },
  cantoneseNote: {
    en: "Video may be Cantonese — use ingredients + prep notes first.",
    fil: "Baka Cantonese ang video — gamitin muna ang ingredients + prep notes.",
    zh: "影片可能是廣東話 — 請先看材料與準備說明。",
  },
  deviceHowTo: {
    en: "How to cook with this device",
    fil: "Paano lutuin sa device na ito",
    zh: "用此家電怎麼煮",
  },
  epcBanner: {
    en: "Some dishes are marked Cook with EPC17 — use the Tefal pressure cooker (see steps on the card + Tools tab).",
    fil: "May dish na naka-mark Cook with EPC17 — gamitin ang Tefal pressure cooker (steps sa card + Tools tab).",
    zh: "部分菜式標示「用 EPC17 煮」— 請用 Tefal 壓力鍋（見卡片步驟＋家電分頁）。",
  },
  shoppingList: {
    en: "Shopping / prep list",
    fil: "Shopping / prep list",
    zh: "購物／準備清單",
  },
  reminder: {
    en: "Check before 5:00 PM.",
    fil: "Suriin bago 5:00 PM.",
    zh: "請在下午 5:00 前核對。",
  },
};

function ingredientLabel(ing: RecipeIngredient, lang: "en" | "fil" | "zh"): string {
  const name =
    lang === "fil"
      ? ing.fil || ing.en || ing.zh || ""
      : lang === "zh"
        ? ing.zh || ing.en || ing.fil || ""
        : ing.en || ing.fil || ing.zh || "";
  return ing.qty ? `${name} (${ing.qty})` : name;
}

function DishCard({
  label,
  recipe,
  lang,
}: {
  label: { en: string; fil: string; zh: string };
  recipe: DinnerRecipe;
  lang: "en" | "fil" | "zh";
}) {
  const [open, setOpen] = useState(true);
  const subtitle = getRecipeSubtitle(recipe, lang);
  const ings = recipe.ingredients ?? [];
  const prep = localized(recipe.prepNotes, lang);
  const device = cookDeviceMeta(recipe.cookDevice);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xl">{categoryIcons[recipe.category]}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {label[lang]}
        </span>
        {recipe.subCategory && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
            {recipe.subCategory}
          </span>
        )}
        {device && (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 ring-1 ring-teal-200">
            {localized(device.badge, lang)}
          </span>
        )}
      </div>
      <p className="text-base font-semibold text-stone-900">
        {getRecipeDisplayName(recipe, lang)}
      </p>
      {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}

      {device && (
        <div className="mt-3 rounded-xl bg-teal-50/80 p-3 ring-1 ring-teal-100">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-900">
            {ui.deviceHowTo[lang]}
          </p>
          <p className="mt-1 text-[11px] font-medium text-teal-800">
            {localized(device.shortName, lang)}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-teal-950">
            {localized(device.howTo, lang)}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal-800"
      >
        {ui.ingredients[lang]} {open ? "▾" : "▸"}
      </button>
      {open && (
        <div className="mt-2">
          {ings.length === 0 ? (
            <p className="text-xs text-stone-500">{ui.noIngredients[lang]}</p>
          ) : (
            <ul className="space-y-1">
              {ings.map((ing, i) => (
                <li key={`${ing.en}-${i}`} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="mt-0.5 text-teal-600">☐</span>
                  <span>{ingredientLabel(ing, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-600">
          {ui.prepNotes[lang]}
        </p>
        {prep ? (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-800">
            {prep}
          </p>
        ) : (
          <p className="mt-1 text-xs text-stone-500">{ui.noPrep[lang]}</p>
        )}
      </div>

      <a
        href={recipe.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 underline-offset-2 hover:underline"
      >
        {ui.recipe[lang]} →
      </a>
    </article>
  );
}

export function MealsView() {
  const { lang } = useLanguage();
  const [menu, setMenu] = useState<TonightMenu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dinner/tonight")
      .then((r) => r.json())
      .then((data) => setMenu(data.tonight))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shopping = useMemo(() => {
    if (!menu) return [] as { dish: string; line: string }[];
    const rows: { dish: string; line: string }[] = [];
    for (const recipe of [menu.meat, menu.vegetable, menu.soup]) {
      const dish = getRecipeDisplayName(recipe, lang);
      for (const ing of recipe.ingredients ?? []) {
        rows.push({ dish, line: ingredientLabel(ing, lang) });
      }
    }
    return rows;
  }, [menu, lang]);

  if (loading) {
    return (
      <p className="text-center text-sm text-stone-500">{ui.loading[lang]}</p>
    );
  }

  if (!menu) return null;

  const items = [
    { key: "meat" as const, label: ui.meat, recipe: menu.meat },
    { key: "vegetable" as const, label: ui.vegetable, recipe: menu.vegetable },
    { key: "soup" as const, label: ui.soup, recipe: menu.soup },
  ];

  const dateStr = new Date(menu.date + "T12:00:00").toLocaleDateString(
    uiLocale(lang),
    { weekday: "long", month: "short", day: "numeric" }
  );

  const hasDeviceDish = items.some((x) => Boolean(x.recipe.cookDevice));

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-teal-50 px-3 py-2.5 ring-1 ring-teal-100">
        <p className="text-[11px] text-teal-800">{dateStr}</p>
        <h2 className="text-sm font-bold text-teal-950">{ui.tonight[lang]}</h2>
        <p className="mt-0.5 text-xs text-teal-900">{ui.cookAt[lang]}</p>
      </div>

      <p className="text-xs text-stone-500">{ui.cantoneseNote[lang]}</p>

      <div className="rounded-xl bg-amber-50/90 px-3 py-2.5 ring-1 ring-amber-100">
        <p className="text-xs leading-relaxed text-amber-950">
          {hasDeviceDish
            ? ui.epcBanner[lang]
            : lang === "fil"
              ? "Tefal EPC17 pressure cooker: may recipe sa listahan na naka-mark “Luto sa EPC17”. Tingnan Tools → Cooking para sa panel guide."
              : lang === "zh"
                ? "Tefal EPC17 壓力鍋：餐單中有標「用 EPC17 煮」的菜式。面板圖見「家電」→ 煮食。"
                : "Tefal EPC17 pressure cooker: look for dishes marked “Cook with EPC17” in the recipe list. Panel guide: Tools → Cooking."}
        </p>
      </div>

      <div className="space-y-2.5">
        {items.map(({ key, label, recipe }) => (
          <DishCard key={key} label={label} recipe={recipe} lang={lang} />
        ))}
      </div>

      <section className="rounded-2xl bg-white p-3.5 ring-1 ring-stone-100">
        <h3 className="text-sm font-bold text-stone-900">{ui.shoppingList[lang]}</h3>
        <p className="mt-0.5 text-xs text-stone-500">{ui.reminder[lang]}</p>
        {shopping.length === 0 ? (
          <p className="mt-2 text-xs text-stone-500">{ui.noIngredients[lang]}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {shopping.map((row, i) => (
              <li key={`${row.line}-${i}`} className="text-sm text-stone-700">
                ☐ {row.line}
                <span className="ml-1 text-[10px] text-stone-400">({row.dish})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
