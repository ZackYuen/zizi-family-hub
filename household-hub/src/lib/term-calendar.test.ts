import assert from "node:assert/strict";
import test from "node:test";
import {
  isKindergartenClosed,
  kindergartenClosedEvent,
  schoolEventsOn,
  upcomingSchoolNotices,
} from "./term-calendar";
import { interestClassForDate } from "./interest-classes";
import { resolveTasksForDate } from "./school-calendar";
import type { AppContent, ScheduleTask } from "./types";

function task(
  id: string,
  start: string,
  end: string,
  en: string,
  extra: Partial<ScheduleTask> = {}
): ScheduleTask {
  return {
    id,
    time: start,
    startTime: start,
    endTime: end,
    task: { en, fil: en, zh: en },
    ...extra,
  };
}

const friday: ScheduleTask[] = [
  task("f4", "11:30", "12:00", "Afternoon school prep"),
  task("f6", "12:30", "13:00", "Leave home for afternoon class", {
    outingReminder: true,
  }),
  task("f9", "16:00", "16:30", "Leave home for pick-up", { outingReminder: true }),
];

const saturday: ScheduleTask[] = [
  task("s3", "10:15", "12:00", "Prepare lunch — no kindergarten"),
  task("s4", "12:00", "13:00", "ZiZi lunch at home"),
];

const content = {
  weeklySchedule: [
    {
      dayKey: "friday",
      day: { en: "Friday", fil: "Biyernes" },
      tasks: friday,
    },
    {
      dayKey: "saturday",
      day: { en: "Saturday", fil: "Sabado" },
      tasks: saturday,
    },
    {
      dayKey: "monday",
      day: { en: "Monday", fil: "Lunes" },
      tasks: [
        task("m6", "12:30", "13:00", "Leave home for afternoon class", {
          outingReminder: true,
        }),
      ],
    },
  ],
  schoolCalendar: {
    summerEndsOn: "2026-09-01",
    termStartsOn: "2026-09-02",
    grade: "K3",
    classSession: "PM",
  },
} as unknown as AppContent;

test("first-term closed days from official calendar", () => {
  assert.equal(isKindergartenClosed("2026-09-24"), false);
  assert.equal(isKindergartenClosed("2026-09-25"), true);
  assert.equal(isKindergartenClosed("2026-10-01"), true);
  assert.equal(isKindergartenClosed("2026-10-02"), true);
  assert.equal(isKindergartenClosed("2026-10-03"), false);
  assert.equal(isKindergartenClosed("2026-11-13"), true);
  assert.equal(isKindergartenClosed("2026-12-18"), true);
  assert.equal(isKindergartenClosed("2026-12-22"), true);
  assert.equal(isKindergartenClosed("2027-01-04"), true);
  assert.equal(isKindergartenClosed("2027-01-08"), true);
  assert.equal(isKindergartenClosed("2027-01-05"), false);
  assert.match(kindergartenClosedEvent("2026-10-02")?.title.en || "", /National Day/i);
});

test("school activities do not close kindergarten", () => {
  assert.equal(isKindergartenClosed("2026-10-10"), false);
  assert.equal(isKindergartenClosed("2026-12-12"), false);
  assert.ok(schoolEventsOn("2026-10-10").some((e) => e.kind === "activity"));
});

test("resolveTasksForDate uses home day on weekday school holiday", () => {
  const oct2 = resolveTasksForDate(content, "2026-10-02");
  assert.equal(oct2.schoolClosed, true);
  assert.equal(oct2.fromOverride, false);
  assert.ok(oct2.tasks.some((t) => /no kindergarten|walang kindergarten|停課/i.test(t.task.en)));
  assert.equal(
    oct2.tasks.some((t) => /leave home for (afternoon|pick-up)/i.test(t.task.en)),
    false
  );
  assert.equal(
    oct2.tasks.some((t) => t.outingReminder === true),
    false
  );

  const oct9 = resolveTasksForDate(content, "2026-10-09");
  assert.equal(oct9.schoolClosed, false);
  assert.equal(oct9.tasks.find((t) => t.id === "f6")?.outingReminder, true);
});

test("Admin date override still wins on a school holiday", () => {
  const overridden = resolveTasksForDate(
    {
      ...content,
      scheduleDateOverrides: {
        "2026-10-02": [task("special", "10:00", "11:00", "PTA meeting at school")],
      },
    },
    "2026-10-02"
  );
  assert.equal(overridden.fromOverride, true);
  assert.equal(overridden.schoolClosed, true);
  assert.equal(overridden.tasks[0].task.en, "PTA meeting at school");
});

test("fencing on 2 Oct / 8 Jan is skipped because school is closed", () => {
  assert.equal(interestClassForDate("2026-10-02"), null);
  assert.equal(interestClassForDate("2027-01-08"), null);
  assert.equal(interestClassForDate("2026-10-09")?.term.id, "fencing");
});

test("upcoming notices include next closed days", () => {
  const list = upcomingSchoolNotices("2026-09-28", undefined, 20);
  assert.ok(list.some((e) => e.id === "national-day-2026"));
  assert.ok(list.every((e) => (e.endDate || e.date) >= "2026-09-28"));
});
