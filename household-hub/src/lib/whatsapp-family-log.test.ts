import assert from "node:assert/strict";
import test from "node:test";
import { inboxAuthorized } from "./inbox-auth";
import {
  FAMILY_LOG_DIGEST_NOTE,
  FAMILY_LOG_MAX_MESSAGES,
  FAMILY_LOG_NUDGE_COOLDOWN_MS,
  FAMILY_LOG_NUDGE_MAX_PER_GROUP_PER_DAY,
  FAMILY_LOG_NUDGE_MIN_AGE_MS,
  FAMILY_LOG_NUDGE_MIN_GAP_MS,
  FAMILY_LOG_TEXT_MAX,
  FAMILY_LOG_USES_OUTBOUND_QUEUE,
  applyAckFamilyLogNudge,
  applyClaimDueFamilyLogNudges,
  applyFamilyLogIngest,
  buildFamilyLogDigest,
  emptyFamilyLogStore,
  familyLogAllowlist,
  formatFollowUpNudge,
  isAllowlistedFamilyGroup,
  isFamilyBotCommandText,
  isFamilyLogQuietHours,
  listFamilyLogMessages,
  looksLikeOpenFollowUp,
  normalizeFamilyGroupJid,
  publicFamilyLogMessage,
  type FamilyLogStore,
} from "./whatsapp-family-log";

const FAMILY = "120363012345678901@g.us";
const REMINDER = "120363098765432109@g.us";
const OTHER = "120363011111111111@g.us";
const DAY = new Date("2026-11-16T04:00:00.000Z"); // 12:00 HKT — not quiet hours

function allowlist(extra: string[] = []): string[] {
  return familyLogAllowlist({
    replyGroupJids: [FAMILY],
    reminderGroupJids: extra,
    fallbackGroupJids: [],
    groupAllowAll: true,
  });
}

function ingest(
  store: FamilyLogStore,
  input: Record<string, unknown>,
  list = allowlist(),
  now = DAY
) {
  return applyFamilyLogIngest(store, input, list, now);
}

function request(
  text: string,
  extra: Record<string, unknown> = {},
  now = DAY
) {
  return ingest(emptyFamilyLogStore(now), {
    jid: FAMILY,
    text,
    fromName: "Mum",
    waMessageId: extra.waMessageId || "BAE5-1",
    ...extra,
  }, allowlist(), now);
}

test("FAMILY_LOG_USES_OUTBOUND_QUEUE is false — nudges are not the 1:1 queue", () => {
  assert.equal(FAMILY_LOG_USES_OUTBOUND_QUEUE, false);
});

test("familyLogAllowlist is Admin reply ∪ reminder ∪ GROUP_JIDS; GROUP_ALLOW_ALL does not widen", () => {
  const list = familyLogAllowlist({
    replyGroupJids: FAMILY,
    reminderGroupJids: `${REMINDER},not-a-jid,85291234567@s.whatsapp.net`,
    fallbackGroupJids: "120363000000000000@g.us",
    groupAllowAll: true,
  });
  assert.deepEqual(list, [
    FAMILY,
    REMINDER,
    "120363000000000000@g.us",
  ]);
  assert.equal(list.includes(OTHER), false);
  assert.equal(isAllowlistedFamilyGroup(OTHER, list), false);
  assert.equal(isAllowlistedFamilyGroup(FAMILY, list), true);
  assert.equal(isAllowlistedFamilyGroup("85291234567@s.whatsapp.net", list), false);
});

test("normalizeFamilyGroupJid accepts groups only — never DMs, broadcasts, or junk", () => {
  assert.equal(normalizeFamilyGroupJid(FAMILY), FAMILY);
  assert.equal(normalizeFamilyGroupJid("120363012345678901:12@g.us"), FAMILY);
  assert.equal(normalizeFamilyGroupJid("85291234567@s.whatsapp.net"), null);
  assert.equal(normalizeFamilyGroupJid("85291234567"), null);
  assert.equal(normalizeFamilyGroupJid("status@broadcast"), null);
  assert.equal(normalizeFamilyGroupJid("123@broadcast"), null);
  assert.equal(normalizeFamilyGroupJid("user@lid"), null);
  assert.equal(normalizeFamilyGroupJid([FAMILY, OTHER]), null);
  assert.equal(normalizeFamilyGroupJid(""), null);
});

