"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { hongKongDateKey } from "@/lib/dinner";
import { getRecipeDisplayName } from "@/lib/recipe-display";
import type { DinnerRecipe, Lang, TonightMenu } from "@/lib/types";

function recipeLabel(r: DinnerRecipe, lang: Lang): string {
  return getRecipeDisplayName(r, lang);
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
  const [meatId, setMeatId] = useState("");
  const [vegetableId, setVegetableId] = useState("");
  const [soupId, setSoupId] = useState("");
  const [overridden, setOverridden] = useState(false);
  const [preview, setPreview] = useState<TonightMenu | null>(null);
  const [busy, setBusy] = useState(false);

  const meats = useMemo(
    () => recipes.filter((r) => r.category === "Meat").sort((a, b) => a.index - b.index),
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
    () => recipes.filter((r) => r.category === "Soup").sort((a, b) => a.index - b.index),
    [recipes]
  );

  const load = useCallback(async (d: string) => {
    const res = await fetch(`/api/admin/dinner-override?date=${encodeURIComponent(d)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to load tonight override");
      return;
    }
    const t = data.tonight as TonightMenu | undefined;
    setPreview(t ?? null);
    setOverridden(Boolean(data.override) || Boolean(t?.overridden));
    if (t) {
      setMeatId(t.meat.id);
      setVegetableId(t.vegetable.id);
      setSoupId(t.soup.id);
    }
  }, [setMessage]);

  useEffect(() => {
    if (!recipes.length) return;
    void load(date);
  }, [date, recipes.length, load]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/dinner-override", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, meatId, vegetableId, soupId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Save failed");
        return;
      }
      setPreview(data.tonight ?? null);
      setOverridden(true);
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
      if (t) {
        setMeatId(t.meat.id);
        setVegetableId(t.vegetable.id);
        setSoupId(t.soup.id);
      }
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
      en: "Daily random pick is the default. If tonight’s dishes are not OK, choose Meat / Vegetable / Soup here and Save. Clear restores random for that date.",
      fil: "Default: random araw-araw. Kung hindi OK ang dishes ngayong gabi, pumili ng Meat / Vegetable / Soup dito at Save. Clear = balik sa random.",
      zh: "默认按日期随机。若今晚不合适，可在此自选肉／菜／汤并储存。清除后该日恢复随机。",
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
    save: { en: "Save tonight’s picks", fil: "I-save ang choices", zh: "储存今晚选择" },
    clear: { en: "Clear → random again", fil: "Clear → random ulit", zh: "清除 → 恢复随机" },
  } as const;

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
        <label className="block text-xs">
          <span className="font-bold text-amber-900">Meat</span>
          <select
            value={meatId}
            onChange={(e) => setMeatId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-sm"
          >
            {meats.map((r) => (
              <option key={r.id} value={r.id}>
                {recipeLabel(r, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-bold text-amber-900">Vegetable</span>
          <select
            value={vegetableId}
            onChange={(e) => setVegetableId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-sm"
          >
            {vegetables.map((r) => (
              <option key={r.id} value={r.id}>
                {recipeLabel(r, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-bold text-amber-900">Soup</span>
          <select
            value={soupId}
            onChange={(e) => setSoupId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-sm"
          >
            {soups.map((r) => (
              <option key={r.id} value={r.id}>
                {recipeLabel(r, lang)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !meatId || !vegetableId || !soupId}
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

      {preview && (
        <p className="mt-3 text-xs text-amber-900">
          Preview: {recipeLabel(preview.meat, lang)} ·{" "}
          {recipeLabel(preview.vegetable, lang)} ·{" "}
          {recipeLabel(preview.soup, lang)}
        </p>
      )}
    </div>
  );
}
