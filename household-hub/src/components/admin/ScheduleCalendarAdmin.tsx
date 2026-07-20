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

type ViewMode = "day" | "week";

interface Props {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
}

function taskCount(d: DaySchedule) {
  return d.tasks.length;
}

function sortTasks(tasks: ScheduleTask[]) {
  tasks.sort((a, b) => a.time.localeCompare(b.time));
}

export function ScheduleCalendarAdmin({ content, setContent, lang }: Props) {
  const todayKey = getTodayDayKey();
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [copyTarget, setCopyTarget] = useState("");

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
    sortTasks(next.weeklySchedule[dayIndex].tasks);
    setContent(next);
  };

  const deleteTask = (taskIndex: number) => {
    const next = structuredClone(content);
    next.weeklySchedule[dayIndex].tasks.splice(taskIndex, 1);
    setContent(next);
  };

  const moveTask = (taskIndex: number, direction: -1 | 1) => {
    const next = structuredClone(content);
    const tasks = next.weeklySchedule[dayIndex].tasks;
    sortTasks(tasks);
    const target = taskIndex + direction;
    if (target < 0 || target >= tasks.length) return;
    const tempTime = tasks[taskIndex].time;
    tasks[taskIndex].time = tasks[target].time;
    tasks[target].time = tempTime;
    sortTasks(tasks);
    setContent(next);
  };

  const setTaskFil = (taskIndex: number, fil: string) => {
    const next = structuredClone(content);
    next.weeklySchedule[dayIndex].tasks[taskIndex].task.fil = fil;
    setContent(next);
  };

  const copyDayTo = (targetDayKey: string) => {
    if (!targetDayKey || targetDayKey === selectedDay) return;
    const targetIndex = content.weeklySchedule.findIndex((d) => d.dayKey === targetDayKey);
    if (targetIndex < 0) return;

    const next = structuredClone(content);
    next.weeklySchedule[targetIndex].tasks = day.tasks.map((task) => ({
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      task: { ...task.task },
      notes: task.notes ? { ...task.notes } : undefined,
    }));
    sortTasks(next.weeklySchedule[targetIndex].tasks);
    setContent(next);
    setCopyTarget("");
  };

  const selectDay = (dayKey: string, mode: ViewMode = viewMode) => {
    setSelectedDay(dayKey);
    if (mode === "day") setViewMode("day");
  };

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex rounded-xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setViewMode("day")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            viewMode === "day"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-stone-600"
          }`}
        >
          {adminT("scheduleDayView", lang)}
        </button>
        <button
          type="button"
          onClick={() => setViewMode("week")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            viewMode === "week"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-stone-600"
          }`}
        >
          {adminT("scheduleWeekView", lang)}
        </button>
      </div>

      {/* Week calendar strip */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {content.weeklySchedule.map((d) => {
          const isSelected = d.dayKey === selectedDay;
          const isToday = d.dayKey === todayKey;
          return (
            <button
              key={d.dayKey}
              type="button"
              onClick={() => selectDay(d.dayKey)}
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
                {taskCount(d)} {adminT("tasksShort", lang)}
              </span>
              {isToday && (
                <span
                  className={`mt-0.5 rounded-full px-1.5 text-[8px] font-semibold ${
                    isSelected ? "bg-white/20" : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {adminT("today", lang)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {viewMode === "week" ? (
        <WeekOverview
          content={content}
          lang={lang}
          selectedDay={selectedDay}
          onSelectDay={(dayKey) => selectDay(dayKey, "day")}
        />
      ) : (
        <>
          {/* Selected day header + copy */}
          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-stone-900">{day.day[lang]}</h2>
                <p className="text-xs text-stone-500">
                  {day.tasks.length} {adminT("tasksShort", lang)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={copyTarget}
                  onChange={(e) => setCopyTarget(e.target.value)}
                  className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-700"
                >
                  <option value="">{adminT("copyDayTo", lang)}</option>
                  {content.weeklySchedule
                    .filter((d) => d.dayKey !== selectedDay)
                    .map((d) => (
                      <option key={d.dayKey} value={d.dayKey}>
                        {d.day[lang]}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!copyTarget}
                  onClick={() => copyDayTo(copyTarget)}
                  className="rounded-lg bg-stone-100 px-2 py-1.5 text-xs font-medium text-teal-700 disabled:opacity-40"
                >
                  {adminT("copy", lang)}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline for selected day */}
          <div className="space-y-3">
            {[...day.tasks]
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((task, ti, arr) => {
              const taskIndex = day.tasks.findIndex((t) => t.id === task.id);
              return (
              <div
                key={task.id}
                className="relative rounded-xl bg-white p-3 ring-1 ring-stone-200 sm:p-4"
              >
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-teal-500" />
                <div className="mb-2 flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={task.time}
                      onChange={(e) => updateTask(taskIndex, "time", e.target.value)}
                      className="rounded-lg border border-stone-200 px-2 py-1 text-sm font-bold text-teal-700"
                    />
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveTask(ti, -1)}
                        disabled={ti === 0}
                        className="rounded px-1 text-[10px] text-stone-400 disabled:opacity-30"
                        aria-label={adminT("moveUp", lang)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTask(ti, 1)}
                        disabled={ti === arr.length - 1}
                        className="rounded px-1 text-[10px] text-stone-400 disabled:opacity-30"
                        aria-label={adminT("moveDown", lang)}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTask(taskIndex)}
                    className="text-xs text-red-500"
                  >
                    {adminT("delete", lang)}
                  </button>
                </div>
                <div className="grid gap-2 pl-2 sm:grid-cols-2">
                  <div>
                    <input
                      value={task.task.en}
                      onChange={(e) => updateTask(taskIndex, "task.en", e.target.value)}
                      placeholder={adminT("taskEn", lang)}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-1">
                    <input
                      value={task.task.fil}
                      onChange={(e) => updateTask(taskIndex, "task.fil", e.target.value)}
                      placeholder={adminT("taskFil", lang)}
                      className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    />
                    <TranslateButton
                      sourceText={task.task.en}
                      onTranslated={(t) => setTaskFil(taskIndex, t)}
                      lang={lang}
                    />
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addTask}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
          >
            {adminT("addTask", lang)}
          </button>
        </>
      )}
    </div>
  );
}

function WeekOverview({
  content,
  lang,
  selectedDay,
  onSelectDay,
}: {
  content: AppContent;
  lang: Lang;
  selectedDay: string;
  onSelectDay: (dayKey: string) => void;
}) {
  const allTimes = new Set<string>();
  for (const d of content.weeklySchedule) {
    for (const t of d.tasks) allTimes.add(t.time);
  }
  const times = [...allTimes].sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500">{adminT("weekOverviewHint", lang)}</p>

      {/* Mobile: stacked day columns */}
      <div className="space-y-3 lg:hidden">
        {content.weeklySchedule.map((d) => (
          <DayColumn
            key={d.dayKey}
            day={d}
            lang={lang}
            isSelected={d.dayKey === selectedDay}
            onSelect={() => onSelectDay(d.dayKey)}
          />
        ))}
      </div>

      {/* Desktop: week grid aligned by time */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-8 gap-1">
            <div className="p-2 text-xs font-semibold text-stone-400">{adminT("time", lang)}</div>
            {content.weeklySchedule.map((d) => (
              <button
                key={d.dayKey}
                type="button"
                onClick={() => onSelectDay(d.dayKey)}
                className={`rounded-lg p-2 text-center text-xs font-semibold ${
                  d.dayKey === selectedDay
                    ? "bg-teal-600 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-teal-50"
                }`}
              >
                {d.day[lang].slice(0, 3)}
              </button>
            ))}

            {times.map((time) => (
              <WeekGridRow
                key={time}
                time={time}
                days={content.weeklySchedule}
                lang={lang}
                selectedDay={selectedDay}
                onSelectDay={onSelectDay}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeekGridRow({
  time,
  days,
  lang,
  selectedDay,
  onSelectDay,
}: {
  time: string;
  days: DaySchedule[];
  lang: Lang;
  selectedDay: string;
  onSelectDay: (dayKey: string) => void;
}) {
  return (
    <>
      <div className="flex items-start p-2 text-xs font-bold text-teal-700">{time}</div>
      {days.map((d) => {
        const task = d.tasks.find((t) => t.time === time);
        return (
          <button
            key={d.dayKey}
            type="button"
            onClick={() => onSelectDay(d.dayKey)}
            className={`min-h-[3rem] rounded-lg p-2 text-left text-[11px] transition ${
              d.dayKey === selectedDay
                ? "bg-teal-50 ring-1 ring-teal-200"
                : "bg-white ring-1 ring-stone-100 hover:bg-stone-50"
            }`}
          >
            {task ? (
              <span className="line-clamp-2 text-stone-800">
                {task.task[lang] || task.task.en || "—"}
              </span>
            ) : (
              <span className="text-stone-300">—</span>
            )}
          </button>
        );
      })}
    </>
  );
}

function DayColumn({
  day,
  lang,
  isSelected,
  onSelect,
}: {
  day: DaySchedule;
  lang: Lang;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-xl ring-1 ${
        isSelected ? "bg-teal-50 ring-teal-200" : "bg-white ring-stone-200"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center justify-between border-b border-stone-100 px-3 py-2 text-left"
      >
        <span className="text-sm font-semibold text-stone-900">{day.day[lang]}</span>
        <span className="text-xs text-teal-700">{adminT("edit", lang)} →</span>
      </button>
      <div className="space-y-1 p-2">
        {day.tasks.length === 0 ? (
          <p className="px-1 py-2 text-xs text-stone-400">—</p>
        ) : (
          day.tasks.map((task) => (
            <div
              key={task.id}
              className="flex gap-2 rounded-lg bg-white px-2 py-1.5 ring-1 ring-stone-100"
            >
              <span className="shrink-0 text-xs font-bold text-teal-700">{task.time}</span>
              <span className="line-clamp-2 text-xs text-stone-700">
                {task.task[lang] || task.task.en}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
