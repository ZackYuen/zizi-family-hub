import assert from "node:assert/strict";
import test from "node:test";
import {
  formatOutingReminderMessage,
  getOutingRemindersForDate,
  isOutingLeaveTask,
  overlayOutingReminderFlags,
  parseWhatsAppGroupJids,
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

test("only outingReminder true is reminded", () => {
  assert.equal(
    isOutingLeaveTask(
      task("m6", "Leave home for afternoon class — drop off Zizi")
    ),
    false
  );
  assert.equal(
    isOutingLeaveTask(
      task("m6", "Leave home for afternoon class — drop off Zizi", {
        outingReminder: true,
      })
    ),
    true
  );
  assert.equal(
    isOutingLeaveTask(
      task("x", "Stay home and rest", { outingReminder: true })
    ),
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

test("overlay copies seed flags onto live tasks without a flag", () => {
  const seed = {
    weeklySchedule: [
      {
        dayKey: "monday",
        day: { en: "Mon", fil: "Mon" },
        tasks: [task("m6", "Leave home", { outingReminder: true })],
      },
    ],
  } as unknown as AppContent;
  const live = {
    weeklySchedule: [
      {
        dayKey: "monday",
        day: { en: "Mon", fil: "Mon" },
        tasks: [task("m6", "Leave home")],
      },
    ],
  } as unknown as AppContent;
  const merged = overlayOutingReminderFlags(live, seed);
  assert.equal(merged.weeklySchedule[0].tasks[0].outingReminder, true);

  const optedOut = overlayOutingReminderFlags(
    {
      weeklySchedule: [
        {
          dayKey: "monday",
          day: { en: "Mon", fil: "Mon" },
          tasks: [task("m6", "Leave home", { outingReminder: false })],
        },
      ],
    } as unknown as AppContent,
    seed
  );
  assert.equal(optedOut.weeklySchedule[0].tasks[0].outingReminder, false);
});

test("parses WhatsApp group JIDs", () => {
  assert.deepEqual(parseWhatsAppGroupJids("  120363abc@g.us , 120363def@g.us "), [
    "120363abc@g.us",
    "120363def@g.us",
  ]);
  assert.deepEqual(parseWhatsAppGroupJids("not-a-group"), []);
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
            outingReminder: true,
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
            outingReminder: true,
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

test("reminder text is generic: in 1 hour + the task, no leave/出門 wrapper", () => {
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
    notes: {
      en: "Bring art bag",
      fil: "Dalhin ang art bag",
      zh: "帶畫袋",
    },
  });
  assert.match(text, /11:15/);
  assert.match(text, /Charlene/);
  assert.match(text, /In 1 hour/);
  assert.match(text, /Sa 1 oras/);
  assert.doesNotMatch(text, /Leave in 1 hour/);
  assert.doesNotMatch(text, /1小時後/);
  assert.doesNotMatch(text, /中文/);
  assert.doesNotMatch(text, /alis 11:15/);
  assert.match(text, /Maghanda/);
  assert.match(text, /Bring art bag/);
  assert.match(text, /Dalhin ang art bag/);
  assert.doesNotMatch(text, /繪畫班/);
  assert.doesNotMatch(text, /帶畫袋/);
});
