import assert from "node:assert/strict";
import test from "node:test";
import {
  applyAck,
  applyClaimPending,
  applyEnqueue,
  applyRecordReply,
  emptyOutboundStore,
  listOutboundMessages,
  listOutboundReplies,
  normalizeDestination,
  normalizeOutboundText,
  recycleStaleClaims,
  OUTBOUND_CLAIM_TIMEOUT_MS,
  OUTBOUND_TEXT_MAX,
} from "./whatsapp-outbound";

test("normalizeDestination accepts HK local, 852, +852, and wa.me", () => {
  const expectJid = "85291234567@s.whatsapp.net";
  for (const input of [
    "91234567",
    "85291234567",
    "+852 9123 4567",
    "852-9123-4567",
    "0085291234567",
    "https://wa.me/85291234567",
    "https://api.whatsapp.com/send?phone=85291234567",
    "whatsapp:+85291234567",
    "85291234567@s.whatsapp.net",
    "85291234567:12@s.whatsapp.net",
    "85291234567@c.us",
  ]) {
    const result = normalizeDestination(input);
    assert.equal(result.ok, true, input);
    if (result.ok) {
      assert.equal(result.jid, expectJid, input);
      assert.equal(result.kind, "dm", input);
    }
  }
});

test("normalizeDestination accepts international numbers with country code", () => {
  const plus = normalizeDestination("+1 415 555 2671");
  assert.equal(plus.ok, true);
  if (plus.ok) {
    assert.equal(plus.jid, "14155552671@s.whatsapp.net");
    assert.equal(plus.kind, "dm");
  }
  const e164 = normalizeDestination("14155552671");
  assert.equal(e164.ok, true);
  if (e164.ok) assert.equal(e164.jid, "14155552671@s.whatsapp.net");
});

test("normalizeDestination accepts explicit group JIDs only", () => {
  const group = normalizeDestination("120363012345678901@g.us");
  assert.equal(group.ok, true);
  if (group.ok) {
    assert.equal(group.jid, "120363012345678901@g.us");
    assert.equal(group.kind, "group");
  }
  const digitsOnly = normalizeDestination("120363012345678901");
  assert.equal(digitsOnly.ok, false);
});

test("normalizeDestination rejects broadcast, multi-recipient, and junk", () => {
  const bad = [
    "",
    "   ",
    "status@broadcast",
    "12345678901@broadcast",
    "85291234567,85291112222",
    "85291234567;85291112222",
    ["85291234567", "85291112222"],
    "not-a-number",
    "123",
    "4155551234",
    "user@lid",
    "someone@example.com",
  ];
  for (const input of bad) {
    const result = normalizeDestination(input);
    assert.equal(result.ok, false, String(input));
  }
});

test("normalizeOutboundText skips empty and caps length", () => {
  assert.equal(normalizeOutboundText("").ok, false);
  assert.equal(normalizeOutboundText("   ").ok, false);
  assert.equal(normalizeOutboundText(null).ok, false);
  const long = "x".repeat(OUTBOUND_TEXT_MAX + 50);
  const capped = normalizeOutboundText(long);
  assert.equal(capped.ok, true);
  if (capped.ok) assert.equal(capped.text.length, OUTBOUND_TEXT_MAX);
});

test("enqueue validates destination and text; stores pending with stable id", () => {
  const now = new Date("2026-11-11T04:00:00.000Z");
  const empty = emptyOutboundStore(now);
  const missingTo = applyEnqueue(empty, { text: "hi" }, now);
  assert.equal(missingTo.ok, false);
  if (!missingTo.ok) assert.equal(missingTo.error, "to required");
  const missingText = applyEnqueue(empty, { to: "91234567" }, now);
  assert.equal(missingText.ok, false);
  if (!missingText.ok) assert.equal(missingText.error, "text required");
  const blast = applyEnqueue(
    empty,
    { to: "91234567", text: "hi", recipients: ["1", "2"] },
    now
  );
  assert.equal(blast.ok, false);
  if (!blast.ok) {
    assert.equal(blast.error, "one destination only — no broadcast");
  }

  const result = applyEnqueue(
    empty,
    {
      to: "91234567",
      text: "  Please confirm the lease dates.  ",
      purpose: "landlord",
      conversationId: "lease-2026",
      requestedBy: "grok-bot",
      clientMessageId: "draft-1",
    },
    now
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.duplicate, false);
  assert.ok(result.message.id.startsWith("out-"));
  assert.equal(result.message.jid, "85291234567@s.whatsapp.net");
  assert.equal(result.message.kind, "dm");
  assert.equal(result.message.status, "pending");
  assert.equal(result.message.text, "Please confirm the lease dates.");
  assert.equal(result.message.conversationId, "lease-2026");
});

test("enqueue with the same clientMessageId is idempotent", () => {
  const now = new Date("2026-11-11T04:00:00.000Z");
  const first = applyEnqueue(
    emptyOutboundStore(now),
    { to: "91234567", text: "hello", clientMessageId: "same-key" },
    now
  );
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = applyEnqueue(
    first.store,
    { to: "91234567", text: "different", clientMessageId: "same-key" },
    now
  );
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.duplicate, true);
  assert.equal(second.message.id, first.message.id);
  assert.equal(second.message.text, "hello");
  assert.equal(second.store.messages.length, 1);
});

