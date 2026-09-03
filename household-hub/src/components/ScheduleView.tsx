"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isHelperDayOff } from "@/lib/hk-holidays";
import { getHongKongTimeParts, getTodayDayKey, labels } from "@/lib/i18n";
import { localized } from "@/lib/localized-text";
import {
  formatTaskTimeRange,
  getActiveTaskId,
  sortTasksByTime,
} from "@/lib/schedule-utils";
import { resolveActiveSchedule, resolveTasksForDate } from "@/lib/school-calendar";
import type { AppContent, BilingualText } from "@/lib/types";
import {
  formatDayMonth,
  formatWeekRangeLabel,
  getTodayHongKongKey,
  getWeekDays,
  rotateDaysFrom,
  type WeekDayInfo,
} from "@/lib/week-utils";

interface ScheduleViewProps {
  content: AppContent;
  monthlyTasks?: BilingualText[];
}

function isDrawingTask(task: { task?: BilingualText; notes?: BilingualText }) {
  return /drawing\s*class|繪畫班|one\s*point/i.test(
    `${task.task?.en || ""} ${task.task?.zh || ""} ${task.notes?.en || ""}`
  );
}

export function ScheduleView({ content, monthlyTasks }: ScheduleViewProps) {
  const { lang } = useLanguage();
  const helperName = content.helperName || "Charlene";
  const todayKey = getTodayDayKey();
  const todayDateKey = getTodayHongKongKey();
  const todayKeyRef = useRef(todayKey);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [nowMinutes, setNowMinutes] = useState(() => getHongKongTimeParts().minutesSinceMidnight);

  const stripRef = useRef<HTMLDivElement>(null);
  const todayBtnRef = useRef<HTMLButtonElement>(null);
  const selectedBtnRef = useRef<HTMLButtonElement>(null);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  /** This week: start strip from today. Other weeks: Monday → Sunday. */
  const orderedDays: WeekDayInfo[] = useMemo(() => {
    if (weekOffset === 0) return rotateDaysFrom(weekDays, todayKey);
    return weekDays;
  }, [weekDays, weekOffset, todayKey]);

  const selectedInfo =
    orderedDays.find((d) => d.dayKey === selectedDay) ?? orderedDays[0];

  const selectedDate = selectedInfo?.date ?? new Date();
  const dayOffSelected = isHelperDayOff(selectedDate);
  const activeForSelected = resolveActiveSchedule(content, selectedDate);
  const resolved = resolveTasksForDate(
    content,
    selectedInfo?.dateKey ?? getTodayHongKongKey()
  );

  const sortedTasks = sortTasksByTime(resolved.tasks);
  const isOneOffDay = resolved.fromOverride;
  const isViewingToday =
    weekOffset === 0 && selectedInfo?.dateKey === todayDateKey;
  const activeTaskId = useMemo(
    () => (isViewingToday ? getActiveTaskId(sortedTasks, nowMinutes) : null),
    [isViewingToday, sortedTasks, nowMinutes]
  );

  // Keep selection on today when returning to this week / midnight rollover
  useEffect(() => {
    if (weekOffset === 0) {
      setSelectedDay(isHelperDayOff() ? "sunday" : getTodayDayKey());
    }
  }, [weekOffset]);

  useEffect(() => {
    const id = setInterval(() => {
      setNowMinutes(getHongKongTimeParts().minutesSinceMidnight);
      const currentToday = getTodayDayKey();
      if (weekOffset === 0 && currentToday !== todayKeyRef.current) {
        setSelectedDay(isHelperDayOff() ? "sunday" : currentToday);
        todayKeyRef.current = currentToday;
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [weekOffset]);

  // Scroll today (or selected) into view when week/selection changes
  useEffect(() => {
    const el =
      weekOffset === 0 && todayBtnRef.current
        ? todayBtnRef.current
        : selectedBtnRef.current;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [weekOffset, selectedDay, orderedDays]);

  const nowLabel = lang === "fil" ? "Ngayon" : lang === "zh" ? "現在" : "Now";
  const weekLabel = formatWeekRangeLabel(weekDays, lang);

  const statusLine = (() => {
    if (dayOffSelected) {
      return {
        tone: "violet" as const,
        text:
          lang === "fil"
            ? `Day off ni ${helperName} (Linggo / HK public holiday).`
            : lang === "zh"
              ? `${helperName} 放假（星期日／香港公眾假期）。`
              : `${helperName} day off (Sunday / HK public holiday).`,
      };
    }
    const banner = activeForSelected.ziziSchool;
    if (activeForSelected.season === "summer") {
      return {
        tone: "amber" as const,
        text: localized(banner, lang),
      };
    }
    if (banner) {
      return {
        tone: "sky" as const,
        text: localized(banner, lang),
      };
    }
    return null;
  })();

  const toneClass =
    statusLine?.tone === "violet"
      ? "bg-violet-50 text-violet-900 ring-violet-100"
      : statusLine?.tone === "amber"
        ? "bg-amber-50 text-amber-950 ring-amber-100"
        : "bg-sky-50 text-sky-950 ring-sky-100";

  return (
    <div className="space-y-3">
      {statusLine && (
        <p className={`rounded-xl px-3 py-2 text-xs leading-snug ring-1 ${toneClass}`}>
          {statusLine.text}
        </p>
      )}
      {isOneOffDay && !dayOffSelected && (
        <p className="rounded-xl bg-teal-50 px-3 py-2 text-xs leading-snug text-teal-950 ring-1 ring-teal-100">
          {lang === "fil"
            ? "Espesyal na araw (hindi regular na schedule)."
            : lang === "zh"
              ? "特別日子（非平常日程）。"
              : "One-off day plan (not the usual weekly schedule)."}
        </p>
      )}

      {/* This week / next week */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => Math.max(-1, w - 1))}
          disabled={weekOffset <= -1}
          className="rounded-lg px-2 py-1.5 text-sm text-stone-600 ring-1 ring-stone-200 disabled:opacity-30"
          aria-label={lang === "zh" ? "上一週" : "Previous week"}
        >
          ‹
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs font-semibold text-stone-800">
            {weekOffset === 0
              ? lang === "fil"
                ? "Ngayong linggo"
                : lang === "zh"
                  ? "本週"
                  : "This week"
              : weekOffset === 1
                ? lang === "fil"
                  ? "Susunod na linggo"
                  : lang === "zh"
                    ? "下週"
                    : "Next week"
                : lang === "fil"
                  ? "Nakaraang linggo"
                  : lang === "zh"
                    ? "上週"
                    : "Last week"}
          </p>
          <p className="text-[11px] text-stone-500">{weekLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((w) => Math.min(2, w + 1))}
          disabled={weekOffset >= 2}
          className="rounded-lg px-2 py-1.5 text-sm text-stone-600 ring-1 ring-stone-200 disabled:opacity-30"
          aria-label={lang === "zh" ? "下一週" : "Next week"}
        >
          ›
        </button>
      </div>

      {weekOffset !== 0 && (
        <button
          type="button"
          onClick={() => setWeekOffset(0)}
          className="w-full rounded-lg bg-teal-50 py-1.5 text-xs font-medium text-teal-800 ring-1 ring-teal-100"
        >
          {lang === "fil"
            ? "Bumalik sa ngayong linggo"
            : lang === "zh"
              ? "回到本週"
              : "Back to this week"}
        </button>
      )}

      <div
        ref={stripRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
      >
        {orderedDays.map((day) => {
          const isToday = day.dateKey === todayDateKey;
          const isSelected = day.dayKey === selectedInfo.dayKey;
          const isSunday = day.dayKey === "sunday";
          const label =
            content.weeklySchedule.find((d) => d.dayKey === day.dayKey)?.day ||
            content.weeklyScheduleSummer?.find((d) => d.dayKey === day.dayKey)
              ?.day;
          return (
            <button
              key={`${day.dateKey}-${day.dayKey}`}
              ref={
                isToday
                  ? todayBtnRef
                  : isSelected
                    ? selectedBtnRef
                    : undefined
              }
              type="button"
              onClick={() => setSelectedDay(day.dayKey)}
              className={`shrink-0 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                isSelected
                  ? "bg-teal-600 text-white shadow-sm"
                  : isToday
                    ? "bg-teal-50 text-teal-800 ring-1 ring-teal-300"
                    : isSunday
                      ? "bg-violet-50 text-violet-800 ring-1 ring-violet-200"
                      : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              <span className="block">
                {label ? localized(label, lang) : day.dayKey}
                {isToday && (
                  <span className="ml-1 text-[10px] opacity-80">
                    ({labels.today[lang]})
                  </span>
                )}
              </span>
              <span
                className={`mt-0.5 block text-[10px] font-normal ${
                  isSelected ? "text-teal-100" : "text-stone-400"
                }`}
              >
                {formatDayMonth(day.date, lang)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const isNow = isViewingToday && task.id === activeTaskId;
          const drawing = isDrawingTask(task);
          return (
            <div
              key={task.id}
              className={`flex gap-3 rounded-2xl p-3 ring-1 ${
                task.fullDay
                  ? "bg-violet-50 ring-violet-200"
                  : drawing
                    ? "bg-orange-50/80 ring-orange-100"
                    : isNow
                      ? "bg-amber-50 ring-amber-200"
                      : "bg-white ring-stone-100"
              }`}
            >
              <div className="w-[5.25rem] shrink-0">
                <time
                  className={`block pt-0.5 text-xs font-bold leading-snug ${
                    drawing ? "text-orange-800" : "text-teal-700"
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
                <p className="text-sm font-medium text-stone-900">
                  {localized(task.task, lang)}
                </p>
                {task.notes && (
                  <p className="mt-0.5 whitespace-pre-line text-xs leading-snug text-stone-500">
                    {localized(task.notes, lang)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {monthlyTasks && monthlyTasks.length > 0 && (
        <details className="rounded-2xl bg-white p-3 ring-1 ring-stone-100">
          <summary className="cursor-pointer text-sm font-semibold text-stone-700">
            {lang === "fil" ? "Buwanang gawain" : lang === "zh" ? "每月工作" : "Monthly tasks"}
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