test("ingest stores allowlisted family-group chatter and skips empty / bot / non-text noise", () => {
  const stored = request("Please buy milk tonight");
  assert.equal(stored.ok, true);
  if (!stored.ok || !stored.stored) return;
  assert.equal(stored.duplicate, false);
  assert.equal(stored.autoReply, false);
  assert.equal(stored.enqueued, false);
  assert.equal(stored.message.jid, FAMILY);
  assert.equal(stored.message.text, "Please buy milk tonight");
  assert.equal(stored.message.fromName, "Mum");

  const empty = ingest(emptyFamilyLogStore(DAY), { jid: FAMILY, text: "   " });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.error, "text required");

  const emoji = ingest(emptyFamilyLogStore(DAY), { jid: FAMILY, text: "👍😂" });
  assert.equal(emoji.ok && !emoji.stored && emoji.reason === "no_human_content", true);

  const fromMe = ingest(emptyFamilyLogStore(DAY), {
    jid: FAMILY,
    text: "Please buy milk",
    fromMe: true,
  });
  assert.equal(fromMe.ok && !fromMe.stored && fromMe.reason === "from_me", true);
});

test("ingest is allowlisted groups only — unauthorized groups, DMs, and broadcasts are ignored", () => {
  const list = allowlist([REMINDER]);

  const other = ingest(
    emptyFamilyLogStore(DAY),
    { jid: OTHER, text: "Please buy milk tonight" },
    list
  );
  assert.equal(other.ok && !other.stored && other.reason === "group_not_allowlisted", true);
  if (other.ok && !other.stored) assert.equal(other.store.messages.length, 0);

  const dm = ingest(
    emptyFamilyLogStore(DAY),
    { jid: "85291234567@s.whatsapp.net", text: "Please buy milk tonight" },
    list
  );
  assert.equal(dm.ok && !dm.stored && dm.reason === "not_group", true);

  const blast = ingest(
    emptyFamilyLogStore(DAY),
    { jid: "status@broadcast", text: "Please buy milk tonight" },
    list
  );
  assert.equal(blast.ok && !blast.stored && blast.reason === "not_group", true);

  const reminder = ingest(
    emptyFamilyLogStore(DAY),
    { jid: REMINDER, text: "記得帶接送卡" },
    list
  );
  assert.equal(reminder.ok && reminder.stored, true);

  const emptyList = ingest(
    emptyFamilyLogStore(DAY),
    { jid: FAMILY, text: "Please buy milk tonight" },
    []
  );
  assert.equal(
    emptyList.ok && !emptyList.stored && emptyList.reason === "no_allowlisted_groups",
    true
  );
});

test("GROUP_ALLOW_ALL does not let ingest store a non-allowlisted group", () => {
  const list = familyLogAllowlist({
    replyGroupJids: FAMILY,
    groupAllowAll: true,
  });
  const result = ingest(
    emptyFamilyLogStore(DAY),
    { jid: OTHER, text: "Please buy bread" },
    list
  );
  assert.equal(result.ok && !result.stored && result.reason === "group_not_allowlisted", true);
});

test("ingest is idempotent on waMessageId and caps text / store size", () => {
  const first = request("Please buy milk tonight", { waMessageId: "BAE5DUP" });
  assert.equal(first.ok && first.stored, true);
  if (!first.ok || !first.stored) return;
  const dup = applyFamilyLogIngest(
    first.store,
    {
      jid: FAMILY,
      text: "Please buy milk tonight (again)",
      waMessageId: "BAE5DUP",
    },
    allowlist(),
    DAY
  );
  assert.equal(dup.ok && dup.stored && dup.duplicate, true);
  if (dup.ok && dup.stored) {
    assert.equal(dup.message.id, first.message.id);
    assert.equal(dup.store.messages.length, 1);
  }

  const long = "please buy " + "x".repeat(FAMILY_LOG_TEXT_MAX);
  const capped = request(long, { waMessageId: "BAE5LONG" });
  assert.equal(capped.ok && capped.stored, true);
  if (capped.ok && capped.stored) {
    assert.equal(capped.message.text.length, FAMILY_LOG_TEXT_MAX);
  }

  let store = emptyFamilyLogStore(DAY);
  for (let i = 0; i < FAMILY_LOG_MAX_MESSAGES + 25; i++) {
    const next = applyFamilyLogIngest(
      store,
      {
        jid: FAMILY,
        text: `Please buy item ${i} from the shop tonight`,
        waMessageId: `id-${i}`,
      },
      allowlist(),
      new Date(DAY.getTime() + i * 1000)
    );
    if (next.ok && next.stored) store = next.store;
  }
  assert.equal(store.messages.length, FAMILY_LOG_MAX_MESSAGES);
});

