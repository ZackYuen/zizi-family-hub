"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTodayDayKey, labels, mealLabel } from "@/lib/i18n";
import type { DayMeals } from "@/lib/types";

const mealIcons: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const mealOrder = ["breakfast", "lunch", "snack", "dinner"] as const;

export function MealsView({ meals }: { meals: DayMeals[] }) {
  const { lang } = useLanguage();
  const todayKey = getTodayDayKey();
  const [selectedDay, setSelectedDay] = useState(todayKey);

  const selected = meals.find((d) => d.dayKey === selectedDay) ?? meals[0];
  const sortedMeals = [...selected.meals].sort(
    (a, b) => mealOrder.indexOf(a.meal) - mealOrder.indexOf(b.meal)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {meals.map((day) => {
          const isToday = day.dayKey === todayKey;
          const isSelected = day.dayKey === selectedDay;
          return (
            <button
              key={day.dayKey}
              type="button"
              onClick={() => setSelectedDay(day.dayKey)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isSelected
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              {day.day[lang]}
              {isToday && (
                <span className="ml-1 text-[10px] opacity-80">
                  ({labels.today[lang]})
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {sortedMeals.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">{mealIcons[item.meal]}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                {mealLabel(item.meal, lang)}
              </span>
            </div>
            <p className="text-sm font-medium text-stone-900">{item.dish[lang]}</p>
            {item.notes && (
              <p className="mt-1 text-xs text-stone-500">{item.notes[lang]}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
