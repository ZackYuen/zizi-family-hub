"use client";

import type { AppContent, BilingualText, Lang } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";
import { emptyBilingual } from "@/lib/localized-text";
import { TrilingualFieldEditor } from "./TrilingualFieldEditor";

interface Props {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
}

export function MonthlyTasksAdmin({ content, setContent, lang }: Props) {
  const tasks = content.monthlyTasks ?? [];

  const patch = (monthlyTasks: BilingualText[]) => {
    setContent({ ...content, monthlyTasks });
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= tasks.length) return;
    const list = [...tasks];
    const [item] = list.splice(index, 1);
    list.splice(next, 0, item);
    patch(list);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        <p className="font-bold">{adminT("monthlyTasks", lang)}</p>
        <p className="mt-0.5">{adminT("monthlyTasksHint", lang)}</p>
      </div>

      {tasks.map((task, i) => (
        <div
          key={`monthly-${i}`}
          className="rounded-xl bg-white p-3 ring-1 ring-stone-200"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-amber-800">
              #{i + 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="rounded px-1.5 py-0.5 text-xs text-stone-600 ring-1 ring-stone-200 disabled:opacity-30"
                aria-label={adminT("moveUp", lang)}
              >
                ▲
              </button>
              <button
                type="button"
                disabled={i === tasks.length - 1}
                onClick={() => move(i, 1)}
                className="rounded px-1.5 py-0.5 text-xs text-stone-600 ring-1 ring-stone-200 disabled:opacity-30"
                aria-label={adminT("moveDown", lang)}
              >
                ▼
              </button>
              <button
                type="button"
                className="text-xs text-red-500"
                onClick={() => {
                  const list = [...tasks];
                  list.splice(i, 1);
                  patch(list);
                }}
              >
                {adminT("delete", lang)}
              </button>
            </div>
          </div>
          <TrilingualFieldEditor
            value={task}
            onChange={(v) => {
              const list = [...tasks];
              list[i] = v;
              patch(list);
            }}
            multiline
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          patch([
            ...tasks,
            {
              ...emptyBilingual(),
              en: "New monthly task",
              fil: "Bagong buwanang gawain",
              zh: "新每月工作",
            },
          ])
        }
        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-amber-800 ring-1 ring-amber-200"
      >
        {adminT("addMonthlyTask", lang)}
      </button>
    </div>
  );
}
