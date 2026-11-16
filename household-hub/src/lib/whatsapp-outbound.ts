export const OUTBOUND_KEY = "whatsapp_outbound";
export const OUTBOUND_TEXT_MAX = 4000;
export const OUTBOUND_MAX_MESSAGES = 200;
export const OUTBOUND_MAX_REPLIES = 200;
export const OUTBOUND_CLAIM_TIMEOUT_MS = 5 * 60 * 1000;
export const OUTBOUND_META_MAX = 120;
export const OUTBOUND_PURPOSE_MAX = 200;

export type WhatsAppOutboundStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed";

export type WhatsAppOutboundKind = "dm" | "group";

export interface WhatsAppOutboundMessage {
  id: string;
  clientMessageId?: string;
  to: string;
  jid: string;
  kind: WhatsAppOutboundKind;
  text: string;
  purpose?: string;
  conversationId: string;
  requestedBy?: string;
  status: WhatsAppOutboundStatus;
  error?: string;
  createdAt: string;
  claimedAt?: string;
  sentAt?: string;
  failedAt?: string;
  waMessageId?: string;
}

export interface WhatsAppOutboundReply {
  id: string;
  jid: string;
  conversationId: string;
  outboundMessageId?: string;
  text: string;
  fromName?: string;
  waMessageId?: string;
  createdAt: string;
}

export interface WhatsAppOutboundStore {
  messages: WhatsAppOutboundMessage[];
  replies: WhatsAppOutboundReply[];
  updatedAt: string;
}

export type NormalizeDestinationResult =
  | { ok: true; jid: string; kind: WhatsAppOutboundKind; e164?: string }
  | { ok: false; error: string };

export interface EnqueueInput {
  to?: unknown;
  text?: unknown;
  purpose?: unknown;
  conversationId?: unknown;
  requestedBy?: unknown;
  clientMessageId?: unknown;
  recipients?: unknown;
  toList?: unknown;
}

export type ApplyEnqueueResult =
  | {
      ok: true;
      store: WhatsAppOutboundStore;
      message: WhatsAppOutboundMessage;
      duplicate: boolean;
    }
  | {
      ok: false;
      store: WhatsAppOutboundStore;
      error: string;
    };

export function emptyOutboundStore(now = new Date()): WhatsAppOutboundStore {
  return { messages: [], replies: [], updatedAt: now.toISOString() };
}

export function normalizeOutboundStore(raw: unknown): WhatsAppOutboundStore {
  if (!raw || typeof raw !== "object") return emptyOutboundStore();
  const data = raw as Partial<WhatsAppOutboundStore>;
  return {
    messages: Array.isArray(data.messages)
      ? data.messages.filter(isOutboundMessage)
      : [],
    replies: Array.isArray(data.replies)
      ? data.replies.filter(isOutboundReply)
      : [],
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date().toISOString(),
  };
}

function isOutboundMessage(value: unknown): value is WhatsAppOutboundMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as WhatsAppOutboundMessage;
  return (
    typeof item.id === "string" &&
    typeof item.jid === "string" &&
    typeof item.text === "string" &&
    typeof item.status === "string" &&
    typeof item.createdAt === "string"
  );
}

function isOutboundReply(value: unknown): value is WhatsAppOutboundReply {
  if (!value || typeof value !== "object") return false;
  const item = value as WhatsAppOutboundReply;
  return (
    typeof item.id === "string" &&
    typeof item.jid === "string" &&
    typeof item.text === "string" &&
    typeof item.createdAt === "string"
  );
}

function clip(value: unknown, max: number): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  return text.slice(0, max);
}

function looksLikeMultiRecipient(raw: string): boolean {
  if (Array.isArray(raw)) return true;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/[;]/.test(trimmed)) return true;
  if (trimmed.includes(",")) {
    const parts = trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 1) return true;
  }
  if (/\s+/.test(trimmed) && /(?:\+\d|\d{8,})(?:\s+)(?:\+\d|\d{8,})/.test(trimmed)) {
    return true;
  }
  return false;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function destinationDigits(jidOrPhone: string): string {
  const user = jidOrPhone.split("@")[0]?.split(":")[0] || jidOrPhone;
  return digitsOnly(user);
}

function fromWaMe(raw: string): string | null {
  const trimmed = raw.trim();
  const waMe = trimmed.match(
    /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send)\/?\??(?:phone=)?(\+?\d[\d\s-]*)/i
  );
  if (waMe?.[1]) return waMe[1];
  const proto = trimmed.match(/^whatsapp:\+?(\d[\d\s-]*)$/i);
  if (proto?.[1]) return proto[1];
  return null;
}

/**
 * Normalize a single destination to a WhatsApp JID.
 * HK 8-digit locals become 852…; other numbers need a country code.
 * Group JIDs are accepted only when the input already ends with @g.us.
 */
