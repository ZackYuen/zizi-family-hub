import assert from "node:assert/strict";
import test from "node:test";
import {
  formatOctopusCashReminderMessage,
  getOctopusCashReminderState,
  isOctopusCashCheckDay,
  octopusCashScheduleTask,
  octopusRemindersSettingOn,
  octopusTipMentionsSpeakUp,
  overlayOctopusSpeakUpGuide,
  withOctopusCashScheduleTask,
  OCTOPUS_CASH_REMIND_AT_MINUTES,
  OCTOPUS_CASH_REMIND_ID,
  OCTOPUS_CASH_REMIND_UNTIL_MINUTES,
  OCTOPUS_CASH_TASK_ID,
} from "./octopus-reminders";
import { resolveTasksForDate } from "./school-calendar";
import type { AppContent, ScheduleTask } from "./types";

function state(
  extra: Partial<Parameters<typeof getOctopusCashReminderState>[0]> = {}
) {
  return getOctopusCashReminderState({
    dateKey: "2026-11-09",
    dayKey: "monday",
    nowMinutes: 9 * 60,
    dayOff: false,
    ...extra,
  });
}

test("octopus reminder is due Mon/Thu from 09:00 until 16:00", () => {
  const at = (minutes: number, dayKey = "monday") =>
    getOctopusCashReminderState({
      dateKey: "2026-11-09",
      dayKey,
      nowMinutes: minutes,
      dayOff: false,
    });

  assert.equal(at(OCTOPUS_CASH_REMIND_AT_MINUTES - 1).due, false);
  assert.equal(at(OCTOPUS_CASH_REMIND_AT_MINUTES).due, true);
  assert.equal(at(10 * 60).due, true);
  assert.equal(at(OCTOPUS_CASH_REMIND_UNTIL_MINUTES - 1).due, true);
  assert.equal(at(OCTOPUS_CASH_REMIND_UNTIL_MINUTES).due, false);

  assert.equal(at(9 * 60, "thursday").due, true);
  assert.equal(at(9 * 60, "tuesday").due, false);
  assert.equal(at(9 * 60, "wednesday").due, false);
  assert.equal(at(9 * 60, "friday").due, false);
  assert.equal(at(9 * 60, "saturday").due, false);
  assert.equal(isOctopusCashCheckDay("monday"), true);
  assert.equal(isOctopusCashCheckDay("sunday"), false);
});

test("octopus reminder skips when Admin toggle is off; missing = on", () => {
  assert.equal(octopusRemindersSettingOn(undefined), true);
  assert.equal(octopusRemindersSettingOn(null), true);
  assert.equal(octopusRemindersSettingOn(true), true);
  assert.equal(octopusRemindersSettingOn(false), false);
  assert.equal(state({ enabled: false }).due, false);
  assert.equal(state({ enabled: undefined }).due, true);
  assert.equal(state({ enabled: true }).enabled, true);
});

test("octopus reminder skips day off even on Monday", () => {
  assert.equal(state({ dayOff: true, dayKey: "monday" }).due, false);
  assert.equal(state({ dayOff: true, dayKey: "thursday" }).due, false);
  assert.equal(state({ dayOff: false }).id, OCTOPUS_CASH_REMIND_ID);
  assert.equal(state({ dayKey: "tuesday" }).checkDay, false);
  assert.equal(state({ dayKey: "monday" }).checkDay, true);
});

test("octopus reminder text is kind but firm FIL+EN and invites a reply", () => {
  const text = formatOctopusCashReminderMessage();
  assert.match(text, /Hi Charlene/i);
  assert.match(text, /Octopus \(八達通\)/);
  assert.match(text, /cash/i);
  assert.match(text, /Pakitingnan/);
  assert.match(text, /Sir\/Mum/);
  assert.match(text, /kulang na ang alinman/);
  assert.match(text, /running low/i);
  assert.match(text, /same day/i);
  assert.match(text, /ngayong araw/);
  assert.match(text, /Puwede kang mag-reply sa group/);
  assert.match(text, /You may reply in this group/);
  assert.equal(/no (bot )?reply needed/i.test(text), false);
  assert.equal(/\$\d+|HKD\s*\d+|threshold/i.test(text), false);
  assert.equal(/中文:/.test(text), false);
});

