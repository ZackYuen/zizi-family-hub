"use client";

import { useCallback, useEffect, useState } from "react";
import type { DinnerRecipe, Lang, WhatsAppInboxItem } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";

interface Props {
  lang: Lang;
  setMessage: (msg: string) => void;
}

export function InboxAdmin({ lang, setMessage }: Props) {
  const [items, setItems] = useState<WhatsAppInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"new" | "all">("new");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/inbox")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (
    action: "dismiss" | "promote_tip" | "promote_recipe",
    id: string,
    category?: DinnerRecipe["category"]
  ) => {
    setBusy(id);
    const res = await fetch("/api/admin/inbox", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, category }),
    });
    setBusy(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || adminT("saveFailed", lang));
      return;
    }
    setItems(data.inbox?.items ?? []);
    setMessage(data.message || adminT("saved", lang));
  };

  const visible = items.filter((i) => (filter === "new" ? i.status === "new" : true));

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-950 ring-1 ring-violet-100">
        <p className="font-semibold">{adminT("inboxHintTitle", lang)}</p>
        <p className="mt-0.5 whitespace-pre-line">{adminT("inboxHintBody", lang)}</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("new")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            filter === "new" ? "bg-teal-600 text-white" : "bg-white ring-1 ring-stone-200"
          }`}
        >
          {adminT("inboxNew", lang)}
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            filter === "all" ? "bg-teal-600 text-white" : "bg-white ring-1 ring-stone-200"
          }`}
        >
          {adminT("inboxAll", lang)}
        </button>
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-stone-200"
        >
          {adminT("refresh", lang)}
        </button>
      </div>

      {loading && <p className="text-sm text-stone-500">{adminT("loading", lang)}</p>}

      {!loading && visible.length === 0 && (
        <p className="rounded-xl bg-white p-4 text-sm text-stone-500 ring-1 ring-stone-200">
          {adminT("inboxEmpty", lang)}
        </p>
      )}

      <div className="space-y-3">
        {visible.map((item) => (
          <article
            key={item.id}
            className="rounded-xl bg-white p-4 ring-1 ring-stone-200"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
              <span className="rounded-full bg-stone-100 px-2 py-0.5 font-semibold">
                {item.kind}
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5">{item.status}</span>
              <span>{new Date(item.ts).toLocaleString()}</span>
              {item.fromName && <span>· {item.fromName}</span>}
            </div>
            <p className="whitespace-pre-wrap text-sm text-stone-900">{item.text}</p>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-xs text-teal-700 underline"
              >
                {item.link}
              </a>
            )}
            {item.answer && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-2 text-xs text-stone-600">
                {item.answer.slice(0, 600)}
                {item.answer.length > 600 ? "…" : ""}
              </p>
            )}
            {item.status === "new" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => act("promote_tip", item.id)}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {adminT("promoteTip", lang)}
                </button>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => act("promote_recipe", item.id, item.category || "Meat")}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {adminT("promoteRecipe", lang)}
                </button>
                {(["Meat", "Vegetable", "Soup"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => act("promote_recipe", item.id, c)}
                    className="rounded-lg bg-white px-2 py-1.5 text-[10px] font-medium text-stone-600 ring-1 ring-stone-200 disabled:opacity-50"
                  >
                    → {c}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => act("dismiss", item.id)}
                  className="rounded-lg px-3 py-1.5 text-xs text-stone-500 ring-1 ring-stone-200 disabled:opacity-50"
                >
                  {adminT("dismiss", lang)}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