export function normalizeDestination(raw: unknown): NormalizeDestinationResult {
  if (raw == null) return { ok: false, error: "to required" };
  if (Array.isArray(raw)) {
    return { ok: false, error: "one destination only — no broadcast" };
  }
  if (typeof raw !== "string" && typeof raw !== "number") {
    return { ok: false, error: "to must be a phone number or WhatsApp JID" };
  }
  const input = String(raw).trim();
  if (!input) return { ok: false, error: "to required" };
  if (looksLikeMultiRecipient(input)) {
    return { ok: false, error: "one destination only — no broadcast" };
  }
  const lower = input.toLowerCase();
  if (
    lower.includes("@broadcast") ||
    lower.includes("status@") ||
    lower.endsWith("@newsletter")
  ) {
    return { ok: false, error: "broadcast / status destinations are not allowed" };
  }

  const jidMatch = input.match(
    /^([0-9]+)(?::\d+)?@(g\.us|s\.whatsapp\.net|c\.us)$/i
  );
  if (jidMatch) {
    const user = jidMatch[1];
    const host = jidMatch[2].toLowerCase();
    if (host === "g.us") {
      if (!/^\d{8,24}$/.test(user)) {
        return { ok: false, error: "invalid group JID" };
      }
      return { ok: true, jid: `${user}@g.us`, kind: "group" };
    }
    if (!/^\d{8,15}$/.test(user)) {
      return { ok: false, error: "invalid WhatsApp user JID" };
    }
    return {
      ok: true,
      jid: `${user}@s.whatsapp.net`,
      kind: "dm",
      e164: user,
    };
  }

  if (/@/.test(input) && !jidMatch) {
    return {
      ok: false,
      error: "unsupported JID — use number@s.whatsapp.net or group@g.us",
    };
  }

  const fromLink = fromWaMe(input);
  const phoneSource = fromLink || input;
  let digits = digitsOnly(phoneSource);

  if (phoneSource.trim().startsWith("00")) {
    digits = digits.replace(/^00/, "");
  }

  if (!digits) return { ok: false, error: "to required" };
  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "destination must be a phone number or JID" };
  }

  // HK local 8-digit (2–9…) → 852
  if (/^[2-9]\d{7}$/.test(digits)) {
    digits = `852${digits}`;
  }

  if (digits.startsWith("852") && digits.length !== 11) {
    return {
      ok: false,
      error: "HK numbers should be 852 + 8 digits (or local 8-digit)",
    };
  }

  if (digits.length < 8 || digits.length > 15) {
    return {
      ok: false,
      error:
        "include a country code (e.g. 852… or +1…) or an 8-digit HK number",
    };
  }

  // 9–10 digits without 852: require an explicit country code
  if (digits.length <= 10 && !digits.startsWith("852")) {
    return {
      ok: false,
      error:
        "include a country code (e.g. +1 415… or 852…) or use number@s.whatsapp.net",
    };
  }

  return {
    ok: true,
    jid: `${digits}@s.whatsapp.net`,
    kind: "dm",
    e164: digits,
  };
}

export function normalizeOutboundText(raw: unknown): {
  ok: true;
  text: string;
} | { ok: false; error: string } {
  if (raw == null) return { ok: false, error: "text required" };
  const text = String(raw).trim();
  if (!text) return { ok: false, error: "text required" };
  return { ok: true, text: text.slice(0, OUTBOUND_TEXT_MAX) };
}

