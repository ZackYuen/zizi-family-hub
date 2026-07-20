"use client";

import { useState } from "react";
import type { Lang } from "@/lib/types";
import type { AppContent, DaySchedule, ScheduleTask } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";
import { getTodayDayKey } from "@/lib/i18n";
import { TranslateButton } from "./TranslateButton";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface Props {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
}

export function ScheduleCalendarAdmin({ content, setContent, lang }: Props) {
  const todayKey = getTodayDayKey();
  const [selectedDay, setSelectedDay] = useState(todayKey);

  const dayIndex = content.weeklySchedule.findIndex((d) => d.dayKey === selectedDay);
  const day = content.weeklySchedule[dayIndex] ?? content.weeklySchedule[0];

  const updateTask = (
    taskIndex: number,
    field: keyof ScheduleTask | "task.en" | "task.fil",
    value: string
  ) => {
    const next = structuredClone(content);
    const d = next.weeklySchedule[dayIndex];
    if (field === "time") d.tasks[taskIndex].time = value;
    else if (field === "task.en") d.tasks[taskIndex].task.en = value;
    else if (field === "task.fil") d.tasks[taskIndex].task.fil = value;
    setContent(next);
  };

  const addTask = () => {
    const next = structuredClone(content);
    next.weeklySchedule[dayIndex].tasks.push({
      id: `task-${Date.now()}`,
      time: "09:00",
      task: { en: "", fil: "" },
    });
    next.weeklySchedule[dayIndex].tasks.sort((a, b) => a.time.localeCompare(b.time));
    setContent(next);
  };

  const deleteTask = (taskIndex: number) => {
    const next = structuredClone(content);
    next.weeklySchedule[dayIndex].tasks.splice(taskIndex, 1);
    setContent(next);
  };

  const setTaskFil = (taskIndex: number, fil: string) => {
    const next = structuredClone(content);
    next.weeklySchedule[dayIndex].tasks[taskIndex].task.fil = fil;
    setContent(next);
  };

  const taskCount = (d: DaySchedule) => d.tasks.length;

  return (
    <div className="space-y-4">
      {/* Week calendar strip */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {content.weeklySchedule.map((d) => {
          const isSelected = d.dayKey === selectedDay;
          const isToday = d.dayKey === todayKey;
          return (
            <button
              key={d.dayKey}
              type="button"
              onClick={() => setSelectedDay(d.dayKey)}
              className={`flex flex-col items-center rounded-xl p-2 text-center transition sm:p-3 ${
                isSelected
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-teal-50"
              }`}
            >
              <span className="text-[10px] font-medium uppercase sm:text-xs">
                {d.day[lang].slice(0, 3)}
              </span>
              <span className="mt-0.5 text-lg font-bold sm:text-xl">
                {DAY_KEYS.indexOf(d.dayKey) + 1}
              </span>
              <span className={`mt-0.5 text-[9px] ${isSelected ? "opacity-80" : "text-stone-400"}`}>
                {taskCount(d)} tasks
              </span>
              {isToday && (
                <span className={`mt-0.5 rounded-full px-1.5 text-[8px] font-semibold ${isSelected ? "bg-white/20" : "bg-teal-100 text-teal-700"}`}>
                  {adminT("today", lang)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day header */}
      <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200">
        <h2 className="text-lg font-bold text-stone-900">{day.day[lang]}</h2>
        <p className="text-xs text-stone-500">{day.tasks.length} tasks</p>
      </div>

      {/* Timeline for selected day */}
      <div className="space-y-3">
        {day.tasks.map((task, ti) => (
          <div
            key={task.id}
            className="relative rounded-xl bg-white p-3 ring-1 ring-stone-200 sm:p-4"
          >
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-teal-500" />
            <div className="mb-2 flex items-center justify-between pl-2">
              <input
                value={task.time}
                onChange={(e) => updateTask(ti, "time", e.target.value)}
                placeholder={adminT("time", lang)}
                className="rounded-lg border border-stone-200 px-2 py-1 text-sm font-bold text-teal-700"
              />
              <button
                type="button"
                onClick={() => deleteTask(ti)}
                className="text-xs text-red-500"
              >
                {adminT("delete", lang)}
              </button>
            </div>
            <div className="grid gap-2 pl-2 sm:grid-cols-2">
              <div>
                <input
                  value={task.task.en}
                  onChange={(e) => updateTask(ti, "task.en", e.target.value)}
                  placeholder={adminT("taskEn", lang)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-1">
                <input
                  value={task.task.fil}
                  onChange={(e) => updateTask(ti, "task.fil", e.target.value)}
                  placeholder={adminT("taskFil", lang)}
                  className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
                <TranslateButton
                  sourceText={task.task.en}
                  onTranslated={(t) => setTaskFil(ti, t)}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addTask}
        className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
      >
        {adminT("addTask", lang)}
      </button>
    </div>
  );
}