test("secret gating: inboxAuthorized requires matching x-inbox-secret", () => {
  const prevInbox = process.env.INBOX_SECRET;
  const prevBot = process.env.BOT_INBOX_SECRET;
  process.env.INBOX_SECRET = "family-log-secret-test";
  delete process.env.BOT_INBOX_SECRET;
  try {
    const missing = new Request("https://zizi-family-hub.vercel.app/api/whatsapp/family-log", {
      headers: { "content-type": "application/json" },
    });
    assert.equal(inboxAuthorized(missing), false);

    const wrong = new Request("https://zizi-family-hub.vercel.app/api/whatsapp/family-log", {
      headers: { "x-inbox-secret": "nope" },
    });
    assert.equal(inboxAuthorized(wrong), false);

    const ok = new Request("https://zizi-family-hub.vercel.app/api/whatsapp/family-log", {
      headers: { "x-inbox-secret": "family-log-secret-test" },
    });
    assert.equal(inboxAuthorized(ok), true);

    const leaked = JSON.stringify(
      publicFamilyLogMessage({
        id: "fam-1",
        jid: FAMILY,
        text: "Please buy milk tonight",
        ts: DAY.toISOString(),
      })
    );
    assert.equal(leaked.includes("family-log-secret-test"), false);
    assert.equal(FAMILY_LOG_DIGEST_NOTE.includes("INBOX_SECRET"), false);
  } finally {
    if (prevInbox === undefined) delete process.env.INBOX_SECRET;
    else process.env.INBOX_SECRET = prevInbox;
    if (prevBot === undefined) delete process.env.BOT_INBOX_SECRET;
    else process.env.BOT_INBOX_SECRET = prevBot;
  }
});

test("digest lists unfinished requests and closes them after a matching done/ack", () => {
  assert.equal(looksLikeOpenFollowUp("Please buy milk tonight"), true);
  assert.equal(looksLikeOpenFollowUp("記得帶 Zizi 的接送卡"), true);
  assert.equal(isFamilyBotCommandText("? Tonight dinner?"), true);
  assert.equal(looksLikeOpenFollowUp("? Tonight dinner?"), false);
  assert.equal(looksLikeOpenFollowUp("@CharleneBot what time pickup"), false);
  assert.equal(looksLikeOpenFollowUp("haha ok"), false);

  const t0 = DAY;
  const first = request("Please buy milk tonight", { waMessageId: "m1" }, t0);
  assert.equal(first.ok && first.stored, true);
  if (!first.ok || !first.stored) return;
  const second = applyFamilyLogIngest(
    first.store,
    {
      jid: FAMILY,
      text: "記得帶接送卡",
      fromName: "Sir",
      waMessageId: "m2",
    },
    allowlist(),
    new Date(t0.getTime() + 60_000)
  );
  assert.equal(second.ok && second.stored, true);
  if (!second.ok || !second.stored) return;

  const open = buildFamilyLogDigest(second.store, { allowlist: allowlist(), now: t0 });
  assert.equal(open.open.length, 2);
  assert.ok(open.open.some((item) => /milk/i.test(item.text)));
  assert.ok(open.note.includes("allowlisted"));

  const done = applyFamilyLogIngest(
    second.store,
    {
      jid: FAMILY,
      text: "Bought the milk already",
      fromName: "Charlene",
      waMessageId: "m3",
    },
    allowlist(),
    new Date(t0.getTime() + 120_000)
  );
  assert.equal(done.ok && done.stored, true);
  if (!done.ok || !done.stored) return;
  const after = buildFamilyLogDigest(done.store, { allowlist: allowlist(), now: t0 });
  assert.equal(after.open.some((item) => /milk/i.test(item.text)), false);
  assert.equal(after.open.some((item) => /接送卡/.test(item.text)), true);
});

