"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FrontendVisitItem, Lang } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";

interface Props {
  lang: Lang;
  setMessage: (msg: string) => void;
}

const SURFACE_LABEL: Record<string, { en: string; fil: string; zh: string }> = {
  open: { en: "Opened app", fil: "Binuksan ang app", zh: "打開 App" },
  howto: { en: "How-to (?)", fil: "How-to (?)", zh: "使用說明 (?)" },
  schedule: { en: "Schedule", fil: "Schedule", zh: "日程" },
  meals: { en: "Meals", fil: "Meals", zh: "膳食" },
  tools: { en: "Tools", fil: "Tools", zh: "家電" },
  ask: { en: "Ask", fil: "Ask", zh: "提問" },
  hkLife: { en: "HK Life", fil: "HK Life", zh: "香港生活" },
  rules: { en: "House Rules", fil: "House Rules", zh: "家規" },
};

export function VisitLogAdmin({ lang, setMessage }: Props) {
  const [items, setItems] = useState<FrontendVisitItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filterName, setFilterName] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/visits")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setUpdatedAt(data.updatedAt ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clearAll = async () => {
    if (!window.confirm(adminT("visitsClearConfirm", lang))) return;
    setBusy(true);
    const res = await fetch("/api/admin/visits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || adminT("saveFailed", lang));
      return;
    }
    setItems(data.log?.items ?? []);
    setUpdatedAt(data.log?.updatedAt ?? null);
    setMessage(data.message || adminT("saved", lang));
  };

  const visible = useMemo(() => {
    const q = filterName.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const blob = `${i.displayName || ""} ${i.email || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [items, filterName]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-950 ring-1 ring-sky-100">
        <p className="font-semibold">{adminT("visitsHintTitle", lang)}</p>
        <p className="mt-0.5 whitespace-pre-line">{adminT("visitsHintBody", lang)}</p>
        {updatedAt && (
          <p className="mt-1 text-[11px] text-sky-800/80">
            Updated · {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder={adminT("visitsFilterPlaceholder", lang)}
          className="min-w-[10rem] flex-1 rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-stone-200"
        />
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-stone-200"
        >
          {adminT("refresh", lang)}
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={busy || items.length === 0}
          className="rounded-lg bg-white px-3 py-1.5 text-sm text-red-700 ring-1 ring-red-200 disabled:opacity-50"
        >
          {adminT("visitsClear", lang)}
        </button>
      </div>

      {loading && <p className="text-sm text-stone-500">{adminT("loading", lang)}</p>}

      {!loading && visible.length === 0 && (
        <p className="rounded-xl bg-white p-4 text-sm text-stone-500 ring-1 ring-stone-200">
          {adminT("visitsEmpty", lang)}
        </p>
      )}

      <div className="space-y-2">
        {visible.map((item) => {
          const label =
            SURFACE_LABEL[item.surface]?.[lang] ||
            SURFACE_LABEL[item.surface]?.en ||
            item.surface;
          return (
            <article
              key={item.id}
              className="rounded-xl bg-white px-3.5 py-3 ring-1 ring-stone-200"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-stone-900">
                  {item.displayName || "Visitor"}
                  {item.email && (
                    <span className="ml-1.5 text-xs font-normal text-stone-500">
                      {item.email}
                    </span>
                  )}
                </p>
                <time className="text-[11px] text-stone-500">
                  {new Date(item.ts).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-sm text-stone-700">
                <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-900 ring-1 ring-sky-100">
                  {label}
                </span>
                {item.lang && (
                  <span className="ml-2 text-[11px] uppercase text-stone-400">
                    {item.lang}
                  </span>
                )}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
