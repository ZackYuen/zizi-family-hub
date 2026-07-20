"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getHongKongTimeParts, getTodayDayKey, labels } from "@/lib/i18n";
import type { BilingualText, DaySchedule, ScheduleTask } from "@/lib/types";

interface ScheduleViewProps {
  schedule: DaySchedule[];
  ziziSchool?: BilingualText;
  monthlyTasks?: BilingualText[];
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getActiveTaskId(tasks: ScheduleTask[], minutesSinceMidnight: number): string | null {
  if (tasks.length === 0) return null;

  const sorted = [...tasks].sort(
    (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
  );

  let active: ScheduleTask | null = null;
  for (const task of sorted) {
    if (parseTimeToMinutes(task.time) <= minutesSinceMidnight) {
      active = task;
    } else {
      break;
    }
  }

  return active?.id ?? sorted[0]?.id ?? null;
}

export function ScheduleView({ schedule, ziziSchool, monthlyTasks }: ScheduleViewProps) {
  const { lang } = useLanguage();
  const todayKey = getTodayDayKey();
  const todayKeyRef = useRef(todayKey);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [nowMinutes, setNowMinutes] = useState(() => getHongKongTimeParts().minutesSinceMidnight);

  useEffect(() => {
    const id = setInterval(() => {
      setNowMinutes(getHongKongTimeParts().minutesSinceMidnight);
      const currentToday = getTodayDayKey();
      if (currentToday !== todayKeyRef.current) {
        setSelectedDay((prev) => (prev === todayKeyRef.current ? currentToday : prev));
        todayKeyRef.current = currentToday;
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const selected = schedule.find((d) => d.dayKey === selectedDay) ?? schedule[0];
  const isViewingToday = selectedDay === todayKey;
  const activeTaskId = useMemo(
    () => (isViewingToday ? getActiveTaskId(selected.tasks, nowMinutes) : null),
    [isViewingToday, selected.tasks, nowMinutes]
  );

  const nowLabel = lang === "fil" ? "Ngayon" : "Now";

  return (
    <div className="space-y-4">
      {ziziSchool && (
        <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-900 ring-1 ring-blue-100">
          🏫 {ziziSchool[lang]}
        </p>
      )}

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
                  : isToday
                    ? "bg-teal-50 text-teal-800 ring-2 ring-teal-300"
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
        {selected.tasks.map((task) => {
          const isNow = isViewingToday && task.id === activeTaskId;
          return (
            <div
              key={task.id}
              className={`flex gap-3 rounded-2xl p-3 shadow-sm ring-1 ${
                isNow
                  ? "bg-amber-50 ring-amber-300"
                  : "bg-white ring-stone-100"
              }`}
            >
              <div className="w-14 shrink-0">
                <time className="block pt-0.5 text-sm font-bold text-teal-700">
                  {task.time}
                </time>
                {isNow && (
                  <span className="mt-0.5 block text-[10px] font-bold uppercase text-amber-700">
                    {nowLabel}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900">{task.task[lang]}</p>
                {task.notes && (
                  <p className="mt-0.5 text-xs text-stone-500">{task.notes[lang]}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {monthlyTasks && monthlyTasks.length > 0 && (
        <details className="rounded-2xl bg-white p-3 ring-1 ring-stone-100">
          <summary className="cursor-pointer text-sm font-semibold text-stone-700">
            📅 {lang === "fil" ? "Buwanang gawain" : "Monthly tasks"}
          </summary>
          <ul className="mt-2 space-y-1 pl-4 text-sm text-stone-600">
            {monthlyTasks.map((item) => (
              <li key={item.en} className="list-disc">
                {item[lang]}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
