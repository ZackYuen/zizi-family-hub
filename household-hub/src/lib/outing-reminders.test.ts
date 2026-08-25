import assert from "node:assert/strict";
import test from "node:test";
import {
  formatOutingReminderMessage,
  getOutingRemindersForDate,
  isOutingLeaveTask,
} from "./outing-reminders";
import type { AppContent, ScheduleTask } from "./types";

function task(
  id: string,
  en: string,
  extra: Partial<ScheduleTask> = {}
): ScheduleTask {
  return {
    id,
    time: extra.startTime || extra.time || "12:00",
    startTime: extra.startTime || extra.time || "12:00",
    task: {
      en,
      fil: extra.task?.fil || en,
      zh: extra.task?.zh,
    },
    ...extra,
  };
}

test("detects kindergarten drop-off and drawing leave-home", () => {
  assert.equal(
    isOutingLeaveTask(
      task(
        "m6",
        "Leave home for afternoon class — walk 30 min, drop off Zizi at Lam Tin Ling Liang Kindergarten (K3) by 13:00",
        {
          task: {
            en: "Leave home for afternoon class — walk 30 min, drop off Zizi at Lam Tin Ling Liang Kindergarten (K3) by 13:00",
            zh: "出門上下午班 — 步行約30分鐘，13:00 前送到藍田靈糧幼稚園（K3）",
            fil: "Umalis papuntang afternoon class — 30 min lakad, ihatid si Zizi sa Lam Tin Ling Liang Kindergarten (K3) bago 13:00",
          },
        }
      )
    ),
    true
  );
  assert.equal(
    isOutingLeaveTask(
      task("sw5", "Prepare & leave home for drawing class (Kwun Tong Industrial Centre)", {
        task: {
          en: "Prepare & leave home for drawing class (Kwun Tong Industrial Centre)",
          zh: "準備出門前往繪畫班（觀塘工業中心）",
          fil: "Maghanda at umalis papuntang drawing class (Kwun Tong Industrial Centre)",
        },
      })
    ),
    true
  );
});

test("skips class block, travel, return, and pick-up", () => {
  assert.equal(isOutingLeaveTask(task("sw7", "Drawing class (12:00–13:00)")), false);
  assert.equal(
    isOutingLeaveTask(task("sw6", "Travel / arrive at One Point Studio")),
    false
  );
  assert.equal(
    isOutingLeaveTask(task("sw8", "Return home from drawing class")),
    false
  );
  assert.equal(
    isOutingLeaveTask(
      task(
        "m9",
        "Leave home for pick-up — walk 30 min, pick up Zizi at 16:30 from Lam Tin Ling Liang Kindergarten (K3)"
      )
    ),
    false
  );
  assert.equal(
    isOutingLeaveTask(task("m4", "Prepare school bag, shoes, uniform")),
    false
  );
});

test("explicit outingReminder flag wins", () => {
  assert.equal(
    isOutingLeaveTask(task("x", "Stay home and rest", { outingReminder: true })),
    true
  );
  assert.equal(
    isOutingLeaveTask(
      task("y", "Prepare & leave home for drawing class", {
        outingReminder: false,
      })
    ),
    false
  );
});

test("due window is 1 hour before start, not after start", () => {
  const content = {
    weeklySchedule: [
      {
        dayKey: "tuesday",
        day: { en: "Tue", fil: "Tue" },
        tasks: [
          task("m6", "Leave home for afternoon class — drop off Zizi", {
            startTime: "12:30",
          }),
        ],
      },
    ],
    weeklyScheduleSummer: [],
    schoolCalendar: {
      summerEndsOn: "2026-09-01",
      termStartsOn: "2026-09-02",
      grade: "K3",
      classSession: "PM",
    },
    helperName: "Charlene",
    familyName: "Zizi",
    ziziSchool: { en: "", fil: "" },
    monthlyTasks: [],
    lastUpdated: "",
  } as unknown as AppContent;

  const at1130 = new Date("2026-09-08T11:30:00+08:00");
  const at1129 = new Date("2026-09-08T11:29:00+08:00");
  const at1230 = new Date("2026-09-08T12:30:00+08:00");

  const due = getOutingRemindersForDate(content, at1130);
  assert.equal(due.dayOff, false);
  assert.equal(due.items.length, 1);
  assert.equal(due.items[0].due, true);

  assert.equal(getOutingRemindersForDate(content, at1129).items[0].due, false);
  assert.equal(getOutingRemindersForDate(content, at1230).items[0].due, false);
});

test("skips Charlene day off (Sunday)", () => {
  const content = {
    weeklySchedule: [
      {
        dayKey: "sunday",
        day: { en: "Sun", fil: "Sun" },
        tasks: [
          task("x", "Leave home for afternoon class — drop off Zizi", {
            startTime: "12:30",
          }),
        ],
      },
    ],
    helperName: "Charlene",
    familyName: "Zizi",
    ziziSchool: { en: "", fil: "" },
    monthlyTasks: [],
    lastUpdated: "",
  } as unknown as AppContent;

  const sunday = new Date("2026-09-06T11:30:00+08:00");
  const result = getOutingRemindersForDate(content, sunday);
  assert.equal(result.dayOff, true);
  assert.equal(result.items.length, 0);
});

test("reminder text is trilingual and names the leave time", () => {
  const text = formatOutingReminderMessage({
    id: "sw5",
    dateKey: "2026-08-26",
    startTime: "11:15",
    remindAtMinutes: 615,
    due: true,
    task: {
      en: "Prepare & leave home for drawing class",
      fil: "Maghanda at umalis papuntang drawing class",
      zh: "準備出門前往繪畫班",
    },
  });
  assert.match(text, /11:15/);
  assert.match(text, /Charlene/);
  assert.match(text, /Maghanda/);
  assert.match(text, /繪畫班/);
});
