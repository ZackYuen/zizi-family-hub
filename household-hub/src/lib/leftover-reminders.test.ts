import assert from "node:assert/strict";
import test from "node:test";
import {
  formatLeftoverReminderMessage,
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

test("leftover reminder skips day off and saved tonight menu", () => {
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
    false
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

test("leftover reminder text asks Charlene to check and suggest, no bot reply", () => {
  const text = formatLeftoverReminderMessage();
  assert.match(text, /Hi Charlene/i);
  assert.match(text, /tingnan ang fridge/i);
  assert.match(text, /Mag-suggest/i);
  assert.match(text, /ask Mum/i);
  assert.match(text, /tanong kay Mum/i);
  assert.equal(/\?leftover/.test(text), false);
  assert.equal(/tomato|egg/i.test(text), false);
  assert.equal(/[\u4e00-\u9fff]/.test(text), false);
});
