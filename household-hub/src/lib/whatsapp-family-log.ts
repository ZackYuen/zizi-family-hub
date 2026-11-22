import { getHongKongDateKey, isHelperDayOff } from "./hk-holidays";
import { getHongKongTimeParts } from "./i18n";

export const FAMILY_LOG_KEY = "whatsapp_family_log";
export const FAMILY_LOG_TEXT_MAX = 1500;
export const FAMILY_LOG_MAX_MESSAGES = 200;
export const FAMILY_LOG_MAX_NUDGES = 200;
export const FAMILY_LOG_FROM_NAME_MAX = 80;
export const FAMILY_LOG_LIST_MAX = 100;
export const FAMILY_LOG_DIGEST_MAX = 20;
export const FAMILY_LOG_LOOKBACK_MS = 72 * 60 * 60 * 1000;
export const FAMILY_LOG_NUDGE_LOOKBACK_MS = 24 * 60 * 60 * 1000;
export const FAMILY_LOG_NUDGE_MIN_AGE_MS = 45 * 60 * 1000;
export const FAMILY_LOG_NUDGE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
export const FAMILY_LOG_NUDGE_MIN_GAP_MS = 30 * 60 * 1000;
export const FAMILY_LOG_NUDGE_MAX_PER_GROUP_PER_DAY = 4;
export const FAMILY_LOG_CLAIM_TIMEOUT_MS = 5 * 60 * 1000;
/** Quiet hours in Hong Kong local minutes-since-midnight: 23:00–08:00. */
export const FAMILY_LOG_QUIET_START_MINUTES = 23 * 60;
export const FAMILY_LOG_QUIET_END_MINUTES = 8 * 60;

/**
 * Proactive family-group follow-ups are sent by the always-on Baileys bot
 * (same path as outing/leftover reminders). They must not go through the
 * user-approved outbound 1:1 queue.
 */
export const FAMILY_LOG_USES_OUTBOUND_QUEUE = false;

export type FamilyLogNudgeStatus = "sending" | "sent" | "failed";

export interface FamilyLogMessage {
  id: string;
  jid: string;
  fromJid?: string;
  fromName?: string;
  text: string;
  waMessageId?: string;
  ts: string;
}

export interface FamilyLogNudge {
  id: string;
  itemKey: string;
  sourceMessageId: string;
  jid: string;
  text: string;
  status: FamilyLogNudgeStatus;
  createdAt: string;
  claimedAt?: string;
  sentAt?: string;
  failedAt?: string;
  error?: string;
}

export interface FamilyLogStore {
  messages: FamilyLogMessage[];
  nudges: FamilyLogNudge[];
  updatedAt: string;
}

export interface FamilyLogOpenItem {
  id: string;
  itemKey: string;
  jid: string;
  who?: string;
  text: string;
  saidAt: string;
  whyOpen: string;
}

export interface FamilyLogDigest {
  open: FamilyLogOpenItem[];
  lookbackHours: number;
  scanned: number;
  note: string;
}

export const FAMILY_LOG_DIGEST_NOTE =
  "Heuristic only. Auto family-group follow-ups stay off unless Admin enables them. Charlene 家務 may draft a short follow-up for approval. When the setting is on, the always-on bot may send a short FIL+EN follow-up in the allowlisted family group if an item still looks undone (rate-limited; skipped on day off and for previous-night dinner). New chats and one-off messages still need the user-approved outbound queue. Do not send unsolicited WhatsApp outside the allowlisted family/reminder group(s).";

/** Missing / false = off. Auto-nudges are opt-in only. */
export function familyLogNudgesSettingOn(
  enabled: boolean | undefined | null
): boolean {
  return enabled === true;
}

export type FamilyLogIngestInput = {
  jid?: unknown;
  text?: unknown;
  fromName?: unknown;
  fromJid?: unknown;
  waMessageId?: unknown;
  ts?: unknown;
  fromMe?: unknown;
};

export type FamilyLogIngestResult =
  | {
      ok: true;
      store: FamilyLogStore;
      stored: true;
      duplicate: boolean;
      message: FamilyLogMessage;
      autoReply: false;
      enqueued: false;
    }
  | {
      ok: true;
      store: FamilyLogStore;
      stored: false;
      reason:
        | "from_me"
        | "empty_text"
        | "not_group"
        | "group_not_allowlisted"
        | "no_allowlisted_groups"
        | "no_human_content";
      autoReply: false;
      enqueued: false;
    }
  | {
      ok: false;
      store: FamilyLogStore;
      error: string;
      autoReply: false;
      enqueued: false;
    };