test("list and digest never surface messages from unauthorized groups", () => {
  const t0 = DAY;
  const family = request("Please buy milk tonight", { waMessageId: "fam1" }, t0);
  assert.equal(family.ok && family.stored, true);
  if (!family.ok || !family.stored) return;
  const poisoned: FamilyLogStore = {
    ...family.store,
    messages: [
      {
        id: "fam-other",
        jid: OTHER,
        text: "Please transfer the rent tonight",
        ts: t0.toISOString(),
      },
      ...family.store.messages,
    ],
  };
  const listed = listFamilyLogMessages(poisoned, { allowlist: allowlist(), limit: 50 });
  assert.equal(listed.every((m) => m.jid === FAMILY), true);
  assert.equal(listed.some((m) => m.jid === OTHER), false);
  const otherQuery = listFamilyLogMessages(poisoned, {
    allowlist: allowlist(),
    jid: OTHER,
  });
  assert.equal(otherQuery.length, 0);
  const digest = buildFamilyLogDigest(poisoned, { allowlist: allowlist(), now: t0 });
  assert.equal(digest.open.some((item) => item.jid === OTHER), false);
});

test("proactive nudge is allowed only in the allowlisted group after min age", () => {
  const saidAt = new Date(DAY.getTime() - FAMILY_LOG_NUDGE_MIN_AGE_MS - 60_000);
  const stored = request(
    "Please buy milk tonight",
    { waMessageId: "nudge-1", fromName: "Mum" },
    saidAt
  );
  assert.equal(stored.ok && stored.stored, true);
  if (!stored.ok || !stored.stored) return;

  const tooSoon = applyClaimDueFamilyLogNudges(stored.store, allowlist(), {
    now: new Date(saidAt.getTime() + 5 * 60 * 1000),
    quietHours: false,
  });
  assert.equal(tooSoon.claimed.length, 0);

  const due = applyClaimDueFamilyLogNudges(stored.store, allowlist(), {
    now: DAY,
    quietHours: false,
  });
  assert.equal(due.claimed.length, 1);
  assert.equal(due.claimed[0].jid, FAMILY);
  assert.match(due.claimed[0].text, /FIL:/);
  assert.match(due.claimed[0].text, /EN:/);
  assert.match(due.claimed[0].text, /milk/i);
  assert.equal(due.claimed[0].status, "sending");
});

test("proactive nudge is not sent to other chats even if a request is in the store", () => {
  const saidAt = new Date(DAY.getTime() - FAMILY_LOG_NUDGE_MIN_AGE_MS - 60_000);
  const poisoned: FamilyLogStore = {
    messages: [
      {
        id: "fam-other",
        jid: OTHER,
        fromName: "Stranger",
        text: "Please buy milk tonight",
        ts: saidAt.toISOString(),
      },
    ],
    nudges: [],
    updatedAt: DAY.toISOString(),
  };
  const claimed = applyClaimDueFamilyLogNudges(poisoned, allowlist(), {
    now: DAY,
    quietHours: false,
  });
  assert.equal(claimed.claimed.length, 0);

  const emptyAllow = applyClaimDueFamilyLogNudges(poisoned, [], {
    now: DAY,
    quietHours: false,
  });
  assert.equal(emptyAllow.claimed.length, 0);

  const dmStore: FamilyLogStore = {
    messages: [
      {
        id: "fam-dm",
        jid: "85291234567@s.whatsapp.net",
        text: "Please buy milk tonight",
        ts: saidAt.toISOString(),
      },
    ],
    nudges: [],
    updatedAt: DAY.toISOString(),
  };
  const dmClaim = applyClaimDueFamilyLogNudges(
    dmStore,
    ["85291234567@s.whatsapp.net", FAMILY],
    { now: DAY, quietHours: false }
  );
  assert.equal(dmClaim.claimed.length, 0);
});

