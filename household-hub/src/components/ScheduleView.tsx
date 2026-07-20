"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTodayDayKey, labels } from "@/lib/i18n";
import type { DaySchedule } from "@/lib/types";

export function ScheduleView({ schedule }: { schedule: DaySchedule[] }) {
  const { lang } = useLanguage();
  const todayKey = getTodayDayKey();
  const [selectedDay, setSelectedDay] = useState(todayKey);

  const selected = schedule.find((d) => d.dayKey === selectedDay) ?? schedule[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {schedule.map((day) => {
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

      <div className="space-y-2">
        {selected.tasks.map((task) => (
          <div
            key={task.id}
            className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-100"
          >
            <time className="w-12 shrink-0 pt-0.5 text-sm font-bold text-teal-700">
              {task.time}
            </time>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900">{task.task[lang]}</p>
              {task.notes && (
                <p className="mt-0.5 text-xs text-stone-500">{task.notes[lang]}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
