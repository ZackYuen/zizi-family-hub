"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRecipeDisplayName, getRecipeSubtitle } from "@/lib/recipe-display";
import type { TonightMenu } from "@/lib/types";

const categoryIcons = { Meat: "🥩", Vegetable: "🥬", Soup: "🍲" } as const;

const ui = {
  tonight: { en: "Tonight's Dinner", fil: "Hapunan Ngayong Gabi" },
  recipe: { en: "Recipe", fil: "Recipe" },
  meat: { en: "Meat", fil: "Karne" },
  vegetable: { en: "Vegetable", fil: "Gulay" },
  soup: { en: "Soup", fil: "Sabaw" },
  loading: { en: "Loading tonight's menu...", fil: "Kinukuha ang menu..." },
  cookAt: {
    en: "Prepare & cook around 6:00 PM for Zizi dinner 6:30–8:00 PM",
    fil: "Maghanda at magluto bandang 6:00 PM — hapunan ni Zizi 6:30–8:00 PM",
  },
};

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
    lang === "fil" ? "fil-PH" : "en-HK",
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

      <div className="space-y-3">
        {items.map(({ key, label, recipe }) => (
          <article
            key={key}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
          >
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
            {getRecipeSubtitle(recipe, lang) && (
              <p className="text-xs text-stone-400">{getRecipeSubtitle(recipe, lang)}</p>
            )}
            <a
              href={recipe.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-700 underline-offset-2 hover:underline"
            >
              {ui.recipe[lang]} →
            </a>
          </article>
        ))}
      </div>

      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
        {ui.cookAt[lang]}
      </p>
    </div>
  );
}