function task(id: string, start = "09:30"): ScheduleTask {
  return {
    id,
    time: start,
    startTime: start,
    task: { en: id, fil: id },
  };
}

test("schedule shows Octopus/cash check on Mon/Thu workdays only", () => {
  const monday = withOctopusCashScheduleTask([task("m1")], {
    dayKey: "monday",
    dayOff: false,
  });
  assert.equal(monday.some((t) => t.id === OCTOPUS_CASH_TASK_ID), true);
  const added = monday.find((t) => t.id === OCTOPUS_CASH_TASK_ID);
  assert.equal(added?.startTime, "09:00");
  assert.equal(added?.outingReminder, false);
  assert.match(added?.task.en || "", /Octopus/);
  assert.match(added?.task.en || "", /running low/);
  assert.match(added?.notes?.en || "", /same day/);

  const thursday = withOctopusCashScheduleTask([task("th1")], {
    dayKey: "thursday",
    dayOff: false,
  });
  assert.equal(thursday.some((t) => t.id === OCTOPUS_CASH_TASK_ID), true);

  assert.equal(
    withOctopusCashScheduleTask([task("t1")], {
      dayKey: "tuesday",
      dayOff: false,
    }).some((t) => t.id === OCTOPUS_CASH_TASK_ID),
    false
  );
  assert.equal(
    withOctopusCashScheduleTask([task("m1")], {
      dayKey: "monday",
      dayOff: true,
    }).some((t) => t.id === OCTOPUS_CASH_TASK_ID),
    false
  );
  assert.equal(
    withOctopusCashScheduleTask([task("m1")], {
      dayKey: "monday",
      dayOff: false,
      enabled: false,
    }).some((t) => t.id === OCTOPUS_CASH_TASK_ID),
    false
  );
});

test("schedule inject does not duplicate or mark outingReminder", () => {
  const existing = octopusCashScheduleTask();
  const out = withOctopusCashScheduleTask([existing, task("m1")], {
    dayKey: "monday",
    dayOff: false,
  });
  assert.equal(out.filter((t) => t.id === OCTOPUS_CASH_TASK_ID).length, 1);
  assert.equal(octopusCashScheduleTask().outingReminder, false);
});