test("rate and dedup limits prevent spam of the same open item", () => {
  const saidAt = new Date(DAY.getTime() - FAMILY_LOG_NUDGE_MIN_AGE_MS - 60_000);
  const stored = request(
    "Please buy milk tonight",
    { waMessageId: "rate-1", fromName: "Mum" },
    saidAt
  );
  assert.equal(stored.ok && stored.stored, true);
  if (!stored.ok || !stored.stored) return;

  const first = applyClaimDueFamilyLogNudges(stored.store, allowlist(), {
    now: DAY,
    quietHours: false,
  });
  assert.equal(first.claimed.length, 1);

  const againSameTick = applyClaimDueFamilyLogNudges(first.store, allowlist(), {
    now: DAY,
    quietHours: false,
  });
  assert.equal(againSameTick.claimed.length, 0);

  const afterAck = applyAckFamilyLogNudge(
    first.store,
    { id: first.claimed[0].id, status: "sent" },
    DAY
  );
  assert.ok("nudge" in afterAck);
  if (!("nudge" in afterAck)) return;
  assert.equal(afterAck.nudge.status, "sent");

  const stillCooling = applyClaimDueFamilyLogNudges(afterAck.store, allowlist(), {
    now: new Date(DAY.getTime() + FAMILY_LOG_NUDGE_MIN_GAP_MS + 1000),
    quietHours: false,
  });
  assert.equal(stillCooling.claimed.length, 0);

  const afterCooldown = applyClaimDueFamilyLogNudges(afterAck.store, allowlist(), {
    now: new Date(DAY.getTime() + FAMILY_LOG_NUDGE_COOLDOWN_MS + 1000),
    quietHours: false,
  });
  assert.equal(afterCooldown.claimed.length, 1);

  const topics = [
    "Please buy apples from the wet market",
    "Please bring the pickup card for Zizi",
    "Please check the laundry in the dryer",
    "Please call the landlord about the leak",
    "Please remember to defrost the pork",
    "Please pick up fencing gear on Friday",
  ];
  let extraOpen = emptyFamilyLogStore(saidAt);
  for (let i = 0; i < topics.length; i++) {
    const at = new Date(saidAt.getTime() - i * 60 * 60 * 1000);
    const added = applyFamilyLogIngest(
      extraOpen,
      {
        jid: FAMILY,
        text: topics[i],
        fromName: "Sir",
        waMessageId: `cap-${i}`,
      },
      allowlist(),
      at
    );
    if (added.ok && added.stored) extraOpen = added.store;
  }

  let nudgesToday = 0;
  let cursor = extraOpen;
  for (let i = 0; i < FAMILY_LOG_NUDGE_MAX_PER_GROUP_PER_DAY + 3; i++) {
    const now = new Date(
      DAY.getTime() + i * (FAMILY_LOG_NUDGE_MIN_GAP_MS + 60_000)
    );
    const claimed = applyClaimDueFamilyLogNudges(cursor, allowlist(), {
      now,
      quietHours: false,
    });
    if (!claimed.claimed.length) break;
    const acked = applyAckFamilyLogNudge(
      claimed.store,
      { id: claimed.claimed[0].id, status: "sent" },
      now
    );
    if (!("store" in acked)) break;
    cursor = acked.store;
    nudgesToday += 1;
  }
  assert.equal(nudgesToday, FAMILY_LOG_NUDGE_MAX_PER_GROUP_PER_DAY);
});

test("quiet hours skip proactive nudges; format is FIL + EN like outing/leftover", () => {
  const midnightHkt = new Date("2026-11-16T16:30:00.000Z");
  assert.equal(isFamilyLogQuietHours(midnightHkt), true);
  assert.equal(isFamilyLogQuietHours(DAY), false);

  const saidAt = new Date(DAY.getTime() - FAMILY_LOG_NUDGE_MIN_AGE_MS - 60_000);
  const stored = request("Please buy milk tonight", { waMessageId: "quiet-1" }, saidAt);
  assert.equal(stored.ok && stored.stored, true);
  if (!stored.ok || !stored.stored) return;
  const quiet = applyClaimDueFamilyLogNudges(stored.store, allowlist(), {
    now: DAY,
    quietHours: true,
  });
  assert.equal(quiet.claimed.length, 0);

  const text = formatFollowUpNudge({
    who: "Mum",
    text: "Please buy milk tonight",
  });
  assert.match(text, /^Hi /);
  assert.match(text, /FIL:/);
  assert.match(text, /EN:/);
  assert.match(text, /Mum/);
  assert.equal(text.includes("? Tonight"), false);
});
