import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMAE_ICCHO_SOP,
  demaeIcchoAnswer,
  isDemaeIcchoQuestion,
} from "./demae-iccho";

test("Demae Iccho SOP matches household steps", () => {
  assert.match(DEMAE_ICCHO_SOP.zh || "", /煲滾一兜水/);
  assert.match(DEMAE_ICCHO_SOP.zh || "", /300\s*ml/);
  assert.match(DEMAE_ICCHO_SOP.zh || "", /味粉/);
  assert.match(DEMAE_ICCHO_SOP.zh || "", /一分半鐘/);
  assert.match(DEMAE_ICCHO_SOP.zh || "", /3 分鐘/);
  assert.match(DEMAE_ICCHO_SOP.en, /1½ minutes/);
  assert.match(DEMAE_ICCHO_SOP.en, /Finish eating within 3 minutes/);
  assert.match(DEMAE_ICCHO_SOP.fil, /300 ml/);
  assert.match(DEMAE_ICCHO_SOP.fil, /1½ minuto/);
});

test("Ask detects 出前一丁", () => {
  assert.equal(isDemaeIcchoQuestion("出前一丁"), true);
  assert.equal(isDemaeIcchoQuestion("how to cook demae iccho"), true);
  assert.equal(isDemaeIcchoQuestion("paano lutuin ang 出前一丁"), true);
  assert.equal(isDemaeIcchoQuestion("tonight dinner"), false);
  assert.match(demaeIcchoAnswer("zh"), /煲滾一兜水/);
  assert.match(demaeIcchoAnswer("en"), /Scoop out 300 ml/);
});
