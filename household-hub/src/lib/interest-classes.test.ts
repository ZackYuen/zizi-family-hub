import assert from "node:assert/strict";
import test from "node:test";
import {
  applyInterestClassDay,
  interestClassForDate,
  interestClassOverview,
  isInterestClassQuestion,
} from "./interest-classes";
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

const monday: ScheduleTask[] = [
  task("m3", "10:15", "11:30", "Prepare Zizi's lunch"),
  task("m4", "11:30", "12:00", "Afternoon school prep"),
  task("m5", "12:00", "12:30", "ZiZi lunch at home"),
  task("m6", "12:30", "13:00", "Leave home for afternoon class", {
    outingReminder: true,
  }),
  task("m7", "13:30", "15:30", "Wash clothing"),
  task("m9", "16:00", "16:30", "Leave home for pick-up"),
  task("m12", "16:30", "17:00", "ZiZi tea time"),
];

test("interest class dates: percussion / Sumblox / fencing", () => {
  assert.equal(interestClassForDate("2026-09-08"), null);
  assert.equal(interestClassForDate("2026-10-05"), null);
  assert.equal(interestClassForDate("2026-10-12")?.term.id, "percussion");
  assert.equal(interestClassForDate("2026-10-06")?.term.id, "sumblox-magic");
  assert.equal(interestClassForDate("2026-10-06")?.after, true);
  assert.equal(interestClassForDate("2026-10-02")?.term.id, "fencing");
  assert.equal(interestClassForDate("2026-10-02")?.after, false);
});

test("applyInterestClassDay shifts leave to 11:30", () => {
  const spec = interestClassForDate("2026-10-12");
  assert.ok(spec);
  const out = applyInterestClassDay(monday, spec);
  const leave = out.find((t) => t.id === "m6");
  assert.equal(leave?.startTime, "11:30");
  assert.match(leave?.task.en || "", /percussion/i);
  assert.equal(out.find((t) => t.id === "m4")?.startTime, "10:30");
  assert.equal(out.find((t) => t.id === "m5")?.startTime, "11:00");
  assert.equal(out.find((t) => t.id === "m7")?.startTime, "12:30");
  assert.equal(out.find((t) => t.id === "m9")?.startTime, "16:00");
  assert.ok(out.some((t) => t.id === "m-noon-class"));
});

test("Tuesday Sumblox + magic: leave 11:30, pick up 17:30", () => {
  const tue = monday.map((t) => ({ ...t, id: t.id.replace(/^m/, "t") }));
  const spec = interestClassForDate("2026-10-06");
  assert.ok(spec);
  const out = applyInterestClassDay(tue, spec);
  assert.equal(out.find((t) => t.id === "t6")?.startTime, "11:30");
  assert.equal(out.find((t) => t.id === "t9")?.startTime, "17:00");
  assert.equal(out.find((t) => t.id === "t9")?.endTime, "17:30");
  assert.equal(out.find((t) => t.id === "t9")?.outingReminder, true);
  assert.equal(out.find((t) => t.id === "t12")?.startTime, "17:30");
  assert.ok(out.some((t) => t.id === "t-magic-class"));
});

test("resolveTasksForDate overlays interest class on term days", () => {
  const content = {
    weeklySchedule: [
      {
        dayKey: "monday",
        day: { en: "Monday", fil: "Lunes" },
        tasks: monday,
      },
    ],
    schoolCalendar: {
      summerEndsOn: "2026-09-01",
      termStartsOn: "2026-09-02",
      grade: "K3",
      classSession: "PM",
    },
  } as unknown as AppContent;

  const classDay = resolveTasksForDate(content, "2026-10-12");
  assert.equal(classDay.fromOverride, false);
  assert.equal(classDay.tasks.find((t) => t.id === "m6")?.startTime, "11:30");

  const normalMon = resolveTasksForDate(content, "2026-10-05");
  assert.equal(normalMon.tasks.find((t) => t.id === "m6")?.startTime, "12:30");

  const overridden = resolveTasksForDate(
    {
      ...content,
      scheduleDateOverrides: {
        "2026-10-12": [task("m6", "12:30", "13:00", "Leave home for afternoon class")],
      },
    },
    "2026-10-12"
  );
  assert.equal(overridden.fromOverride, true);
  assert.equal(overridden.tasks[0].startTime, "12:30");
});

test("interest class question heuristic", () => {
  assert.equal(isInterestClassQuestion("tonight eat what"), false);
  assert.equal(isInterestClassQuestion("Sumblox"), true);
  assert.equal(isInterestClassQuestion("興趣班"), true);
  assert.equal(isInterestClassQuestion("劍擊"), true);
  assert.match(interestClassOverview("zh", "2026-10-06"), /17:30/);
  assert.match(interestClassOverview("en", "2026-09-08"), /no interest class/);
});