test("claim moves pending to sending; stale sending returns to pending", () => {
  const t0 = new Date("2026-11-11T04:00:00.000Z");
  const queued = applyEnqueue(
    emptyOutboundStore(t0),
    { to: "91234567", text: "ping" },
    t0
  );
  assert.equal(queued.ok, true);
  if (!queued.ok) return;
  const claimed = applyClaimPending(queued.store, { limit: 5, now: t0 });
  assert.equal(claimed.claimed.length, 1);
  assert.equal(claimed.claimed[0].status, "sending");
  assert.equal(claimed.store.messages[0].status, "sending");

  const again = applyClaimPending(claimed.store, { now: t0 });
  assert.equal(again.claimed.length, 0);

  const staleAt = new Date(t0.getTime() + OUTBOUND_CLAIM_TIMEOUT_MS + 1000);
  const recycled = recycleStaleClaims(claimed.store.messages, staleAt);
  assert.equal(recycled[0].status, "pending");
  const reclaim = applyClaimPending(claimed.store, { now: staleAt });
  assert.equal(reclaim.claimed.length, 1);
  assert.equal(reclaim.claimed[0].id, queued.message.id);
});

test("ack sent/failed is idempotent and does not un-send", () => {
  const t0 = new Date("2026-11-11T04:00:00.000Z");
  const queued = applyEnqueue(
    emptyOutboundStore(t0),
    { to: "91234567", text: "ping" },
    t0
  );
  assert.equal(queued.ok, true);
  if (!queued.ok) return;
  const claimed = applyClaimPending(queued.store, { now: t0 });
  const id = claimed.claimed[0].id;
  const sent = applyAck(
    claimed.store,
    { id, status: "sent", waMessageId: "BAE5ABC" },
    t0
  );
  assert.ok("message" in sent);
  if (!("message" in sent)) return;
  assert.equal(sent.message.status, "sent");
  assert.equal(sent.duplicate, false);

  const again = applyAck(sent.store, { id, status: "sent" }, t0);
  assert.ok("message" in again);
  if (!("message" in again)) return;
  assert.equal(again.duplicate, true);

  const cannotFail = applyAck(sent.store, { id, status: "failed" }, t0);
  assert.ok("message" in cannotFail);
  if (!("message" in cannotFail)) return;
  assert.equal(cannotFail.message.status, "sent");
  assert.equal(cannotFail.duplicate, true);
});

test("failed ack records error; missing id is rejected", () => {
  const t0 = new Date("2026-11-11T04:00:00.000Z");
  const queued = applyEnqueue(
    emptyOutboundStore(t0),
    { to: "91234567", text: "ping" },
    t0
  );
  assert.equal(queued.ok, true);
  if (!queued.ok) return;
  const id = queued.message.id;
  const failed = applyAck(
    queued.store,
    { id, status: "failed", error: "not registered on WhatsApp" },
    t0
  );
  assert.ok("message" in failed);
  if (!("message" in failed)) return;
  assert.equal(failed.message.status, "failed");
  assert.equal(failed.message.error, "not registered on WhatsApp");
  const missing = applyAck(queued.store, { id: "nope", status: "sent" }, t0);
  assert.equal("error" in missing && missing.error, "message not found");
});

test("replies are stored only for known outbound conversations", () => {
  const t0 = new Date("2026-11-11T04:00:00.000Z");
  const queued = applyEnqueue(
    emptyOutboundStore(t0),
    {
      to: "91234567",
      text: "hello landlord",
      conversationId: "lease-2026",
    },
    t0
  );
  assert.equal(queued.ok, true);
  if (!queued.ok) return;
  const unknown = applyRecordReply(
    queued.store,
    { jid: "85291112222", text: "who is this?" },
    t0
  );
  assert.equal(unknown.stored, false);
  if (!unknown.stored) assert.equal(unknown.reason, "unknown_conversation");

  const stored = applyRecordReply(
    queued.store,
    {
      jid: "85291234567@s.whatsapp.net",
      text: "Yes, please send the contract.",
      fromName: "Landlord",
      waMessageId: "BAE5IN",
    },
    t0
  );
  assert.equal(stored.stored, true);
  if (!stored.stored) return;
  assert.equal(stored.reply.conversationId, "lease-2026");
  assert.equal(stored.reply.outboundMessageId, queued.message.id);

  const dup = applyRecordReply(
    stored.store,
    {
      jid: "91234567",
      text: "Yes, please send the contract.",
      waMessageId: "BAE5IN",
    },
    t0
  );
  assert.equal(dup.stored, true);
  if (dup.stored) {
    assert.equal(dup.duplicate, true);
    assert.equal(dup.reply.id, stored.reply.id);
  }

  const listed = listOutboundReplies(stored.store, {
    conversationId: "lease-2026",
  });
  assert.equal(listed.length, 1);
  assert.equal(listed[0].text, "Yes, please send the contract.");
});

test("group chats are not captured as outbound replies", () => {
  const t0 = new Date("2026-11-11T04:00:00.000Z");
  const queued = applyEnqueue(
    emptyOutboundStore(t0),
    { to: "120363012345678901@g.us", text: "group ping" },
    t0
  );
  assert.equal(queued.ok, true);
  if (!queued.ok) return;
  assert.equal(queued.message.kind, "group");
  const reply = applyRecordReply(
    queued.store,
    { jid: "120363012345678901@g.us", text: "family chat" },
    t0
  );
  assert.equal(reply.stored, false);
  if (!reply.stored) assert.equal(reply.reason, "group_ignored");
});

test("list pending omits sent items", () => {
  const t0 = new Date("2026-11-11T04:00:00.000Z");
  const first = applyEnqueue(
    emptyOutboundStore(t0),
    { to: "91234567", text: "one" },
    t0
  );
  const second = applyEnqueue(
    first.store,
    { to: "91235555", text: "two" },
    t0
  );
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  const acked = applyAck(
    second.store,
    { id: first.message.id, status: "sent" },
    t0
  );
  assert.ok("store" in acked && "message" in acked);
  const pending = listOutboundMessages(acked.store, {
    status: "pending",
    now: t0,
  });
  assert.equal(pending.length, 1);
  assert.equal(pending[0].text, "two");
});
