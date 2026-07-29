"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { hongKongDateKey, tonightDishes } from "@/lib/dinner";
import { getRecipeDisplayName } from "@/lib/recipe-display";
import type { DinnerRecipe, Lang, TonightMenu } from "@/lib/types";

function recipeLabel(r: DinnerRecipe, lang: Lang): string {
  return getRecipeDisplayName(r, lang);
}

function CategorySlots({
  label,
  lang,
  pool,
  ids,
  onChange,
  searchPlaceholder,
}: {
  label: string;
  lang: Lang;
  pool: DinnerRecipe[];
  ids: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder: string;
}) {
  const [search, setSearch] = useState("");
  const [pickId, setPickId] = useState("");

  const selected = useMemo(() => {
    return ids
      .map((id) => pool.find((r) => r.id === id))
      .filter((r): r is DinnerRecipe => Boolean(r));
  }, [ids, pool]);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selectedSet = new Set(ids);
    return pool
      .filter((r) => !selectedSet.has(r.id))
      .filter((r) =>
        !q
          ? true
          : [r.name, r.nameEn, r.nameFil, r.subCategory]
              .filter(Boolean)
              .some((s) => s!.toLowerCase().includes(q))
      )
      .sort((a, b) => a.index - b.index);
  }, [pool, ids, search]);

  useEffect(() => {
    if (!available.length) {
      setPickId("");
      return;
    }
    if (!available.some((r) => r.id === pickId)) {
      setPickId(available[0].id);
    }
  }, [available, pickId]);

  return (
    <div className="rounded-lg bg-white/80 p-2.5 ring-1 ring-amber-200">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-amber-950">{label}</span>
        <span className="text-[10px] font-semibold text-amber-800">
          {selected.length}
        </span>
      </div>

      {selected.length === 0 ? (
        <p className="mb-2 text-[11px] text-stone-500">
          {lang === "fil"
            ? "Walang dish — optional"
            : lang === "zh"
              ? "未選（可留空）"
              : "None — optional"}
        </p>
      ) : (
        <ul className="mb-2 space-y-1">
          {selected.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-950"
            >
              <span className="min-w-0 truncate">{recipeLabel(r, lang)}</span>
              <button
                type="button"
                onClick={() => onChange(ids.filter((id) => id !== r.id))}
                className="shrink-0 text-[11px] font-semibold text-red-600"
              >
                {lang === "fil" ? "Alisin" : lang === "zh" ? "移除" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm"
      />
      <div className="mt-1 flex gap-1">
        <select
          value={pickId}
          onChange={(e) => setPickId(e.target.value)}
          disabled={!available.length}
          className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-2 text-sm disabled:opacity-50"
        >
          {!available.length ? (
            <option value="">
              {lang === "fil"
                ? "Wala nang available"
                : lang === "zh"
                  ? "已無可選"
                  : "None left"}
            </option>
          ) : (
            available.map((r) => (
              <option key={r.id} value={r.id}>
                {recipeLabel(r, lang)}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          disabled={!pickId || !available.length}
          onClick={() => {
            if (!pickId) return;
            onChange([...ids, pickId]);
          }}
          className="shrink-0 rounded-lg bg-teal-700 px-2.5 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {lang === "fil" ? "+ Add" : lang === "zh" ? "+ 加" : "+ Add"}
        </button>
      </div>
    </div>
  );
}

export function TonightOverridePanel({
  lang,
  recipes,
  setMessage,
}: {
  lang: Lang;
  recipes: DinnerRecipe[];
  setMessage: (msg: string) => void;
}) {
  const today = hongKongDateKey();
  const [date, setDate] = useState(today);
  const [meatIds, setMeatIds] = useState<string[]>([]);
  const [vegetableIds, setVegetableIds] = useState<string[]>([]);
  const [soupIds, setSoupIds] = useState<string[]>([]);
  const [overridden, setOverridden] = useState(false);
  const [preview, setPreview] = useState<TonightMenu | null>(null);
  const [busy, setBusy] = useState(false);

  const meats = useMemo(
    () =>
      recipes
        .filter((r) => r.category === "Meat")
        .sort((a, b) => a.index - b.index),
    [recipes]
  );
  const vegetables = useMemo(
    () =>
      recipes
        .filter((r) => r.category === "Vegetable")
        .sort((a, b) => a.index - b.index),
    [recipes]
  );
  const soups = useMemo(
    () =>
      recipes
        .filter((r) => r.category === "Soup")
        .sort((a, b) => a.index - b.index),
    [recipes]
  );

  const applyTonight = (t: TonightMenu | undefined) => {
    if (!t) return;
    setMeatIds((t.meat ?? []).map((r) => r.id));
    setVegetableIds((t.vegetable ?? []).map((r) => r.id));
    setSoupIds((t.soup ?? []).map((r) => r.id));
  };

  const load = useCallback(
    async (d: string) => {
      const res = await fetch(
        `/api/admin/dinner-override?date=${encodeURIComponent(d)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Failed to load tonight override");
        return;
      }
      const t = data.tonight as TonightMenu | undefined;
      setPreview(t ?? null);
      setOverridden(Boolean(data.override) || Boolean(t?.overridden));
      applyTonight(t);
    },
    [setMessage]
  );

  useEffect(() => {
    if (!recipes.length) return;
    void load(date);
  }, [date, recipes.length, load]);

  const totalDishes = meatIds.length + vegetableIds.length + soupIds.length;

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/dinner-override", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, meatIds, vegetableIds, soupIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Save failed");
        return;
      }
      setPreview(data.tonight ?? null);
      setOverridden(true);
      applyTonight(data.tonight);
      setMessage(
        lang === "fil"
          ? `Na-save ang menu para sa ${date} (custom pick).`
          : lang === "zh"
            ? `已储存 ${date} 的自选晚餐。`
            : `Saved custom menu for ${date}.`
      );
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/dinner-override", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, clear: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Clear failed");
        return;
      }
      const t = data.tonight as TonightMenu | undefined;
      setPreview(t ?? null);
      setOverridden(false);
      applyTonight(t);
      setMessage(
        lang === "fil"
          ? `Cleared — balik sa random menu para sa ${date}.`
          : lang === "zh"
            ? `已清除 — ${date} 恢复随机餐单。`
            : `Cleared — back to random menu for ${date}.`
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = {
    title: {
      en: "Tonight’s menu (pick yourself)",
      fil: "Menu ngayong gabi (pumili mismo)",
      zh: "今晚晚餐（可自选）",
    },
    hint: {
      en: "Default random = 1 meat + 1 vegetable + 1 soup. Add or remove dishes in any category, then Save. Clear restores random for that date.",
      fil: "Default random = 1 meat + 1 vegetable + 1 soup. Magdagdag o mag-alis ng dish sa kahit anong category, tapos Save. Clear = balik sa random.",
      zh: "默认随机＝1肉＋1菜＋1汤。可在各类别加／减菜式后储存。清除后该日恢复随机。",
    },
    search: {
      en: "Search to add…",
      fil: "Maghanap para mag-add…",
      zh: "搜尋後加入…",
    },
    statusCustom: {
      en: "Custom pick for this date",
      fil: "Custom pick para sa araw na ito",
      zh: "此日为自选",
    },
    statusRandom: {
      en: "Random for this date",
      fil: "Random para sa araw na ito",
      zh: "此日为随机",
    },
    save: {
      en: "Save tonight’s picks",
      fil: "I-save ang choices",
      zh: "储存今晚选择",
    },
    clear: {
      en: "Clear → random again",
      fil: "Clear → random ulit",
      zh: "清除 → 恢复随机",
    },
  } as const;

  const previewDishes = tonightDishes(preview);

  return (
    <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <h2 className="font-semibold text-amber-950">{copy.title[lang]}</h2>
      <p className="mt-1 text-sm text-amber-900">{copy.hint[lang]}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-amber-800">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setDate(today)}
          className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-amber-900 ring-1 ring-amber-200"
        >
          Today (HK)
        </button>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            overridden
              ? "bg-teal-100 text-teal-900"
              : "bg-stone-100 text-stone-600"
          }`}
        >
          {overridden ? copy.statusCustom[lang] : copy.statusRandom[lang]}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <CategorySlots
          label="Meat"
          lang={lang}
          pool={meats}
          ids={meatIds}
          onChange={setMeatIds}
          searchPlaceholder={copy.search[lang]}
        />
        <CategorySlots
          label="Vegetable"
          lang={lang}
          pool={vegetables}
          ids={vegetableIds}
          onChange={setVegetableIds}
          searchPlaceholder={copy.search[lang]}
        />
        <CategorySlots
          label="Soup"
          lang={lang}
          pool={soups}
          ids={soupIds}
          onChange={setSoupIds}
          searchPlaceholder={copy.search[lang]}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || totalDishes === 0}
          onClick={() => void save()}
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {copy.save[lang]}
        </button>
        <button
          type="button"
          disabled={busy || !overridden}
          onClick={() => void clear()}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-300 disabled:opacity-50"
        >
          {copy.clear[lang]}
        </button>
      </div>

      {previewDishes.length > 0 && (
        <p className="mt-3 text-xs text-amber-900">
          Preview:{" "}
          {previewDishes.map((d) => recipeLabel(d, lang)).join(" · ")}
        </p>
      )}
    </div>
  );
}
