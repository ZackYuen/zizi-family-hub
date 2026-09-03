import assert from "node:assert/strict";
import test from "node:test";
import {
  overlayMissingTaskNotes,
  rewriteStaleSchoolPrepLunchBox,
  schoolPrepAnswer,
  schoolPrepNotes,
  isSchoolPrepQuestion,
} from "./school-prep";
import { formatOutingReminderMessage } from "./outing-reminders";
import type { AppContent, ScheduleTask } from "./types";

test("school prep notes: weekday vs Tuesday sportswear", () => {
  const mon = schoolPrepNotes(false);
  const tue = schoolPrepNotes(true);
  assert.match(mon.zh || "", /量溫度/);
  assert.match(mon.zh || "", /填體溫紙/);
  assert.match(mon.zh || "", /乾／濕毛巾/);
  assert.match(mon.zh || "", /兩個口罩/);
  assert.match(mon.zh || "", /帶水/);
  assert.match(mon.zh || "", /空食物盒.*茶點/);
  assert.doesNotMatch(mon.zh || "", /帶食物盒\n/);
  assert.match(mon.en, /empty food container for Zizi school tea time/);
  assert.doesNotMatch(mon.en, /Bring the lunch box/);
  assert.match(mon.fil, /walang lamang food container/);
  assert.match(mon.zh || "", /梳頭/);
  assert.match(mon.zh || "", /接送卡/);
  assert.doesNotMatch(mon.zh || "", /運動衫/);
  assert.match(tue.zh || "", /逢星期二著運動衫/);
  assert.match(tue.en, /Tuesday: wear sportswear/);
  assert.match(tue.fil, /Martes: magsuot ng sportswear/);
  assert.match(mon.en, /Take temperature/);
  assert.match(mon.fil, /Sukatin ang temperatura/);
});

test("overlay copies seed notes only when live notes are empty", () => {
  const notes = schoolPrepNotes(false);
  const seed = {
    weeklySchedule: [
      {
        dayKey: "monday",
        day: { en: "Mon", fil: "Mon" },
        tasks: [
          {
            id: "m6",
            time: "12:30",
            startTime: "12:30",
            task: { en: "Leave home", fil: "Umalis" },
            notes,
          },
        ],
      },
    ],
  } as unknown as AppContent;
  const live = {
    weeklySchedule: [
      {
        dayKey: "monday",
        day: { en: "Mon", fil: "Mon" },
        tasks: [
          {
            id: "m6",
            time: "12:30",
            startTime: "12:30",
            task: { en: "Leave home", fil: "Umalis" },
          },
        ],
      },
    ],
  } as unknown as AppContent;
  const merged = overlayMissingTaskNotes(live, seed);
  assert.equal(merged.weeklySchedule[0].tasks[0].notes?.en, notes.en);

  const kept = overlayMissingTaskNotes(
    {
      weeklySchedule: [
        {
          dayKey: "monday",
          day: { en: "Mon", fil: "Mon" },
          tasks: [
            {
              id: "m6",
              time: "12:30",
              startTime: "12:30",
              task: { en: "Leave home", fil: "Umalis" },
              notes: { en: "Admin note", fil: "Admin note" },
            },
          ],
        },
      ],
    } as unknown as AppContent,
    seed
  );
  assert.equal(kept.weeklySchedule[0].tasks[0].notes?.en, "Admin note");
});

test("WhatsApp reminder includes FIL then EN notes, no Chinese", () => {
  const notes = schoolPrepNotes(true);
  const text = formatOutingReminderMessage({
    id: "t6",
    dateKey: "2026-09-08",
    startTime: "12:30",
    remindAtMinutes: 690,
    due: true,
    task: {
      en: "Leave home for afternoon class",
      fil: "Umalis papuntang afternoon class",
      zh: "出門上下午班",
    },
    notes,
  });
  assert.match(text, /Sukatin ang temperatura/);
  assert.match(text, /Take temperature/);
  assert.match(text, /Martes: magsuot ng sportswear/);
  assert.doesNotMatch(text, /量溫度/);
  assert.doesNotMatch(text, /運動衫/);
  assert.doesNotMatch(text, /出門上下午班/);
});

test("Ask school-prep heuristic", () => {
  assert.equal(isSchoolPrepQuestion("school prep"), true);
  assert.equal(isSchoolPrepQuestion("接送卡"), true);
  assert.equal(isSchoolPrepQuestion("量溫度"), true);
  assert.equal(isSchoolPrepQuestion("what time is drop-off"), false);
  const tasks: ScheduleTask[] = [
    {
      id: "t4",
      time: "11:30",
      startTime: "11:30",
      task: { en: "Afternoon school prep", fil: "Prep", zh: "準備" },
      notes: schoolPrepNotes(true),
    },
  ];
  const fil = schoolPrepAnswer("fil", tasks, "tuesday");
  assert.match(fil, /11:30/);
  assert.match(fil, /Sukatin ang temperatura/);
  assert.match(fil, /Martes/);
});

test("rewrites stale lunch-box line to empty tea-time container", () => {
  const stale = {
    weeklySchedule: [
      {
        dayKey: "monday",
        day: { en: "Mon", fil: "Mon" },
        tasks: [
          {
            id: "m4",
            time: "11:30",
            startTime: "11:30",
            task: { en: "Prep", fil: "Prep" },
            notes: {
              en: "Zizi school prep:\n• Bring the lunch box\n• Help Zizi comb hair",
              fil: "Prep ni Zizi sa eskwela:\n• Magdala ng food box / lunch box",
              zh: "孜孜上學準備：\n• 帶食物盒",
            },
          },
        ],
      },
    ],
  } as unknown as AppContent;
  const { content, changed } = rewriteStaleSchoolPrepLunchBox(stale);
  assert.equal(changed, true);
  assert.match(
    content.weeklySchedule[0].tasks[0].notes?.en || "",
    /empty food container for Zizi school tea time/
  );
  assert.doesNotMatch(
    content.weeklySchedule[0].tasks[0].notes?.en || "",
    /Bring the lunch box/
  );
  assert.match(
    content.weeklySchedule[0].tasks[0].notes?.fil || "",
    /walang lamang food container/
  );
  assert.match(
    content.weeklySchedule[0].tasks[0].notes?.zh || "",
    /空食物盒給孜孜學校茶點時間/
  );
  const again = rewriteStaleSchoolPrepLunchBox(content);
  assert.equal(again.changed, false);
});
