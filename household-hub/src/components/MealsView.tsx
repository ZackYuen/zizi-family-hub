"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cookDeviceMeta } from "@/lib/cook-devices";
import { isGenericDevicePrepNotes } from "@/lib/cook-device-suggest";
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
    en: "Cook step on this device",
    fil: "Cook step sa device na ito",
    zh: "用此家電的煮食步驟",
  },
  deviceBasics: {
    en: "Device basics (same for all dishes on this machine)",
    fil: "Device basics (pareho sa lahat ng dish sa machine na ito)",
    zh: "機具基本（此機所有菜相同）",
  },
  mode: { en: "Mode", fil: "Mode", zh: "模式" },
  temp: { en: "Temp", fil: "Temp", zh: "溫度" },
  time: { en: "Time", fil: "Oras", zh: "時間" },
  minutesUnit: { en: "min", fil: "min", zh: "分鐘" },
  followPrepFirst: {
    en: "Follow prep notes for wash / cut / blanch. Device tip is only for the cook step.",
    fil: "Sundin muna ang prep notes (hugas / hiwa / blanch). Device tip = cook step lang.",
    zh: "洗／切／飛水請跟準備說明。家電提示只代替「煮／炆／炸」那一步。",
  },
  deviceBanner: {
    en: "Dishes may be marked Cook with EPC17 or Cook with Easy Fry — follow the how-to on the card (panel map in Tools).",
    fil: "May dish na naka-mark Cook with EPC17 o Cook with Easy Fry — sundin ang how-to sa card (panel map sa Tools).",
    zh: "菜式可能標「用 EPC17 煮」或「用 Easy Fry 煮」— 請跟卡片步驟（面板圖見家電分頁）。",
  },
  deviceBannerGeneric: {
    en: "Tefal kitchen helpers: look for “Cook with EPC17” (pressure) or “Cook with Easy Fry” (air fryer) on dishes. Panel guides: Tools → Cooking.",
    fil: "Tefal helpers: hanapin ang “Luto sa EPC17” (pressure) o “Luto sa Easy Fry” (air fryer). Panel guides: Tools → Cooking.",
    zh: "Tefal 煮食家電：餐單中有「用 EPC17 煮」（壓力鍋）或「用 Easy Fry 煮」（氣炸鍋）。面板圖：家電 → 煮食。",
  },
  customPick: {
    en: "Custom pick (Sir/Mum chose tonight)",
    fil: "Custom pick (pinili nina Sir/Mum)",
    zh: "自选（Sir/Mum 已选今晚）",
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
  findDish: {
    en: "Find another dish",
    fil: "Maghanap ng ibang ulam",
    zh: "搜尋其他菜式",
  },
  findDishHint: {
    en: "Mum asked for a different dish? Type the name, tap one result.",
    fil: "May ibang ulam si Mum? I-type ang pangalan, tapos piliin.",
    zh: "Mum 要換菜？輸入菜名，點一下結果即可。",
  },
  searchPlaceholder: {
    en: "e.g. chicken, soup, tofu…",
    fil: "hal. chicken, soup, tofu…",
    zh: "例如 chicken、湯、豆腐…",
  },
  searchLoading: {
    en: "Loading dishes…",
    fil: "Kinukuha ang mga ulam…",
    zh: "載入菜式中…",
  },
  noMatches: {
    en: "No match. Try another word.",
    fil: "Walang tumugma. Subukan ang ibang salita.",
    zh: "沒有符合。試其他字。",
  },
  typeToSearch: {
    en: "Type 2+ letters to search.",
    fil: "Mag-type ng 2+ letra.",
    zh: "輸入至少 2 個字。",
  },
  matches: {
    en: (n: number) => `${n} found — tap one`,
    fil: (n: number) => `${n} nahanap — piliin`,
    zh: (n: number) => `找到 ${n} 道 — 點選`,
  },
  showMore: {
    en: (n: number) => `Show ${n} more`,
    fil: (n: number) => `Ipakita ang ${n} pa`,
    zh: (n: number) => `再顯示 ${n} 道`,
  },
  backToResults: {
    en: "← Back to results",
    fil: "← Bumalik sa results",
    zh: "← 返回結果",
  },
  clearSearch: {
    en: "Clear",
    fil: "Clear",
    zh: "清除",
  },
  changeDish: {
    en: "Change dish",
    fil: "Palitan ang ulam",
    zh: "換一道菜",
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

function categoryLabel(
  category: DinnerRecipe["category"],
  lang: "en" | "fil" | "zh"
): { en: string; fil: string; zh: string } {
  if (category === "Meat") return ui.meat;
  if (category === "Vegetable") return ui.vegetable;
  return ui.soup;
}

function DishCard({
  label,
  recipe,
  lang,
  defaultOpen = true,
}: {
  label: { en: string; fil: string; zh: string };
  recipe: DinnerRecipe;
  lang: "en" | "fil" | "zh";
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [basicsOpen, setBasicsOpen] = useState(false);
  const subtitle = getRecipeSubtitle(recipe, lang);
  const ings = recipe.ingredients ?? [];
  const prepRaw = localized(recipe.prepNotes, lang);
  const device = cookDeviceMeta(recipe.cookDevice);
  const settings = recipe.cookSettings;
  const dishSteps = settings ? localized(settings.steps, lang) : null;
  const prepIsGeneric = isGenericDevicePrepNotes(
    recipe.prepNotes,
    recipe.cookDevice
  );
  const prep = prepIsGeneric ? "" : prepRaw;
  // Dish prep notes are primary. Device tip is only the cook-phase helper.
  const showPrepBox = Boolean(prep);

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

      {showPrepBox && (
        <div className="mt-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-600">
            {ui.prepNotes[lang]}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-800">
            {prep}
          </p>
        </div>
      )}

      {device && (
        <div className="mt-3 rounded-xl bg-teal-50/80 p-3 ring-1 ring-teal-100">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-900">
            {ui.deviceHowTo[lang]}
          </p>
          <p className="mt-1 text-[11px] font-medium text-teal-800">
            {localized(device.shortName, lang)}
          </p>
          {showPrepBox && (
            <p className="mt-1 text-[11px] leading-snug text-teal-900/80">
              {ui.followPrepFirst[lang]}
            </p>
          )}

          {settings ? (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-teal-900 ring-1 ring-teal-200">
                  {ui.mode[lang]}: {localized(settings.mode, lang)}
                </span>
                {settings.tempC && (
                  <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-teal-900 ring-1 ring-teal-200">
                    {ui.temp[lang]}: {settings.tempC}°C
                  </span>
                )}
                <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-teal-900 ring-1 ring-teal-200">
                  {ui.time[lang]}: {settings.minutes} {ui.minutesUnit[lang]}
                </span>
              </div>
              {(!showPrepBox ||
                /Device cook step only|僅代替|Cook step lang sa device/i.test(
                  `${settings.steps.en}\n${settings.steps.zh || ""}`
                )) && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-teal-950">
                  {dishSteps}
                </p>
              )}
            </>
          ) : !showPrepBox && prepRaw ? (
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-teal-950">
              {prepRaw}
            </p>
          ) : !showPrepBox ? (
            <p className="mt-1 text-xs text-teal-800">{ui.noPrep[lang]}</p>
          ) : null}

          <button
            type="button"
            onClick={() => setBasicsOpen((v) => !v)}
            className="mt-2 text-[11px] font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            {ui.deviceBasics[lang]} {basicsOpen ? "▾" : "▸"}
          </button>
          {basicsOpen && (
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-teal-900/80">
              {localized(device.howTo, lang)}
            </p>
          )}
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

      {!device && !showPrepBox && (
        <div className="mt-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-600">
            {ui.prepNotes[lang]}
          </p>
          <p className="mt-1 text-xs text-stone-500">{ui.noPrep[lang]}</p>
        </div>
      )}

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

function RecipeSearch({ lang }: { lang: "en" | "fil" | "zh" }) {
  const [recipes, setRecipes] = useState<DinnerRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    fetch("/api/dinner/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(data.recipes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const matches = useMemo(() => {
    if (deferredSearch.length < 2) return [] as DinnerRecipe[];
    return recipes.filter((r) =>
      [r.name, r.nameEn, r.nameFil, r.subCategory, r.category]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(deferredSearch))
    );
  }, [recipes, deferredSearch]);

  const selected = selectedId
    ? recipes.find((r) => r.id === selectedId) ?? null
    : null;

  const visible = showAll ? matches.slice(0, 30) : matches.slice(0, 6);
  const hiddenCount = Math.min(matches.length, 30) - visible.length;

  useEffect(() => {
    if (!selectedId || !detailRef.current) return;
    detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId]);

  const pickDish = (id: string) => {
    setSelectedId(id);
  };

  const backToResults = () => {
    setSelectedId(null);
  };

  const clearAll = () => {
    setSearch("");
    setSelectedId(null);
    setShowAll(false);
  };

  return (
    <section className="space-y-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-stone-100">
      <div>
        <h3 className="text-sm font-bold text-stone-900">{ui.findDish[lang]}</h3>
        <p className="mt-0.5 text-xs text-stone-500">{ui.findDishHint[lang]}</p>
      </div>

      {!selected && (
        <>
          <div className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowAll(false);
              }}
              placeholder={ui.searchPlaceholder[lang]}
              className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-900 placeholder:text-stone-400"
              autoComplete="off"
              enterKeyHint="search"
            />
            {search && (
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 rounded-xl bg-stone-100 px-3 text-sm font-medium text-stone-600"
              >
                {ui.clearSearch[lang]}
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-stone-500">{ui.searchLoading[lang]}</p>
          ) : deferredSearch.length < 2 ? (
            <p className="text-xs text-stone-500">{ui.typeToSearch[lang]}</p>
          ) : matches.length === 0 ? (
            <p className="text-xs text-stone-500">{ui.noMatches[lang]}</p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-stone-500">
                {ui.matches[lang](matches.length)}
              </p>
              <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl ring-1 ring-stone-200">
                {visible.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => pickDish(r.id)}
                      className="flex w-full items-center gap-3 bg-white px-3 py-3.5 text-left active:bg-teal-50"
                    >
                      <span className="text-lg">{categoryIcons[r.category]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug text-stone-900">
                          {getRecipeDisplayName(r, lang)}
                        </span>
                        <span className="mt-0.5 block text-xs text-stone-500">
                          {categoryLabel(r.category, lang)[lang]}
                          {r.subCategory ? ` · ${r.subCategory}` : ""}
                          {r.cookDevice ? " · 🍳" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-stone-300" aria-hidden>
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold text-teal-800"
                >
                  {ui.showMore[lang](hiddenCount)}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {selected && (
        <div ref={detailRef} className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={backToResults}
              className="rounded-xl bg-teal-700 px-3.5 py-2.5 text-sm font-semibold text-white"
            >
              {ui.backToResults[lang]}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl bg-stone-100 px-3 py-2.5 text-sm font-medium text-stone-600"
            >
              {ui.changeDish[lang]}
            </button>
          </div>
          <DishCard
            key={selected.id}
            label={categoryLabel(selected.category, lang)}
            recipe={selected}
            lang={lang}
            defaultOpen
          />
        </div>
      )}
    </section>
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
        {menu.overridden && (
          <p className="mt-1 text-[11px] font-semibold text-teal-800">
            {ui.customPick[lang]}
          </p>
        )}
      </div>

      <p className="text-xs text-stone-500">{ui.cantoneseNote[lang]}</p>

      <div className="rounded-xl bg-amber-50/90 px-3 py-2.5 ring-1 ring-amber-100">
        <p className="text-xs leading-relaxed text-amber-950">
          {hasDeviceDish ? ui.deviceBanner[lang] : ui.deviceBannerGeneric[lang]}
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

      <RecipeSearch lang={lang} />
    </div>
  );
}
