import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLeftoverReminderFeed,
  formatLeftoverReminderMessage,
  leftoverTonightHint,
  getLeftoverReminderState,
  LEFTOVER_REMIND_AT_MINUTES,
  LEFTOVER_REMIND_ID,
} from "./leftover-reminders";

test("leftover reminder is due from 10:00 until 16:00 when menu is empty", () => {
  const at = (minutes: number) =>
    getLeftoverReminderState({
      dateKey: "2026-09-10",
      nowMinutes: minutes,
      dayOff: false,
      tonightDishCount: 0,
    });

  assert.equal(at(LEFTOVER_REMIND_AT_MINUTES - 1).due, false);
  assert.equal(at(LEFTOVER_REMIND_AT_MINUTES).due, true);
  assert.equal(at(12 * 60).due, true);
  assert.equal(at(16 * 60 - 1).due, true);
  assert.equal(at(16 * 60).due, false);
});

test("leftover reminder skips when Admin toggle is off", () => {
  assert.equal(
    getLeftoverReminderState({
      dateKey: "2026-09-10",
      nowMinutes: 11 * 60,
      dayOff: false,
      tonightDishCount: 0,
      enabled: false,
    }).due,
    false
  );
  assert.equal(
    getLeftoverReminderState({
      dateKey: "2026-09-10",
      nowMinutes: 11 * 60,
      dayOff: false,
      tonightDishCount: 0,
      enabled: undefined,
    }).due,
    true
  );
});

test("leftover reminder skips day off; saved dishes do not block (no today menu)", () => {
  assert.equal(
    getLeftoverReminderState({
      dateKey: "2026-09-10",
      nowMinutes: 11 * 60,
      dayOff: true,
      tonightDishCount: 0,
    }).due,
    false
  );
  assert.equal(
    getLeftoverReminderState({
      dateKey: "2026-09-10",
      nowMinutes: 11 * 60,
      dayOff: false,
      tonightDishCount: 2,
    }).due,
    true
  );
  assert.equal(
    getLeftoverReminderState({
      dateKey: "2026-09-10",
      nowMinutes: 11 * 60,
      dayOff: false,
      tonightDishCount: 0,
    }).id,
    LEFTOVER_REMIND_ID
  );
});

test("leftoverTonightHint says no today menu", () => {
  const text = leftoverTonightHint("en");
  assert.match(text, /No today menu/i);
  assert.match(text, /ask us/i);
});

test("leftover feed is due at 10:00 HKT on a work day without loading recipes", () => {
  const content = {
    leftoverRemindersEnabled: true,
    whatsappReminderGroupJids: "120363abc@g.us",
  };
  const due = buildLeftoverReminderFeed(
    content,
    new Date("2026-09-10T10:00:00+08:00")
  );
  assert.equal(due.enabled, true);
  assert.equal(due.dayOff, false);
  assert.equal(due.menuSaved, false);
  assert.equal(due.due.length, 1);
  assert.equal(due.due[0].id, LEFTOVER_REMIND_ID);
  assert.deepEqual(due.groupJids, ["120363abc@g.us"]);
  assert.match(due.due[0].text, /fridge/i);

  const before = buildLeftoverReminderFeed(
    content,
    new Date("2026-09-10T09:59:00+08:00")
  );
  assert.equal(before.due.length, 0);
});

test("leftover feed is empty and recipe-free when leftoverRemindersEnabled is false", () => {
  const feed = buildLeftoverReminderFeed(
    {
      leftoverRemindersEnabled: false,
      whatsappReminderGroupJids: "120363abc@g.us",
    },
    new Date("2026-09-10T11:00:00+08:00")
  );
  assert.equal(feed.enabled, false);
  assert.equal(feed.due.length, 0);
  assert.deepEqual(Object.keys(feed).sort(), [
    "date",
    "dayOff",
    "due",
    "enabled",
    "groupJids",
    "menuSaved",
    "nowMinutes",
  ]);
});

test("leftover reminder text asks Charlene to check and suggest, no bot reply", () => {
  const text = formatLeftoverReminderMessage();
  assert.match(text, /Hi Charlene/i);
  assert.match(text, /tingnan ang fridge/i);
  assert.match(text, /Mag-suggest/i);
  assert.match(text, /ask us/i);
  assert.match(text, /tanong sa amin/i);
  assert.equal(/\?leftover/.test(text), false);
  assert.equal(/tomato|egg/i.test(text), false);
  assert.equal(/[\u4e00-\u9fff]/.test(text), false);
});
