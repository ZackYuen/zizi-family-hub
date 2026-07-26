"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isHelperDayOff } from "@/lib/hk-holidays";
import { getHongKongTimeParts, getTodayDayKey, labels, uiLocale } from "@/lib/i18n";
import { localized } from "@/lib/localized-text";
import {
  formatTaskTimeRange,
  getActiveTaskId,
  sortTasksByTime,
} from "@/lib/schedule-utils";
import type { BilingualText, DaySchedule, SchoolCalendar } from "@/lib/types";
import type { ScheduleSeason } from "@/lib/school-calendar";

interface ScheduleViewProps {
  schedule: DaySchedule[];
  ziziSchool?: BilingualText;
  monthlyTasks?: BilingualText[];
  season?: ScheduleSeason;
  calendar?: SchoolCalendar;
}

export function ScheduleView({
  schedule,
  ziziSchool,
  monthlyTasks,
  season,
  calendar,
}: ScheduleViewProps) {
  const { lang } = useLanguage();
  const todayKey = getTodayDayKey();
  const todayKeyRef = useRef(todayKey);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [nowMinutes, setNowMinutes] = useState(() => getHongKongTimeParts().minutesSinceMidnight);
  const [isDayOff, setIsDayOff] = useState(() => isHelperDayOff());

  useEffect(() => {
    if (isHelperDayOff()) setSelectedDay("sunday");
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNowMinutes(getHongKongTimeParts().minutesSinceMidnight);
      const currentToday = getTodayDayKey();
      const dayOff = isHelperDayOff();
      setIsDayOff(dayOff);

      if (dayOff) {
        setSelectedDay("sunday");
      } else if (currentToday !== todayKeyRef.current) {
        setSelectedDay((prev) => (prev === todayKeyRef.current ? currentToday : prev));
        todayKeyRef.current = currentToday;
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isDayOff) setSelectedDay("sunday");
  }, [isDayOff]);

  const effectiveDayKey = isDayOff ? "sunday" : selectedDay;
  const selected =
    schedule.find((d) => d.dayKey === effectiveDayKey) ?? schedule[0];
  const sortedTasks = sortTasksByTime(selected.tasks);
  const isViewingToday =
    isDayOff || effectiveDayKey === todayKey;
  const activeTaskId = useMemo(
    () => (isViewingToday ? getActiveTaskId(selected.tasks, nowMinutes) : null),
    [isViewingToday, selected.tasks, nowMinutes]
  );

  const nowLabel = lang === "fil" ? "Ngayon" : "Now";
  const dayOffBanner = {
    en: "Today is Sunday / HK public holiday (香港勞工假) — Charlene day off.",
    fil: "Ngayon ay Linggo / HK public holiday (香港勞工假) — day off ni Charlene.",
    zh: "今天是星期日／香港公眾假期（勞工假）— Charlene 放假。",
  };

  const seasonBanner =
    season === "summer"
      ? {
          en: `Summer mode (until ${calendar?.summerEndsOn ?? "1 Sep"}) — home days; school resumes ${calendar?.termStartsOn ?? "2 Sep"} (${calendar?.grade ?? "K3"}).`,
          fil: `Summer mode (hanggang ${calendar?.summerEndsOn ?? "1 Sep"}) — sa bahay; balik-eskwela ${calendar?.termStartsOn ?? "2 Sep"} (${calendar?.grade ?? "K3"}).`,
          zh: `暑假模式（至 ${calendar?.summerEndsOn ?? "9月1日"}）— 在家；${calendar?.termStartsOn ?? "9月2日"} 復課（${calendar?.grade ?? "K3"}）。`,
        }
      : season === "term"
        ? {
            en: `School term — ${calendar?.grade ?? "K3"} ${calendar?.classSession ?? "PM"} class.`,
            fil: `School term — ${calendar?.grade ?? "K3"} ${calendar?.classSession ?? "PM"} class.`,
            zh: `學期中 — ${calendar?.grade ?? "K3"} ${calendar?.classSession === "AM" ? "上午班" : "下午班"}。`,
          }
        : null;

  return (
    <div className="space-y-4">
      {isDayOff && (
        <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-medium text-violet-900 ring-1 ring-violet-100">
          🎉 {dayOffBanner[lang]}
        </p>
      )}

      {seasonBanner && (
        <p
          className={`rounded-xl px-3 py-2 text-xs font-medium ring-1 ${
            season === "summer"
              ? "bg-amber-50 text-amber-950 ring-amber-100"
              : "bg-sky-50 text-sky-950 ring-sky-100"
          }`}
        >
          {seasonBanner[lang]}
        </p>
      )}

      {ziziSchool && (
        <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-900 ring-1 ring-blue-100">
          🏫 {localized(ziziSchool, lang)}
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {schedule.map((day) => {
          const isToday = !isDayOff && day.dayKey === todayKey;
          const isSelected = day.dayKey === effectiveDayKey;
          const isSunday = day.dayKey === "sunday";
          const hasDrawing = day.tasks.some((t) =>
            /drawing\s*class|繪畫班|one\s*point/i.test(
              `${t.task?.en || ""} ${t.task?.zh || ""} ${t.notes?.en || ""}`
            )
          );
          return (
            <button
              key={day.dayKey}
              type="button"
              onClick={() => setSelectedDay(day.dayKey)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isSelected
                  ? hasDrawing
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-teal-600 text-white shadow-md"
                  : isToday
                    ? "bg-teal-50 text-teal-800 ring-2 ring-teal-300"
                    : hasDrawing
                      ? "bg-orange-50 text-orange-900 ring-1 ring-orange-200"
                      : isSunday
                        ? "bg-violet-50 text-violet-800 ring-1 ring-violet-200"
                        : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              <span className="block">{localized(day.day, lang)}</span>
              {hasDrawing && (
                <span
                  className={`mt-0.5 block text-[10px] font-semibold ${
                    isSelected ? "text-orange-100" : "text-orange-700"
                  }`}
                >
                  {lang === "zh" ? "繪畫 14:00" : "Drawing 14:00"}
                </span>
              )}
              {(isToday || (isDayOff && isSunday)) && (
                <span className="ml-1 text-[10px] opacity-80">
                  ({labels.today[lang]})
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const isNow = isViewingToday && task.id === activeTaskId;
          const isDrawing = /drawing\s*class|繪畫班|one\s*point/i.test(
            `${task.task?.en || ""} ${task.task?.zh || ""} ${task.notes?.en || ""}`
          );
          return (
            <div
              key={task.id}
              className={`flex gap-3 rounded-2xl p-3 shadow-sm ring-1 ${
                task.fullDay
                  ? "bg-violet-50 ring-violet-200"
                  : isDrawing
                    ? "bg-orange-50 ring-orange-200"
                    : isNow
                      ? "bg-amber-50 ring-amber-300"
                      : "bg-white ring-stone-100"
              }`}
            >
              <div className="w-[5.5rem] shrink-0">
                <time
                  className={`block pt-0.5 text-xs font-bold leading-snug ${
                    isDrawing ? "text-orange-700" : "text-teal-700"
                  }`}
                >
                  {formatTaskTimeRange(task, lang)}
                </time>
                {isNow && !task.fullDay && (
                  <span className="mt-0.5 block text-[10px] font-bold uppercase text-amber-700">
                    {nowLabel}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900">{localized(task.task, lang)}</p>
                {task.notes && (
                  <p className="mt-0.5 text-xs text-stone-600">{localized(task.notes, lang)}</p>
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
                {localized(item, lang)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
