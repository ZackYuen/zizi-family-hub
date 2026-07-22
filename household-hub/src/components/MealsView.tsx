"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  cantoneseBanner: {
    en: "YouTube may be Cantonese — use this checklist first",
    fil: "Baka Cantonese ang YouTube — gamitin muna ang checklist na ito",
    zh: "YouTube 可能是廣東話 — 請先跟此清單",
  },
  cantoneseBody: {
    en: "1) Check ingredients  2) Read prep notes  3) Open video for visuals (heat / timing). Ask Sir/Mum before guessing.",
    fil: "1) Suriin ang ingredients  2) Basahin ang prep notes  3) Buksan ang video para sa visuals (init / timing). Tanungin si Sir/Mum bago mag-guess.",
    zh: "1) 核對材料  2) 看準備說明  3) 打開影片對照畫面（火候／時間）。不要猜測，先問 Sir/Mum。",
  },
  shoppingList: {
    en: "Tonight's shopping / prep list",
    fil: "Shopping / prep list ngayong gabi",
    zh: "今晚購物／準備清單",
  },
  reminder: {
    en: "Check you have everything before 5:00 PM.",
    fil: "Suriin kung kompleto bago 5:00 PM.",
    zh: "請在下午 5:00 前核對材料是否齊全。",
  },
  askCook: {
    en: 'Tip: Ask the bot “How to cook tonight?” for the same helper text.',
    fil: "Tip: Tanungin ang bot “Paano magluto ngayong gabi?” para sa parehong helper.",
    zh: "提示：可問 bot「今晚怎麼煮？」取得相同協助。",
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

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{categoryIcons[recipe.category]}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {label[lang]}
        </span>
        {recipe.subCategory && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
            {recipe.subCategory}
          </span>
        )}
      </div>
      <p className="text-base font-semibold text-stone-900">
        {getRecipeDisplayName(recipe, lang)}
      </p>
      {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}

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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-4 text-white shadow-md">
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
          {dateStr}
        </p>
        <h2 className="mt-1 text-lg font-bold">{ui.tonight[lang]}</h2>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <h3 className="text-sm font-bold text-amber-950">{ui.cantoneseBanner[lang]}</h3>
        <p className="mt-1 text-sm leading-relaxed text-amber-900">
          {ui.cantoneseBody[lang]}
        </p>
        <p className="mt-2 text-xs text-amber-800/90">{ui.askCook[lang]}</p>
      </div>

      <div className="space-y-3">
        {items.map(({ key, label, recipe }) => (
          <DishCard key={key} label={label} recipe={recipe} lang={lang} />
        ))}
      </div>

      <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
        <h3 className="text-sm font-bold text-amber-950">{ui.shoppingList[lang]}</h3>
        <p className="mt-1 text-xs text-amber-800">{ui.reminder[lang]}</p>
        {shopping.length === 0 ? (
          <p className="mt-2 text-xs text-amber-800/80">{ui.noIngredients[lang]}</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {shopping.map((row, i) => (
              <li key={`${row.line}-${i}`} className="text-sm text-amber-950">
                ☐ {row.line}
                <span className="ml-1 text-[10px] text-amber-700/80">({row.dish})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="rounded-xl bg-white px-3 py-2 text-xs text-stone-600 ring-1 ring-stone-100">
        {ui.cookAt[lang]}
      </p>
    </div>
  );
}
