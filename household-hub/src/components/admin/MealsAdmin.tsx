"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DinnerRecipe, Lang } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";
import { TranslateButton } from "./TranslateButton";

type Category = DinnerRecipe["category"] | "All";

interface Props {
  lang: Lang;
  saving: boolean;
  onSave: (recipes: DinnerRecipe[]) => Promise<void>;
  setMessage: (msg: string) => void;
}

const emptyRecipe = (): DinnerRecipe => ({
  id: `d-${Date.now()}`,
  index: Date.now(),
  name: "",
  nameEn: "",
  nameFil: "",
  category: "Meat",
  subCategory: "",
  link: "",
});

export function MealsAdmin({ lang, saving, onSave, setMessage }: Props) {
  const [recipes, setRecipes] = useState<DinnerRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DinnerRecipe | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/admin/recipes")
      .then((r) => r.json())
      .then((data) => setRecipes(data.recipes ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = recipes.filter((r) => {
    if (filter !== "All" && r.category !== filter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return [r.name, r.nameEn, r.nameFil, r.subCategory, r.category]
      .filter(Boolean)
      .some((s) => s!.toLowerCase().includes(q));
  });

  const saveAll = async () => {
    await onSave(recipes);
  };

  const upsertRecipe = (recipe: DinnerRecipe) => {
    setRecipes((prev) => {
      const idx = prev.findIndex((r) => r.id === recipe.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = recipe;
        return next.sort((a, b) => a.index - b.index);
      }
      return [...prev, recipe].sort((a, b) => a.index - b.index);
    });
    setEditing(null);
  };

  const deleteRecipe = (id: string) => {
    if (!confirm(adminT("confirmDelete", lang))) return;
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const imported: DinnerRecipe[] = Array.isArray(parsed)
          ? parsed
          : parsed.recipes ?? [];
        if (!imported.length) throw new Error("empty");
        setRecipes((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          for (const r of imported) {
            map.set(r.id, {
              ...emptyRecipe(),
              ...r,
              id: r.id || `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            });
          }
          return [...map.values()].sort((a, b) => a.index - b.index);
        });
        setMessage(adminT("importSuccess", lang));
      } catch {
        setMessage(adminT("importFailed", lang));
      }
    };
    reader.readAsText(file);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ recipes }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dinner-recipes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const translateAllEnToFil = async () => {
    setMessage(adminT("translating", lang));
    const next = [...recipes];
    for (let i = 0; i < next.length; i++) {
      const en = next[i].nameEn?.trim() || (next[i].name.match(/^[a-zA-Z]/) ? next[i].name : "");
      if (!en || next[i].nameFil?.trim()) continue;
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: en }),
      });
      if (res.ok) {
        const { translation } = await res.json();
        next[i] = { ...next[i], nameFil: translation };
      }
    }
    setRecipes(next);
    setMessage("Translation done. Click Save Meals to publish.");
  };

  if (loading) {
    return <p className="text-sm text-stone-500">{adminT("loading", lang)}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="font-semibold text-stone-900">{adminT("mealTitle", lang)}</h2>
        <p className="mt-1 text-sm text-stone-600">{adminT("mealDesc", lang)}</p>
        <p className="mt-1 text-xs text-stone-400">{recipes.length} dishes</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={adminT("searchMeals", lang)}
          className="min-w-[140px] flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        {(["All", "Meat", "Vegetable", "Soup"] as Category[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === cat
                ? "bg-teal-600 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200"
            }`}
          >
            {cat === "All"
              ? adminT("allCategories", lang)
              : adminT(cat.toLowerCase() as "meat" | "vegetable" | "soup", lang)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing(emptyRecipe())}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {adminT("addMeal", lang)}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200"
        >
          {adminT("importMeals", lang)}
        </button>
        <button
          type="button"
          onClick={exportJson}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200"
        >
          {adminT("exportMeals", lang)}
        </button>
        <button
          type="button"
          onClick={translateAllEnToFil}
          className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200"
        >
          {adminT("translateAllMeals", lang)}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="mb-3 font-bold text-stone-900">
              {recipes.some((r) => r.id === editing.id)
                ? adminT("edit", lang)
                : adminT("addMeal", lang)}
            </h3>
            <div className="space-y-2">
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value as DinnerRecipe["category"] })
                }
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="Meat">{adminT("meat", lang)}</option>
                <option value="Vegetable">{adminT("vegetable", lang)}</option>
                <option value="Soup">{adminT("soup", lang)}</option>
              </select>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder={adminT("nameZh", lang)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
              <input
                value={editing.nameEn ?? ""}
                onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                placeholder={adminT("nameEn", lang)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-1">
                <input
                  value={editing.nameFil ?? ""}
                  onChange={(e) => setEditing({ ...editing, nameFil: e.target.value })}
                  placeholder={adminT("nameFil", lang)}
                  className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
                <TranslateButton
                  sourceText={editing.nameEn ?? editing.name}
                  onTranslated={(t) => setEditing({ ...editing, nameFil: t })}
                  lang={lang}
                />
              </div>
              <input
                value={editing.subCategory ?? ""}
                onChange={(e) => setEditing({ ...editing, subCategory: e.target.value })}
                placeholder={adminT("subCategory", lang)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
              <input
                value={editing.link}
                onChange={(e) => setEditing({ ...editing, link: e.target.value })}
                placeholder={adminT("recipeLink", lang)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={editing.index}
                onChange={(e) => setEditing({ ...editing, index: Number(e.target.value) })}
                placeholder="Index"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => upsertRecipe(editing)}
                className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl bg-stone-100 py-2 text-sm font-medium text-stone-700"
              >
                {adminT("cancel", lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe list */}
      <div className="space-y-2">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-stone-200"
          >
            <span className="text-lg">
              {r.category === "Meat" ? "🥩" : r.category === "Vegetable" ? "🥬" : "🍲"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900">
                {r.nameFil || r.nameEn || r.name}
              </p>
              <p className="truncate text-xs text-stone-500">
                {r.name !== (r.nameFil || r.nameEn) ? r.name : r.subCategory}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setEditing({ ...r })}
                className="rounded-lg px-2 py-1 text-xs text-teal-700 ring-1 ring-teal-200"
              >
                {adminT("edit", lang)}
              </button>
              <button
                type="button"
                onClick={() => deleteRecipe(r.id)}
                className="rounded-lg px-2 py-1 text-xs text-red-500 ring-1 ring-red-100"
              >
                {adminT("delete", lang)}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={saveAll}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? adminT("saving", lang) : adminT("saveMeals", lang)}
      </button>
    </div>
  );
}