function newId(prefix: string, now: Date): string {
  return `${prefix}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function recycleStaleClaims(
  messages: WhatsAppOutboundMessage[],
  now = new Date(),
  timeoutMs = OUTBOUND_CLAIM_TIMEOUT_MS
): WhatsAppOutboundMessage[] {
  const cutoff = now.getTime() - timeoutMs;
  return messages.map((item) => {
    if (item.status !== "sending") return item;
    const claimed = item.claimedAt ? Date.parse(item.claimedAt) : NaN;
    if (!Number.isFinite(claimed) || claimed <= cutoff) {
      const { claimedAt: _claimedAt, ...rest } = item;
      return { ...rest, status: "pending" as const };
    }
    return item;
  });
}

export function pruneOutboundStore(
  store: WhatsAppOutboundStore,
  now = new Date()
): WhatsAppOutboundStore {
  const active: WhatsAppOutboundMessage[] = [];
  const done: WhatsAppOutboundMessage[] = [];
  for (const item of store.messages) {
    if (item.status === "pending" || item.status === "sending") active.push(item);
    else done.push(item);
  }
  done.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const keepDone = Math.max(0, OUTBOUND_MAX_MESSAGES - active.length);
  const messages = [...active, ...done.slice(0, keepDone)];
  const replies = [...store.replies]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, OUTBOUND_MAX_REPLIES);
  return { messages, replies, updatedAt: now.toISOString() };
}

export function applyEnqueue(
  store: WhatsAppOutboundStore,
  input: EnqueueInput,
  now = new Date()
): ApplyEnqueueResult {
  if (input.recipients != null || input.toList != null) {
    return { ok: false, store, error: "one destination only — no broadcast" };
  }
  const dest = normalizeDestination(input.to);
  if (!dest.ok) return { ok: false, store, error: dest.error };
  const body = normalizeOutboundText(input.text);
  if (!body.ok) return { ok: false, store, error: body.error };

  const clientMessageId = clip(input.clientMessageId, OUTBOUND_META_MAX);
  if (clientMessageId) {
    const existing = store.messages.find(
      (m) => m.clientMessageId === clientMessageId
    );
    if (existing) {
      return { ok: true, store, message: existing, duplicate: true };
    }
  }

  const purpose = clip(input.purpose, OUTBOUND_PURPOSE_MAX);
  const requestedBy = clip(input.requestedBy, OUTBOUND_META_MAX);
  const conversationId =
    clip(input.conversationId, OUTBOUND_META_MAX) || dest.jid;

  const message: WhatsAppOutboundMessage = {
    id: newId("out", now),
    to: String(input.to).trim(),
    jid: dest.jid,
    kind: dest.kind,
    text: body.text,
    conversationId,
    status: "pending",
    createdAt: now.toISOString(),
  };
  if (clientMessageId) message.clientMessageId = clientMessageId;
  if (purpose) message.purpose = purpose;
  if (requestedBy) message.requestedBy = requestedBy;

  const next = pruneOutboundStore(
    {
      ...store,
      messages: [message, ...store.messages],
    },
    now
  );
  return { ok: true, store: next, message, duplicate: false };
}

export function applyClaimPending(
  store: WhatsAppOutboundStore,
  opts: { limit?: number; now?: Date } = {}
): { store: WhatsAppOutboundStore; claimed: WhatsAppOutboundMessage[] } {
  const now = opts.now || new Date();
  const limit = Math.min(50, Math.max(1, opts.limit ?? 5));
  const recycled = recycleStaleClaims(store.messages, now);
  const claimed: WhatsAppOutboundMessage[] = [];
  const messages = recycled.map((item) => {
    if (item.status !== "pending" || claimed.length >= limit) return item;
    const next: WhatsAppOutboundMessage = {
      ...item,
      status: "sending",
      claimedAt: now.toISOString(),
    };
    claimed.push(next);
    return next;
  });
  return {
    store: { ...store, messages, updatedAt: now.toISOString() },
    claimed,
  };
}

export function listOutboundMessages(
  store: WhatsAppOutboundStore,
  filter: {
    status?: string | null;
    id?: string | null;
    conversationId?: string | null;
    jid?: string | null;
    limit?: number;
    now?: Date;
  } = {}
): WhatsAppOutboundMessage[] {
  const now = filter.now || new Date();
  let items = recycleStaleClaims(store.messages, now);
  if (filter.id) {
    items = items.filter((m) => m.id === filter.id);
  }
  if (filter.status && filter.status !== "all") {
    items = items.filter((m) => m.status === filter.status);
  }
  if (filter.conversationId) {
    items = items.filter((m) => m.conversationId === filter.conversationId);
  }
  if (filter.jid) {
    const digits = destinationDigits(filter.jid);
    items = items.filter(
      (m) => m.jid === filter.jid || destinationDigits(m.jid) === digits
    );
  }
  const limit = Math.min(50, Math.max(1, filter.limit ?? 10));
  return items.slice(0, limit);
}

export function applyAck(
  store: WhatsAppOutboundStore,
  input: {
    id?: unknown;
    status?: unknown;
    error?: unknown;
    waMessageId?: unknown;
    jid?: unknown;
  },
  now = new Date()
):
  | {
      store: WhatsAppOutboundStore;
      message: WhatsAppOutboundMessage;
      duplicate: boolean;
    }
  | { store: WhatsAppOutboundStore; error: string } {
  const id = clip(input.id, 80);
  if (!id) return { store, error: "id required" };
  const status = String(input.status || "").trim();
  if (status !== "sent" && status !== "failed") {
    return { store, error: "status must be sent or failed" };
  }
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx < 0) return { store, error: "message not found" };
  const current = store.messages[idx];

  if (current.status === status) {
    return { store, message: current, duplicate: true };
  }
  if (current.status === "sent") {
    return { store, message: current, duplicate: true };
  }

  const waMessageId = clip(input.waMessageId, 120);
  const jidUpdate = input.jid != null ? normalizeDestination(input.jid) : null;
  const next: WhatsAppOutboundMessage = { ...current, status };
  if (jidUpdate?.ok) next.jid = jidUpdate.jid;
  if (waMessageId) next.waMessageId = waMessageId;
  if (status === "sent") {
    next.sentAt = now.toISOString();
    delete next.error;
  } else {
    next.failedAt = now.toISOString();
    next.error = clip(input.error, 500) || "send failed";
  }

  const messages = store.messages.slice();
  messages[idx] = next;
  return {
    store: pruneOutboundStore({ ...store, messages }, now),
    message: next,
    duplicate: false,
  };
}

function findConversationMatch(
  store: WhatsAppOutboundStore,
  jid: string,
  conversationId?: string
): WhatsAppOutboundMessage | undefined {
  if (conversationId) {
    const byConv = store.messages.find((m) => m.conversationId === conversationId);
    if (byConv) return byConv;
  }
  const digits = destinationDigits(jid);
  return store.messages.find(
    (m) =>
      m.jid === jid ||
      destinationDigits(m.jid) === digits ||
      m.conversationId === jid
  );
}

export function applyRecordReply(
  store: WhatsAppOutboundStore,
  input: {
    jid?: unknown;
    text?: unknown;
    fromName?: unknown;
    conversationId?: unknown;
    waMessageId?: unknown;
  },
  now = new Date()
):
  | {
      store: WhatsAppOutboundStore;
      reply: WhatsAppOutboundReply;
      stored: true;
      duplicate: boolean;
    }
  | {
      store: WhatsAppOutboundStore;
      stored: false;
      reason: string;
      error?: string;
    } {
  const dest = normalizeDestination(input.jid);
  if (!dest.ok) {
    return { store, stored: false, reason: "invalid_jid", error: dest.error };
  }
  if (dest.kind === "group") {
    return { store, stored: false, reason: "group_ignored" };
  }
  const body = normalizeOutboundText(input.text);
  if (!body.ok) {
    return { store, stored: false, reason: "empty_text", error: body.error };
  }
  const conversationId = clip(input.conversationId, OUTBOUND_META_MAX);
  const match = findConversationMatch(store, dest.jid, conversationId);
  if (!match) {
    return { store, stored: false, reason: "unknown_conversation" };
  }

  const waMessageId = clip(input.waMessageId, 120);
  if (waMessageId) {
    const existing = store.replies.find((r) => r.waMessageId === waMessageId);
    if (existing) {
      return { store, reply: existing, stored: true, duplicate: true };
    }
  }

  const reply: WhatsAppOutboundReply = {
    id: newId("in", now),
    jid: dest.jid,
    conversationId: conversationId || match.conversationId,
    outboundMessageId: match.id,
    text: body.text,
    createdAt: now.toISOString(),
  };
  const fromName = clip(input.fromName, 80);
  if (fromName) reply.fromName = fromName;
  if (waMessageId) reply.waMessageId = waMessageId;

  const next = pruneOutboundStore(
    { ...store, replies: [reply, ...store.replies] },
    now
  );
  return { store: next, reply, stored: true, duplicate: false };
}

export function listOutboundReplies(
  store: WhatsAppOutboundStore,
  filter: {
    conversationId?: string | null;
    jid?: string | null;
    since?: string | null;
    limit?: number;
  } = {}
): WhatsAppOutboundReply[] {
  let items = store.replies;
  if (filter.conversationId) {
    items = items.filter((r) => r.conversationId === filter.conversationId);
  }
  if (filter.jid) {
    const dest = normalizeDestination(filter.jid);
    const digits = destinationDigits(filter.jid);
    items = items.filter((r) => {
      if (dest.ok && r.jid === dest.jid) return true;
      return destinationDigits(r.jid) === digits;
    });
  }
  if (filter.since) {
    const sinceTs = Date.parse(filter.since);
    if (Number.isFinite(sinceTs)) {
      items = items.filter((r) => Date.parse(r.createdAt) >= sinceTs);
    }
  }
  const limit = Math.min(100, Math.max(1, filter.limit ?? 50));
  return items.slice(0, limit);
}

export function publicOutboundMessage(message: WhatsAppOutboundMessage) {
  return {
    id: message.id,
    to: message.to,
    jid: message.jid,
    kind: message.kind,
    text: message.text,
    purpose: message.purpose,
    conversationId: message.conversationId,
    requestedBy: message.requestedBy,
    clientMessageId: message.clientMessageId,
    status: message.status,
    error: message.error,
    createdAt: message.createdAt,
    claimedAt: message.claimedAt,
    sentAt: message.sentAt,
    failedAt: message.failedAt,
    waMessageId: message.waMessageId,
  };
}

export function publicOutboundReply(reply: WhatsAppOutboundReply) {
  return {
    id: reply.id,
    jid: reply.jid,
    conversationId: reply.conversationId,
    outboundMessageId: reply.outboundMessageId,
    text: reply.text,
    fromName: reply.fromName,
    waMessageId: reply.waMessageId,
    createdAt: reply.createdAt,
  };
}