test("overlay adds speak-up language to existing Octopus tip without replacing other guides", () => {
  const live = {
    hkLifeGuides: [
      {
        id: "life-emergency-999",
        category: "emergency",
        priority: 1,
        area: "hk-general",
        title: { en: "999", fil: "999" },
        body: { en: "Call 999", fil: "Tumawag sa 999" },
      },
      {
        id: "life-octopus",
        category: "money",
        priority: 30,
        area: "hk-general",
        title: { en: "Octopus card", fil: "Octopus card", zh: "八達通" },
        body: {
          en: "Get an Octopus card early. Keep enough balance. Never borrow money for top-up — ask Sir/Mum.",
          fil: "Kumuha agad ng Octopus. Mag-iwan ng sapat na balanse. Huwag humiram ng pera — tanungin si Sir/Mum.",
          zh: "盡早辦理八達通。保持足夠餘額。不要借錢增值 — 問 Sir/Mum。",
        },
      },
    ],
  } as unknown as AppContent;
  const seed = {
    hkLifeGuides: [
      {
        id: "life-octopus",
        category: "money",
        priority: 30,
        area: "hk-general",
        title: { en: "Octopus card", fil: "Octopus card", zh: "八達通" },
        body: {
          en: "Get an Octopus card early. Check both Octopus and cash regularly. The same day, tell Sir/Mum if either is running low — do not wait.",
          fil: "Kumuha agad ng Octopus. Regular na tingnan ang Octopus at cash. Sa araw ding iyon, sabihin kina Sir/Mum kung kulang na ang alinman — huwag maghintay.",
          zh: "盡早辦理八達通。請定期檢查八達通和現金。若其中一項不足，當天告訴 Sir/Mum，不要拖延。",
        },
      },
    ],
  } as unknown as AppContent;

  assert.equal(octopusTipMentionsSpeakUp(live.hkLifeGuides![1].body), false);
  const merged = overlayOctopusSpeakUpGuide(live, seed);
  assert.equal(merged.hkLifeGuides![0].body.en, "Call 999");
  assert.match(merged.hkLifeGuides![1].body.en, /Keep enough balance/);
  assert.match(merged.hkLifeGuides![1].body.en, /running low/i);
  assert.match(merged.hkLifeGuides![1].body.fil, /kulang na ang alinman/);
  assert.equal(/\$\d+|HKD\s*\d+/.test(merged.hkLifeGuides![1].body.en), false);

  const already = overlayOctopusSpeakUpGuide(merged, seed);
  assert.equal(already.hkLifeGuides![1].body.en, merged.hkLifeGuides![1].body.en);

  const legacyLive = {
    hkLifeGuides: [
      {
        id: "life-octopus",
        category: "money",
        priority: 30,
        area: "hk-general",
        title: { en: "Octopus card", fil: "Octopus card", zh: "八達通" },
        body: {
          en: "Get an Octopus card early. Use it on MTR, buses, and many shops (7-Eleven, some supermarkets). Top up at MTR machines or 7-Eleven. Keep enough balance for school walks / shopping days. Never borrow money for top-up — ask Sir/Mum.",
          fil: "Kumuha agad ng Octopus.",
          zh: "盡早辦理八達通。",
        },
      },
    ],
  } as unknown as AppContent;
  const fromLegacy = overlayOctopusSpeakUpGuide(legacyLive, seed);
  assert.equal(fromLegacy.hkLifeGuides![0].body.en, seed.hkLifeGuides![0].body.en);
});

test("resolveTasksForDate appends Octopus/cash check on Monday without outing ping", () => {
  const content = {
    weeklySchedule: [
      {
        dayKey: "monday",
        day: { en: "Monday", fil: "Lunes" },
        tasks: [task("m1", "09:30")],
      },
    ],
    schoolCalendar: {
      summerEndsOn: "2026-09-01",
      termStartsOn: "2026-09-02",
      grade: "K3",
      classSession: "PM",
    },
  } as unknown as AppContent;
  const monday = resolveTasksForDate(content, "2026-11-09");
  assert.equal(monday.dayKey, "monday");
  assert.equal(monday.tasks.some((t) => t.id === OCTOPUS_CASH_TASK_ID), true);
  assert.equal(
    monday.tasks.find((t) => t.id === OCTOPUS_CASH_TASK_ID)?.outingReminder,
    false
  );

  const tuesday = resolveTasksForDate(
    {
      ...content,
      weeklySchedule: [
        {
          dayKey: "tuesday",
          day: { en: "Tuesday", fil: "Martes" },
          tasks: [task("t1", "09:30")],
        },
      ],
    },
    "2026-11-10"
  );
  assert.equal(tuesday.dayKey, "tuesday");
  assert.equal(
    tuesday.tasks.some((t) => t.id === OCTOPUS_CASH_TASK_ID),
    false
  );

  const holidayThursday = resolveTasksForDate(
    {
      ...content,
      weeklySchedule: [
        {
          dayKey: "thursday",
          day: { en: "Thursday", fil: "Huwebes" },
          tasks: [task("th1", "09:30")],
        },
      ],
    },
    "2026-10-01"
  );
  assert.equal(holidayThursday.dayKey, "thursday");
  assert.equal(
    holidayThursday.tasks.some((t) => t.id === OCTOPUS_CASH_TASK_ID),
    false
  );
});