function clip(value: unknown, max: number): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  return text.slice(0, max);
}

function newId(prefix: string, now: Date): string {
  return `${prefix}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Normalize a WhatsApp group JID. DMs / broadcasts / newsletters return null. */
export function normalizeFamilyGroupJid(raw: unknown): string | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return null;
  const input = String(raw).trim();
  if (!input) return null;
  const lower = input.toLowerCase();
  if (
    lower.includes("@broadcast") ||
    lower.includes("status@") ||
    lower.endsWith("@newsletter") ||
    lower.endsWith("@lid") ||
    lower.endsWith("@s.whatsapp.net") ||
    lower.endsWith("@c.us")
  ) {
    return null;
  }
  const match = input.match(/^([0-9]+)(?::\d+)?@g\.us$/i);
  if (!match) return null;
  const user = match[1];
  if (!/^\d{8,24}$/.test(user)) return null;
  return `${user}@g.us`;
}

export function parseGroupJidList(raw?: string | string[] | null): string[] {
  const parts: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) parts.push(String(item || ""));
  } else if (typeof raw === "string") {
    parts.push(...raw.split(/[\s,;]+/));
  } else if (raw != null) {
    parts.push(String(raw));
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const jid = normalizeFamilyGroupJid(part.trim());
    if (!jid || seen.has(jid)) continue;
    seen.add(jid);
    out.push(jid);
  }
  return out;
}

/** Hub allowlist: Admin groups from /api/bot-status plus optional Vercel GROUP_JIDS. */
export function familyLogAllowlistFromRuntime(runtime: {
  replyGroupJids?: string[] | null;
  reminderGroupJids?: string[] | null;
}): string[] {
  return familyLogAllowlist({
    replyGroupJids: runtime.replyGroupJids,
    reminderGroupJids: runtime.reminderGroupJids,
    fallbackGroupJids: process.env.GROUP_JIDS,
    groupAllowAll: false,
  });
}

/**
 * Allowlist = Admin reply groups ∪ Admin reminder groups ∪ GROUP_JIDS fallback.
 * GROUP_ALLOW_ALL is ignored — ingest and proactive sends never widen to every chat.
 */
export function familyLogAllowlist(input: {
  replyGroupJids?: string | string[] | null;
  reminderGroupJids?: string | string[] | null;
  fallbackGroupJids?: string | string[] | null;
  /** Ignored. Present so callers cannot accidentally widen scope. */
  groupAllowAll?: boolean;
}): string[] {
  void input.groupAllowAll;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const source of [
    input.replyGroupJids,
    input.reminderGroupJids,
    input.fallbackGroupJids,
  ]) {
    for (const jid of parseGroupJidList(source)) {
      if (seen.has(jid)) continue;
      seen.add(jid);
      out.push(jid);
    }
  }
  return out;
}

export function isAllowlistedFamilyGroup(
  jid: unknown,
  allowlist: string[]
): boolean {
  if (!Array.isArray(allowlist) || allowlist.length === 0) return false;
  const normalized = normalizeFamilyGroupJid(jid);
  if (!normalized) return false;
  return allowlist.includes(normalized);
}

export function emptyFamilyLogStore(now = new Date()): FamilyLogStore {
  return { messages: [], nudges: [], updatedAt: now.toISOString() };
}

function isFamilyLogMessage(value: unknown): value is FamilyLogMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as FamilyLogMessage;
  return (
    typeof item.id === "string" &&
    typeof item.jid === "string" &&
    typeof item.text === "string" &&
    typeof item.ts === "string"
  );
}

function isFamilyLogNudge(value: unknown): value is FamilyLogNudge {
  if (!value || typeof value !== "object") return false;
  const item = value as FamilyLogNudge;
  return (
    typeof item.id === "string" &&
    typeof item.jid === "string" &&
    typeof item.text === "string" &&
    typeof item.status === "string" &&
    typeof item.createdAt === "string"
  );
}

export function normalizeFamilyLogStore(raw: unknown): FamilyLogStore {
  if (!raw || typeof raw !== "object") return emptyFamilyLogStore();
  const data = raw as Partial<FamilyLogStore>;
  return {
    messages: Array.isArray(data.messages)
      ? data.messages.filter(isFamilyLogMessage)
      : [],
    nudges: Array.isArray(data.nudges) ? data.nudges.filter(isFamilyLogNudge) : [],
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date().toISOString(),
  };
}

export function pruneFamilyLogStore(
  store: FamilyLogStore,
  now = new Date()
): FamilyLogStore {
  const messages = [...store.messages]
    .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
    .slice(0, FAMILY_LOG_MAX_MESSAGES);
  const sending: FamilyLogNudge[] = [];
  const done: FamilyLogNudge[] = [];
  for (const item of store.nudges) {
    if (item.status === "sending") sending.push(item);
    else done.push(item);
  }
  done.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const keepDone = Math.max(0, FAMILY_LOG_MAX_NUDGES - sending.length);
  return {
    messages,
    nudges: [...sending, ...done.slice(0, keepDone)],
    updatedAt: now.toISOString(),
  };
}

export function hasHumanContent(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

export function isFamilyBotCommandText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^[?？]/.test(trimmed)) return true;
  if (/charlenebot/i.test(trimmed)) return true;
  if (/^\s*(bot|ask)\s*:/i.test(trimmed)) return true;
  return false;
}

const REQUEST_RE =
  /\b(please|pls|plz|can you|could you|don't forget|dont forget|remember to|need to|make sure|follow up|follow-up|pick up|bring |buy |check |call |ask mum|ask sir)\b|\bpaki(?:usap)?\b|huwag kalimutan|bilhin|kunin|dalhin|tingnan|gawin|alalahanin|記得|唔好唔記得|唔好忘記|幫我|要買|做咗未|買咗未|搞掂未|有冇/i;

const DONE_RE =
  /\b(done|already|bought|finished|fixed|completed|reimbursed|ok na|okay na|tapos na|sige na)\b|做咗|買咗|搞掂|得喇|得啦|唔使了|算啦|tapos na|ok na/i;

/** Past-tense / self-report of already spending own money — not a new purchase request. */
const SELF_PURCHASE_RE =
  /\bi\s+(?:just\s+)?(?:use[d]?|spent)\s+(?:my\s+)?(?:own\s+)?money\s+to\s+buy\b|\bi\s+(?:already\s+)?(?:just\s+)?bought\b/i;

const REIMBURSED_RE =
  /\b(reimbursed|i\s+gave\s+y(?:ou|u)\s+back|gave\s+you\s+back|already\s+paid\s+you|i\s+gave\s+u\s+back)\b/i;

/** Tonight dinner / reheat / fry-last-dish — chase the same night only, never the next morning. */
const SAME_NIGHT_DINNER_RE =
  /\b(tonight(?:['’]s)?\s+dinner|dinner\s+tonight|reheat|fry(?:\s+the)?\s+last\s+dish|last\s+dish|heat\s+up\s+(?:the\s+)?(?:dinner|leftovers?))\b|今晚(?:晚餐|飯|食)|加熱|翻熱|最後一碟/i;

const STANDALONE_ACK_RE =
  /^(?:ok(?:ay)?|done|sige(?:\s+na)?|ok(?:ay)?\s+na|tapos\s+na)(?:\s+(?:ma'?am|maam|sir|thanks|thank\s+you|ty|po))?[.!]*$/i;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "you",
  "can",
  "please",
  "pls",
  "this",
  "that",
  "have",
  "just",
  "from",
  "with",
  "will",
  "need",
  "make",
  "sure",
  "group",
  "follow",
  "kanina",
  "sana",
  "lang",
  "naman",
  "yung",
  "mga",
  "ang",
  "nga",
  "po",
]);

const CJK_STOP = new Set("的了嗎呢咗未有我你佢記得幫唔好在係是".split(""));

export function contentTokens(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];
  const seen = new Set<string>();
  const words = lower.match(/[a-z0-9]{3,}/g) || [];
  for (const word of words) {
    if (STOP_WORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  const cjk = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  for (const chunk of cjk) {
    if (seen.has(chunk)) continue;
    seen.add(chunk);
    out.push(chunk);
  }
  return out;
}

export function familyLogItemKey(jid: string, text: string): string {
  const tokens = contentTokens(text).slice(0, 8);
  if (tokens.length) return `${jid}::${tokens.join(" ")}`;
  return `${jid}::${text.toLowerCase().replace(/\s+/g, " ").slice(0, 40)}`;
}

function sharesTopic(request: string, later: string): boolean {
  const requestTokens = contentTokens(request);
  const laterTokens = new Set(contentTokens(later));
  if (requestTokens.some((token) => laterTokens.has(token))) return true;
  const requestChars = new Set(
    (request.match(/[\u4e00-\u9fff]/g) || []).filter((c) => !CJK_STOP.has(c))
  );
  if (!requestChars.size) return false;
  const laterChars = later.match(/[\u4e00-\u9fff]/g) || [];
  return laterChars.some((c) => requestChars.has(c));
}

export function looksLikeSelfPurchaseReport(text: string): boolean {
  return SELF_PURCHASE_RE.test(text);
}

export function looksLikeReimbursementAck(text: string): boolean {
  return REIMBURSED_RE.test(text);
}

export function looksLikeStandaloneAck(text: string): boolean {
  const trimmed = text.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
  return STANDALONE_ACK_RE.test(trimmed);
}

export function isSameNightDinnerFollowUp(text: string): boolean {
  return SAME_NIGHT_DINNER_RE.test(text);
}

/** True when a tonight-dinner / reheat / last-dish request was said on a previous HK date. */
export function isPreviousNightDinnerFollowUp(
  text: string,
  saidAt: string | Date,
  now = new Date()
): boolean {
  if (!isSameNightDinnerFollowUp(text)) return false;
  const said = typeof saidAt === "string" ? new Date(saidAt) : saidAt;
  if (!Number.isFinite(said.getTime())) return false;
  return getHongKongDateKey(said) !== getHongKongDateKey(now);
}

export function looksLikeOpenFollowUp(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 4) return false;
  if (isFamilyBotCommandText(trimmed)) return false;
  if (!hasHumanContent(trimmed)) return false;
  if (looksLikeSelfPurchaseReport(trimmed)) return false;
  if (looksLikeStandaloneAck(trimmed)) return false;
  if (looksLikeReimbursementAck(trimmed)) return false;
  return REQUEST_RE.test(trimmed);
}

export function looksLikeDoneAck(text: string): boolean {
  return (
    DONE_RE.test(text) ||
    looksLikeStandaloneAck(text) ||
    looksLikeReimbursementAck(text)
  );
}

function ackClosesRequest(
  request: string,
  later: { text: string; ts: string }[],
  ack: { text: string; ts: string }
): boolean {
  if (looksLikeReimbursementAck(ack.text) && looksLikeSelfPurchaseReport(request)) {
    return true;
  }
  if (looksLikeStandaloneAck(ack.text)) {
    const inBetween = later.filter(
      (other) =>
        Date.parse(other.ts) < Date.parse(ack.ts) &&
        looksLikeOpenFollowUp(other.text)
    );
    return inBetween.length === 0;
  }
  if (!looksLikeDoneAck(ack.text)) return false;
  return sharesTopic(request, ack.text);
}

const NO_SEND = { autoReply: false as const, enqueued: false as const };

export function applyFamilyLogIngest(
  store: FamilyLogStore,
  input: FamilyLogIngestInput,
  allowlist: string[],
  now = new Date()
): FamilyLogIngestResult {
  if (input.fromMe === true || input.fromMe === "true" || input.fromMe === 1) {
    return { ok: true, store, stored: false, reason: "from_me", ...NO_SEND };
  }

  const text = clip(input.text, FAMILY_LOG_TEXT_MAX);
  if (!text) {
    return { ok: false, store, error: "text required", ...NO_SEND };
  }
  if (!hasHumanContent(text)) {
    return { ok: true, store, stored: false, reason: "no_human_content", ...NO_SEND };
  }

  const jid = normalizeFamilyGroupJid(input.jid);
  if (!jid) {
    return { ok: true, store, stored: false, reason: "not_group", ...NO_SEND };
  }
  if (!allowlist.length) {
    return {
      ok: true,
      store,
      stored: false,
      reason: "no_allowlisted_groups",
      ...NO_SEND,
    };
  }
  if (!isAllowlistedFamilyGroup(jid, allowlist)) {
    return {
      ok: true,
      store,
      stored: false,
      reason: "group_not_allowlisted",
      ...NO_SEND,
    };
  }

  const waMessageId = clip(input.waMessageId, 120);
  if (waMessageId) {
    const existing = store.messages.find((m) => m.waMessageId === waMessageId);
    if (existing) {
      return {
        ok: true,
        store,
        stored: true,
        duplicate: true,
        message: existing,
        ...NO_SEND,
      };
    }
  }

  const ts = clip(input.ts, 40);
  const parsedTs = ts ? Date.parse(ts) : NaN;
  const message: FamilyLogMessage = {
    id: newId("fam", now),
    jid,
    text,
    ts: Number.isFinite(parsedTs) ? new Date(parsedTs).toISOString() : now.toISOString(),
  };
  const fromName = clip(input.fromName, FAMILY_LOG_FROM_NAME_MAX);
  const fromJid = clip(input.fromJid, 80);
  if (fromName) message.fromName = fromName;
  if (fromJid) message.fromJid = fromJid;
  if (waMessageId) message.waMessageId = waMessageId;

  const next = pruneFamilyLogStore(
    { ...store, messages: [message, ...store.messages] },
    now
  );
  return {
    ok: true,
    store: next,
    stored: true,
    duplicate: false,
    message,
    ...NO_SEND,
  };
}

function inAllowlist(jid: string, allowlist: string[]): boolean {
  return isAllowlistedFamilyGroup(jid, allowlist);
}

export function listFamilyLogMessages(
  store: FamilyLogStore,
  filter: {
    allowlist: string[];
    jid?: string | null;
    since?: string | null;
    limit?: number;
  }
): FamilyLogMessage[] {
  let items = store.messages.filter((m) => inAllowlist(m.jid, filter.allowlist));
  if (filter.jid) {
    if (!isAllowlistedFamilyGroup(filter.jid, filter.allowlist)) return [];
    const jid = normalizeFamilyGroupJid(filter.jid);
    items = items.filter((m) => m.jid === jid);
  }
  if (filter.since) {
    const sinceTs = Date.parse(filter.since);
    if (Number.isFinite(sinceTs)) {
      items = items.filter((m) => Date.parse(m.ts) >= sinceTs);
    }
  }
  items = [...items].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
  const limit = Math.min(
    FAMILY_LOG_LIST_MAX,
    Math.max(1, filter.limit ?? 50)
  );
  return items.slice(0, limit);
}

export function buildFamilyLogDigest(
  store: FamilyLogStore,
  opts: {
    allowlist: string[];
    now?: Date;
    lookbackMs?: number;
    limit?: number;
  }
): FamilyLogDigest {
  const now = opts.now || new Date();
  const lookbackMs = Math.min(
    7 * 24 * 60 * 60 * 1000,
    Math.max(60 * 60 * 1000, opts.lookbackMs ?? FAMILY_LOG_LOOKBACK_MS)
  );
  const cutoff = now.getTime() - lookbackMs;
  const messages = [...store.messages]
    .filter((m) => inAllowlist(m.jid, opts.allowlist))
    .filter((m) => Date.parse(m.ts) >= cutoff)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));

  const open: FamilyLogOpenItem[] = [];
  for (const message of messages) {
    if (!looksLikeOpenFollowUp(message.text)) continue;
    if (isPreviousNightDinnerFollowUp(message.text, message.ts, now)) continue;
    const later = messages.filter(
      (other) =>
        other.jid === message.jid && Date.parse(other.ts) > Date.parse(message.ts)
    );
    const closed = later.some((other) =>
      ackClosesRequest(message.text, later, other)
    );
    if (closed) continue;
    open.push({
      id: message.id,
      itemKey: familyLogItemKey(message.jid, message.text),
      jid: message.jid,
      who: message.fromName,
      text: message.text,
      saidAt: message.ts,
      whyOpen: "looks like a request; no later done/ack on the same topic",
    });
  }

  const limit = Math.min(FAMILY_LOG_DIGEST_MAX, Math.max(1, opts.limit ?? 20));
  return {
    open: open.slice(-limit).reverse(),
    lookbackHours: Math.round(lookbackMs / (60 * 60 * 1000)),
    scanned: messages.length,
    note: FAMILY_LOG_DIGEST_NOTE,
  };
}

export function isFamilyLogQuietHours(
  now = new Date()
): boolean {
  const { minutesSinceMidnight } = getHongKongTimeParts(now);
  return (
    minutesSinceMidnight >= FAMILY_LOG_QUIET_START_MINUTES ||
    minutesSinceMidnight < FAMILY_LOG_QUIET_END_MINUTES
  );
}

export function formatFollowUpNudge(item: {
  who?: string;
  text: string;
}): string {
  const who = item.who?.trim() ? ` (${item.who.trim().slice(0, 40)})` : "";
  const quoted = item.text.replace(/\s+/g, " ").trim().slice(0, 180);
  return [
    "Hi 😊",
    "",
    `FIL: Kanina sa group${who}: “${quoted}”. Nagawa na ba, o kailangan pa follow-up?`,
    `EN: Earlier in the group${who}: “${quoted}”. Done, or still needs a follow-up?`,
  ].join("\n");
}

export function recycleStaleFamilyLogClaims(
  nudges: FamilyLogNudge[],
  now = new Date(),
  timeoutMs = FAMILY_LOG_CLAIM_TIMEOUT_MS
): FamilyLogNudge[] {
  const cutoff = now.getTime() - timeoutMs;
  return nudges.filter((item) => {
    if (item.status !== "sending") return true;
    const claimed = item.claimedAt ? Date.parse(item.claimedAt) : NaN;
    if (!Number.isFinite(claimed) || claimed <= cutoff) return false;
    return true;
  });
}

function sentOrSendingOnDay(
  nudges: FamilyLogNudge[],
  jid: string,
  dateKey: string
): FamilyLogNudge[] {
  return nudges.filter((n) => {
    if (n.jid !== jid) return false;
    if (n.status === "failed") return false;
    const ts = n.sentAt || n.claimedAt || n.createdAt;
    return getHongKongDateKey(new Date(ts)) === dateKey;
  });
}

function lastNudgeAt(nudges: FamilyLogNudge[], jid: string): number {
  let latest = 0;
  for (const n of nudges) {
    if (n.jid !== jid) continue;
    if (n.status === "failed") continue;
    const ts = Date.parse(n.sentAt || n.claimedAt || n.createdAt);
    if (Number.isFinite(ts) && ts > latest) latest = ts;
  }
  return latest;
}

function recentlyNudged(
  nudges: FamilyLogNudge[],
  itemKey: string,
  now: Date
): boolean {
  const cutoff = now.getTime() - FAMILY_LOG_NUDGE_COOLDOWN_MS;
  return nudges.some((n) => {
    if (n.itemKey !== itemKey) return false;
    if (n.status === "failed") return false;
    const ts = Date.parse(n.sentAt || n.claimedAt || n.createdAt);
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

export function applyClaimDueFamilyLogNudges(
  store: FamilyLogStore,
  allowlist: string[],
  opts: {
    now?: Date;
    limit?: number;
    quietHours?: boolean;
    /** Opt-in. Missing / false = do not claim or send. */
    enabled?: boolean;
    /** Sunday / HK public holiday (Charlene day off). Missing = isHelperDayOff(now). */
    dayOff?: boolean;
  } = {}
): { store: FamilyLogStore; claimed: FamilyLogNudge[] } {
  const now = opts.now || new Date();
  const limit = Math.min(5, Math.max(1, opts.limit ?? 1));
  const quiet =
    opts.quietHours ?? isFamilyLogQuietHours(now);
  const enabled = familyLogNudgesSettingOn(opts.enabled);
  const dayOff = opts.dayOff ?? isHelperDayOff(now);
  const recycled = recycleStaleFamilyLogClaims(store.nudges, now);

  if (!allowlist.length || quiet || !enabled || dayOff) {
    return {
      store: { ...store, nudges: recycled, updatedAt: now.toISOString() },
      claimed: [],
    };
  }

  const digest = buildFamilyLogDigest(store, {
    allowlist,
    now,
    lookbackMs: FAMILY_LOG_NUDGE_LOOKBACK_MS,
    limit: FAMILY_LOG_DIGEST_MAX,
  });
  const minAgeCutoff = now.getTime() - FAMILY_LOG_NUDGE_MIN_AGE_MS;
  const dateKey = getHongKongDateKey(now);
  const claimed: FamilyLogNudge[] = [];
  const nextNudges = [...recycled];

  const oldestFirst = [...digest.open].sort(
    (a, b) => Date.parse(a.saidAt) - Date.parse(b.saidAt)
  );

  for (const item of oldestFirst) {
    if (claimed.length >= limit) break;
    if (!isAllowlistedFamilyGroup(item.jid, allowlist)) continue;
    if (Date.parse(item.saidAt) > minAgeCutoff) continue;
    if (isPreviousNightDinnerFollowUp(item.text, item.saidAt, now)) continue;
    if (recentlyNudged(nextNudges, item.itemKey, now)) continue;
    const dayCount = sentOrSendingOnDay(nextNudges, item.jid, dateKey).length;
    if (dayCount >= FAMILY_LOG_NUDGE_MAX_PER_GROUP_PER_DAY) continue;
    const lastAt = lastNudgeAt(nextNudges, item.jid);
    if (lastAt && now.getTime() - lastAt < FAMILY_LOG_NUDGE_MIN_GAP_MS) continue;

    const nudge: FamilyLogNudge = {
      id: newId("nudge", now),
      itemKey: item.itemKey,
      sourceMessageId: item.id,
      jid: item.jid,
      text: formatFollowUpNudge({ who: item.who, text: item.text }),
      status: "sending",
      createdAt: now.toISOString(),
      claimedAt: now.toISOString(),
    };
    claimed.push(nudge);
    nextNudges.unshift(nudge);
  }

  return {
    store: pruneFamilyLogStore(
      { ...store, nudges: nextNudges },
      now
    ),
    claimed,
  };
}

export function applyAckFamilyLogNudge(
  store: FamilyLogStore,
  input: {
    id?: unknown;
    status?: unknown;
    error?: unknown;
    jid?: unknown;
  },
  now = new Date()
):
  | { store: FamilyLogStore; nudge: FamilyLogNudge; duplicate: boolean }
  | { store: FamilyLogStore; error: string } {
  const id = clip(input.id, 80);
  if (!id) return { store, error: "id required" };
  const status = String(input.status || "").trim();
  if (status !== "sent" && status !== "failed") {
    return { store, error: "status must be sent or failed" };
  }
  const idx = store.nudges.findIndex((n) => n.id === id);
  if (idx < 0) return { store, error: "nudge not found" };
  const current = store.nudges[idx];
  if (current.status === status) {
    return { store, nudge: current, duplicate: true };
  }
  if (current.status === "sent") {
    return { store, nudge: current, duplicate: true };
  }

  const next: FamilyLogNudge = { ...current, status };
  const jid = normalizeFamilyGroupJid(input.jid);
  if (jid) next.jid = jid;
  if (status === "sent") {
    next.sentAt = now.toISOString();
    delete next.error;
  } else {
    next.failedAt = now.toISOString();
    next.error = clip(input.error, 500) || "send failed";
  }
  const nudges = store.nudges.slice();
  nudges[idx] = next;
  return {
    store: pruneFamilyLogStore({ ...store, nudges }, now),
    nudge: next,
    duplicate: false,
  };
}

export function publicFamilyLogMessage(message: FamilyLogMessage) {
  return {
    id: message.id,
    jid: message.jid,
    fromJid: message.fromJid,
    fromName: message.fromName,
    text: message.text,
    waMessageId: message.waMessageId,
    ts: message.ts,
  };
}

export function publicFamilyLogNudge(nudge: FamilyLogNudge) {
  return {
    id: nudge.id,
    itemKey: nudge.itemKey,
    sourceMessageId: nudge.sourceMessageId,
    jid: nudge.jid,
    text: nudge.text,
    status: nudge.status,
    createdAt: nudge.createdAt,
    claimedAt: nudge.claimedAt,
    sentAt: nudge.sentAt,
    failedAt: nudge.failedAt,
    error: nudge.error,
  };
}

export function publicFamilyLogOpenItem(item: FamilyLogOpenItem) {
  return {
    id: item.id,
    itemKey: item.itemKey,
    jid: item.jid,
    who: item.who,
    text: item.text,
    saidAt: item.saidAt,
    whyOpen: item.whyOpen,
  };
}
