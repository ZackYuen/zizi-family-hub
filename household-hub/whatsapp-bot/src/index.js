import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidGroup,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import { Boom } from "@hapi/boom";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** Load .env without requiring the dotenv package (helps when npm install is incomplete) */
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (err) {
    console.warn("[warn] Could not read .env:", err?.message || err);
  }
}

loadEnvFile(path.join(ROOT, ".env"));

/**
 * Session dir must stay writable by the pm2 user (ocuser).
 * Never use project ./auth_info — it often becomes root-owned after `sudo node`
 * and causes EACCES + MessageCounterError (creds can't be saved → key desync).
 * Docker may set AUTH_DIR=/app/auth_info with ALLOW_PROJECT_AUTH_DIR=1.
 */
function resolveAuthDir() {
  const homeDefault = path.join(os.homedir(), ".zizi-whatsapp-auth");
  const raw = (process.env.AUTH_DIR || "").trim();
  const projectAuth = path.resolve(ROOT, "auth_info");
  const allowProject = process.env.ALLOW_PROJECT_AUTH_DIR === "1";

  if (
    !raw ||
    raw === "auth_info" ||
    raw === "./auth_info" ||
    raw === ".\\auth_info"
  ) {
    if (raw) {
      console.warn(
        `[warn] Ignoring AUTH_DIR=${raw} — project ./auth_info is forbidden. Using ${homeDefault}`
      );
    }
    return homeDefault;
  }

  const resolved = path.isAbsolute(raw)
    ? path.resolve(raw)
    : path.resolve(ROOT, raw);

  if (resolved === projectAuth && !allowProject) {
    console.warn(
      `[warn] AUTH_DIR resolves to project auth_info (${resolved}). Forcing ${homeDefault}`
    );
    console.warn(
      "[warn] (Docker volume: set ALLOW_PROJECT_AUTH_DIR=1 if you really need /app/auth_info)"
    );
    return homeDefault;
  }
  return resolved;
}

const AUTH_DIR = resolveAuthDir();

const LIVE_ASK_URL = (
  process.env.LIVE_ASK_URL || "https://zizi-family-hub.vercel.app/api/ask/"
).replace(/\/?$/, "/");
const LIVE_INBOX_URL = (
  process.env.LIVE_INBOX_URL ||
  process.env.LIVE_ASK_URL?.replace(/\/api\/ask\/?$/, "/api/inbox/") ||
  "https://zizi-family-hub.vercel.app/api/inbox/"
).replace(/\/?$/, "/");
const LIVE_BOT_STATUS_URL = (
  process.env.LIVE_BOT_STATUS_URL ||
  process.env.LIVE_ASK_URL?.replace(/\/api\/ask\/?$/, "/api/bot-status/") ||
  "https://zizi-family-hub.vercel.app/api/bot-status/"
).replace(/\/?$/, "/");
const LIVE_OUTING_REMINDERS_URL = (
  process.env.LIVE_OUTING_REMINDERS_URL ||
  process.env.LIVE_ASK_URL?.replace(/\/api\/ask\/?$/, "/api/reminders/outing/") ||
  "https://zizi-family-hub.vercel.app/api/reminders/outing/"
).replace(/\/?$/, "/");
const LIVE_MEALS_ADD_URL = (
  process.env.LIVE_MEALS_ADD_URL ||
  process.env.LIVE_ASK_URL?.replace(/\/api\/ask\/?$/, "/api/meals/add/") ||
  "https://zizi-family-hub.vercel.app/api/meals/add/"
).replace(/\/?$/, "/");
const LIVE_MEALS_MENU_URL = (
  process.env.LIVE_MEALS_MENU_URL ||
  process.env.LIVE_ASK_URL?.replace(/\/api\/ask\/?$/, "/api/meals/menu/") ||
  "https://zizi-family-hub.vercel.app/api/meals/menu/"
).replace(/\/?$/, "/");
/** 0 = disable 1-hour Zizi outing pings */
const OUTING_REMINDERS_ENABLED = process.env.OUTING_REMINDERS !== "0";
const OUTING_REMINDER_MS = Math.max(
  30_000,
  Number(process.env.OUTING_REMINDER_POLL_MS || 60_000) || 60_000
);
const INBOX_SECRET = process.env.INBOX_SECRET || process.env.BOT_INBOX_SECRET || "";
const BOT_NAME = process.env.BOT_NAME || "CharleneBot";
/** Comma-separated family group JIDs. Required for group replies (empty = no groups). */
const GROUP_ALLOWLIST = (process.env.GROUP_JIDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
/** Escape hatch: listen in every group the number is in (old behaviour). Prefer GROUP_JIDS. */
const GROUP_ALLOW_ALL = process.env.GROUP_ALLOW_ALL === "1";
/** Also reply to DMs if 1 */
const REPLY_DM = process.env.REPLY_DM === "1";
const TRIGGER_PREFIX = (process.env.TRIGGER_PREFIX || "?").trim();
/** Local force-mute without Admin (1 = never reply) */
const LOCAL_PAUSED = process.env.WHATSAPP_BOT_PAUSED === "1";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/** Fail fast if session folder is not writable (common after `sudo node` / root-owned files). */
function ensureAuthDirWritable(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const probe = path.join(dir, `.write-test-${process.pid}`);
  try {
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
  } catch (err) {
    console.error("\n[fatal] Cannot write session folder:", dir);
    console.error("[fatal]", err?.message || err);
    console.error(`
Fix on the VM (run as the same user that starts pm2 — usually ocuser, NEVER sudo node):

  npm run pm2:up   # or: bash scripts/pm2-up.sh
  # if still broken:
  pm2 delete zizi-whatsapp-bot
  pkill -f 'whatsapp-bot/src/index.js' || true
  sudo rm -rf "${dir}" ./auth_info
  mkdir -p "${dir}" && chmod 700 "${dir}"
  sed -i '/^AUTH_DIR=/d' .env 2>/dev/null || true

Then: node src/index.js   → scan QR → Ctrl+C → npm run pm2:up
`);
    process.exit(1);
  }
  const creds = path.join(dir, "creds.json");
  if (fs.existsSync(creds)) {
    try {
      fs.accessSync(creds, fs.constants.W_OK);
    } catch {
      console.error("\n[fatal] Session creds.json is not writable (often owned by root).");
      console.error(`[fatal] Path: ${creds}`);
      console.error(`
Fix:

  pm2 delete zizi-whatsapp-bot
  pkill -f 'whatsapp-bot/src/index.js' || true
  sudo rm -rf "${dir}" ./auth_info
  mkdir -p "${dir}" && chmod 700 "${dir}"

Then rescan QR with: node src/index.js  (no sudo) → npm run pm2:up
`);
      process.exit(1);
    }
  }
  console.log(
    `[ok] Session folder writable: ${dir} (uid=${process.getuid?.() ?? "?"} gid=${process.getgid?.() ?? "?"} user=${os.userInfo().username})`
  );
}

/** One bot only — two instances cause MessageCounterError / logout. */
function acquireSingletonLock(dir) {
  const lockPath = path.join(dir, "bot.lock");
  let prevPid = 0;
  try {
    if (fs.existsSync(lockPath)) {
      prevPid = Number(fs.readFileSync(lockPath, "utf8").split("\n")[0]) || 0;
    }
  } catch {
    prevPid = 0;
  }

  if (prevPid > 0 && prevPid !== process.pid) {
    try {
      process.kill(prevPid, 0); // throws if not running
      console.error(`
[fatal] Another bot process is already running (pid ${prevPid}).
MessageCounterError / EACCES usually means TWO instances.

  pkill -f 'whatsapp-bot/src/index.js' || true
  pm2 delete zizi-whatsapp-bot
  npm run pm2:up
`);
      process.exit(1);
    } catch {
      /* stale lock — previous process dead */
    }
  }

  try {
    fs.writeFileSync(lockPath, `${process.pid}\n${new Date().toISOString()}\n`);
  } catch (err) {
    console.error("[fatal] Cannot write session lock:", lockPath, err?.message || err);
    process.exit(1);
  }

  const release = () => {
    try {
      if (fs.existsSync(lockPath)) {
        const cur = fs.readFileSync(lockPath, "utf8").split("\n")[0];
        if (cur === String(process.pid)) fs.unlinkSync(lockPath);
      }
    } catch {
      /* ignore */
    }
  };
  process.on("exit", release);
  process.on("SIGINT", () => {
    release();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    release();
    process.exit(0);
  });
}

ensureAuthDirWritable(AUTH_DIR);
acquireSingletonLock(AUTH_DIR);

process.on("unhandledRejection", (err) => {
  const msg = String(err?.message || err || "");
  console.error("[unhandledRejection]", msg);
  if (/EACCES/i.test(msg) && /creds\.json|auth_info|zizi-whatsapp-auth/i.test(msg)) {
    console.error(
      "[fatal] Session write denied — wipe session, remove project ./auth_info, use npm run pm2:up (never sudo)."
    );
    process.exit(1);
  }
});

async function askFamilyHub(question, extra = {}) {
  // Prefer trailing-slash URL; follow 308 manually if needed (some Node builds mishandle POST redirects)
  const { timeoutMs = 30000, ...bodyExtra } = extra;
  let url = LIVE_ASK_URL;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        allowInternet: true,
        fromWhatsApp: true,
        ...bodyExtra,
      }),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(`Ask API ${res.status} redirect without Location`);
      url = loc.startsWith("http")
        ? loc
        : new URL(loc, url).toString();
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ask API ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
  throw new Error("Ask API: too many redirects");
}

const SENT_LOG_PATH = path.join(AUTH_DIR, "outing-reminders-sent.json");
let outingTimer = null;
let outingTimeout = null;
let outingSock = null;

function loadSentOutingKeys() {
  try {
    const raw = fs.readFileSync(SENT_LOG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSentOutingKeys(map) {
  const cutoff = Date.now() - 4 * 24 * 60 * 60 * 1000;
  const pruned = {};
  for (const [key, ts] of Object.entries(map)) {
    const t = Date.parse(String(ts));
    if (!Number.isNaN(t) && t >= cutoff) pruned[key] = ts;
  }
  fs.mkdirSync(path.dirname(SENT_LOG_PATH), { recursive: true });
  fs.writeFileSync(SENT_LOG_PATH, JSON.stringify(pruned, null, 2));
}

let botStatusCache = { at: 0, paused: false, replyGroupJids: [] };

async function fetchBotStatus() {
  if (LOCAL_PAUSED) {
    return { paused: true, replyGroupJids: botStatusCache.replyGroupJids };
  }
  if (botStatusCache.at && Date.now() - botStatusCache.at < 20_000) {
    return botStatusCache;
  }
  try {
    const res = await fetch(LIVE_BOT_STATUS_URL, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return botStatusCache.at ? botStatusCache : { paused: false, replyGroupJids: [] };
    const data = await res.json();
    const replyGroupJids = Array.isArray(data?.replyGroupJids)
      ? data.replyGroupJids.map((s) => String(s).trim()).filter((s) => /@g\.us$/i.test(s))
      : [];
    botStatusCache = {
      at: Date.now(),
      paused: Boolean(data?.paused),
      replyGroupJids,
    };
    return botStatusCache;
  } catch (err) {
    logger.warn({ err }, "bot-status check failed — treating as not paused");
    return botStatusCache.at ? botStatusCache : { paused: false, replyGroupJids: [] };
  }
}

function replyAllowlist(adminReplyJids) {
  if (Array.isArray(adminReplyJids) && adminReplyJids.length) return adminReplyJids;
  return GROUP_ALLOWLIST;
}

async function checkOutingReminders(sock) {
  if (!OUTING_REMINDERS_ENABLED) return;
  if (!sock) return;

  let data;
  try {
    const res = await fetch(LIVE_OUTING_REMINDERS_URL, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "outing reminders fetch failed");
      return;
    }
    data = await res.json();
  } catch (err) {
    logger.warn({ err }, "outing reminders fetch error");
    return;
  }

  const adminJids = Array.isArray(data?.groupJids)
    ? data.groupJids.map((s) => String(s).trim()).filter((s) => /@g\.us$/i.test(s))
    : [];
  const due = Array.isArray(data?.due) ? data.due : [];
  if (due.length && !adminJids.length) {
    logger.warn(
      "outing reminder due but Admin reminder group is empty — set Settings → WhatsApp group for outing reminders (not the reply group)"
    );
    return;
  }
  const jids = adminJids;
  if (!jids.length) return;
  if (!due.length) return;

  const sent = loadSentOutingKeys();
  for (const item of due) {
    const key = `${item.dateKey || data.date}:${item.id}`;
    if (sent[key]) continue;
    const text = String(item.text || "").trim();
    if (!text) continue;
    try {
      for (const jid of jids) {
        await sock.sendMessage(jid, { text: text.slice(0, 4000) });
      }
      sent[key] = new Date().toISOString();
      saveSentOutingKeys(sent);
      console.log(`[remind] sent outing ${key} → ${jids.join(",")}`);
    } catch (err) {
      logger.warn({ err, key }, "outing reminder send failed");
    }
  }
}

function startOutingReminderLoop(sock) {
  outingSock = sock;
  if (!OUTING_REMINDERS_ENABLED) {
    console.log("[ok] Outing reminders off (OUTING_REMINDERS=0)");
    return;
  }
  if (outingTimer) return;
  const tick = () => {
    checkOutingReminders(outingSock).catch((err) =>
      logger.warn({ err }, "outing reminder tick failed")
    );
  };
  outingTimer = setInterval(tick, OUTING_REMINDER_MS);
  outingTimeout = setTimeout(tick, 8000);
  console.log(
    `[ok] Outing reminders: 1h before flagged tasks · poll ${OUTING_REMINDER_MS / 1000}s · group=Admin reminder field only · ${LIVE_OUTING_REMINDERS_URL}`
  );
}

function stopOutingReminderLoop() {
  if (outingTimer) clearInterval(outingTimer);
  if (outingTimeout) clearTimeout(outingTimeout);
  outingTimer = null;
  outingTimeout = null;
  outingSock = null;
}

async function postInbox(payload) {
  if (!INBOX_SECRET) {
    logger.debug("INBOX_SECRET not set — skip inbox log");
    return null;
  }
  try {
    const res = await fetch(LIVE_INBOX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-inbox-secret": INBOX_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(35000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      logger.warn({ status: res.status, t: t.slice(0, 120) }, "inbox post failed");
      return null;
    }
    return res.json();
  } catch (err) {
    logger.warn({ err }, "inbox post error");
    return null;
  }
}

function parseAddCommand(question) {
  const q = String(question || "").trim();
  const m = q.match(/^add(?:\s+meal|\s+recipe)?\s+([\s\S]+)$/i);
  if (!m) return null;
  const rest = m[1]
    .trim()
    .replace(/^["“«]+/, "")
    .replace(/["”»]+$/, "")
    .trim();
  const raw =
    rest.match(/https?:\/\/\S+/i)?.[0]?.replace(/[),.;]+$/g, "") ||
    rest.match(/(?:youtu\.be\/|youtube\.com\/|instagram\.com\/|instagr\.am\/)\S+/i)?.[0];
  if (!raw) return null;
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (!/youtu\.?be|youtube\.com|instagram\.com|instagr\.am/i.test(href)) return null;
  return { url: href };
}

async function postMealsAdd(url) {
  if (!INBOX_SECRET) return null;
  try {
    const res = await fetch(LIVE_MEALS_ADD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-inbox-secret": INBOX_SECRET,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(70000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      logger.warn({ status: res.status, t: t.slice(0, 200) }, "meals/add failed");
      return null;
    }
    return res.json();
  } catch (err) {
    logger.warn({ err }, "meals/add error");
    return null;
  }
}

function looksLikeMenuCommand(question) {
  return /^(today|tonight|tomorrow|bukas|menu)\b/i.test(String(question || "").trim());
}

async function postMealsMenu(question) {
  if (!INBOX_SECRET) return null;
  try {
    const res = await fetch(LIVE_MEALS_MENU_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-inbox-secret": INBOX_SECRET,
      },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(70000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      logger.warn({ status: res.status, t: t.slice(0, 200) }, "meals/menu failed");
      return null;
    }
    return res.json();
  } catch (err) {
    logger.warn({ err }, "meals/menu error");
    return null;
  }
}

function extractText(msg) {
  const m = msg.message;
  if (!m) return "";
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ""
  ).trim();
}

function mentionedBot(msg, sock) {
  const m = msg.message?.extendedTextMessage || msg.message;
  const context = m?.contextInfo || msg.message?.extendedTextMessage?.contextInfo;
  const mentioned = context?.mentionedJid || [];
  const botId = sock.user?.id;
  if (!botId) return false;
  const botLid = botId.split(":")[0];
  return mentioned.some((jid) => {
    const id = jid.split("@")[0].split(":")[0];
    return id === botLid || jid === botId;
  });
}

function stripTriggers(text, botName) {
  let t = text;
  // remove @mentions like @123456 or @Name
  t = t.replace(/@[\w.+-]+/g, " ");
  // remove bot name
  t = t.replace(new RegExp(botName, "ig"), " ");
  // remove ? / bot: / ask:
  t = t.replace(/^\s*[?？]\s*/u, "");
  t = t.replace(/^\s*(bot|ask)\s*:\s*/i, "");
  return t.replace(/\s+/g, " ").trim();
}

function shouldHandle(text, msg, sock) {
  if (!text) return false;
  const trimmed = text.trimStart();
  const lower = trimmed.toLowerCase();
  if (mentionedBot(msg, sock)) return true;
  // ASCII "?" and fullwidth "？" (common on CJK keyboards) both wake the bot
  if (TRIGGER_PREFIX === "?" || TRIGGER_PREFIX === "？") {
    if (trimmed.startsWith("?") || trimmed.startsWith("？")) return true;
  } else if (TRIGGER_PREFIX && lower.startsWith(TRIGGER_PREFIX.toLowerCase())) {
    return true;
  }
  if (lower.startsWith("bot:") || lower.startsWith("ask:")) return true;
  if (new RegExp(`\\b@?${BOT_NAME}\\b`, "i").test(text)) return true;
  return false;
}

function allowedChat(jid, adminReplyJids) {
  if (isJidGroup(jid)) {
    if (GROUP_ALLOW_ALL) return true;
    const list = replyAllowlist(adminReplyJids);
    if (!list.length) return false;
    return list.includes(jid);
  }
  return REPLY_DM;
}

/** Parse ?save … commands (after stripTriggers). Free-form save is LLM-digested on server. */
function parseSaveCommand(question) {
  // Legacy explicit forms (still work; server may still digest if digest:true)
  const mTip = question.match(/^save\s+tip\s+([\s\S]+)$/i);
  if (mTip) {
    return { digest: true, text: mTip[1].trim() };
  }
  const mNote = question.match(/^(note|remember)\s+([\s\S]+)$/i);
  if (mNote) {
    return { digest: true, text: mNote[2].trim() };
  }
  const mRecipe = question.match(/^save\s+recipe\s+([\s\S]+)$/i);
  if (mRecipe) {
    return { digest: true, text: mRecipe[1].trim() };
  }

  // Preferred: ?save … or ?save "…"
  const mSave = question.match(/^save\s+([\s\S]+)$/i);
  if (mSave) {
    let content = mSave[1].trim();
    content = content
      .replace(/^["“«]+/, "")
      .replace(/["”»]+$/, "")
      .trim();
    if (content) return { digest: true, text: content };
  }
  return null;
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
    // Text Q&A bot: skip history/app-state media sync (avoids noisy mmg.whatsapp.net 403s)
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    markOnlineOnConnect: false,
    getMessage: async () => undefined,
  });

  sock.ev.on("creds.update", async () => {
    try {
      await saveCreds();
    } catch (err) {
      console.error("[fatal] Failed to save auth_info (permission?).", err?.message || err);
      console.error("[fatal] Fix ownership of auth_info, wipe session, rescan QR. Do not use sudo.");
      process.exit(1);
    }
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qr)}`;
      console.log("\n=== Scan QR with WhatsApp → Linked devices ===\n");
      console.log("If the ASCII QR is hard to scan in Docker, OPEN THIS URL on your phone/PC:\n");
      console.log(qrUrl);
      console.log("\n(ASCII QR below — may look broken in docker logs)\n");
      qrcode.generate(qr, { small: true });
      console.log(`\nBot triggers: @${BOT_NAME}  or  ${TRIGGER_PREFIX} your question\n`);
    }
    if (connection === "open") {
      console.log(`[ok] Connected as ${sock.user?.id || "unknown"}`);
      console.log(`[ok] Asking live API: ${LIVE_ASK_URL}`);
      console.log(
        `[ok] Inbox: ${INBOX_SECRET ? LIVE_INBOX_URL : "disabled (set INBOX_SECRET)"}`
      );
      console.log(
        `[ok] Reply groups: Admin → Settings (bot-status replyGroupJids) or GROUP_JIDS=${GROUP_ALLOWLIST.join(",") || "(empty)"} · reminders: Admin reminder group only · DM=${REPLY_DM ? "on" : "off"}`
      );
      if (GROUP_ALLOW_ALL) {
        console.log("[ok] GROUP_ALLOW_ALL=1 — replies in every group (unsafe)");
      }
      console.log(
        "[ok] Retest from a DIFFERENT phone in the FAMILY GROUP (bot number must be a member)."
      );
      startOutingReminderLoop(sock);
    }
    if (connection === "close") {
      stopOutingReminderLoop();
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(`[warn] Connection closed (${statusCode}). Reconnecting: ${!loggedOut}`);
      if (!loggedOut) {
        startBot().catch((err) => {
          console.error("Restart failed", err);
          setTimeout(() => startBot(), 5000);
        });
      } else {
        console.error("[fatal] Logged out — delete auth_info and scan QR again.");
        process.exit(1);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // "notify" = live; some Baileys builds also deliver group traffic as "append"
    if (type !== "notify" && type !== "append") return;
    for (const msg of messages) {
      try {
        if (msg.key.fromMe) continue;
        const jid = msg.key.remoteJid;
        const text = extractText(msg);
        const preview = (text || "(non-text/media)").slice(0, 80);

        if (!jid) {
          console.log(`[msg] skip type=${type} no-jid: ${preview}`);
          continue;
        }
        const status = await fetchBotStatus();
        if (!allowedChat(jid, status.replyGroupJids)) {
          const list = replyAllowlist(status.replyGroupJids);
          const why = isJidGroup(jid)
            ? list.length
              ? "group not in reply-group allowlist"
              : "reply groups off (Admin → Settings reply group, or GROUP_JIDS)"
            : "DM ignored (set REPLY_DM=1 to allow)";
          console.log(`[msg] skip ${jid} (${why}): ${preview}`);
          continue;
        }
        if (!shouldHandle(text, msg, sock)) {
          console.log(
            `[msg] ignore ${jid} (need ?/？… or @${BOT_NAME}): ${preview}`
          );
          continue;
        }

        if (status.paused) {
          console.log(`[msg] paused — no reply ${jid}: ${preview}`);
          continue;
        }

        const question = stripTriggers(text, BOT_NAME);
        if (!question) {
          await sock.sendMessage(
            jid,
            {
              text: `Hi — mention me (@${BOT_NAME}) or start with ${TRIGGER_PREFIX}\nExample: ${TRIGGER_PREFIX} Tonight dinner?\nSet dinner: ${TRIGGER_PREFIX}today honey wings, cabbage\nTomorrow: ${TRIGGER_PREFIX}tomorrow https://youtube.com/watch?v=…\nAdd YouTube or Instagram: ${TRIGGER_PREFIX}add https://instagram.com/reel/…\nSave a note: ${TRIGGER_PREFIX}save Charlene likes less salt`,
            },
            { quoted: msg }
          );
          continue;
        }

        console.log(`[ask] ${jid}: ${question}`);
        await sock.sendPresenceUpdate("composing", jid);

        const menuCmd = looksLikeMenuCommand(question);
        if (menuCmd) {
          const menu = await postMealsMenu(question);
          if (menu?.answer) {
            await sock.sendMessage(
              jid,
              { text: String(menu.answer).slice(0, 4000) },
              { quoted: msg }
            );
            continue;
          }
          console.warn("[menu] meals/menu failed; trying Ask API");
        }

        const addCmd = parseAddCommand(question);
        if (addCmd) {
          const added = await postMealsAdd(addCmd.url);
          if (added?.answer) {
            await sock.sendMessage(
              jid,
              { text: String(added.answer).slice(0, 4000) },
              { quoted: msg }
            );
            continue;
          }
          console.warn("[add] meals/add failed; trying Ask API");
        }

        const saveCmd = parseSaveCommand(question);
        if (saveCmd) {
          const result = await postInbox({
            digest: true,
            text: saveCmd.text,
            jid,
          });
          if (result?.item || result?.ok) {
            const d = result?.digest;
            const kindLabel =
              d?.kind === "recipe_candidate"
                ? "recipe"
                : d?.kind === "tip_candidate"
                  ? "HK Life tip"
                  : "note";
            const reply = [
              `Saved → Admin → WA Inbox (${kindLabel})`,
              d?.summary ? `Digest: ${d.summary}` : null,
              d?.link ? `Link: ${d.link}` : null,
              "Promote there after you review.",
            ]
              .filter(Boolean)
              .join("\n");
            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
            continue;
          }
          // Inbox secret missing / failed — fall through to Ask API (handles save server-side)
          console.warn("[save] inbox post failed; trying Ask API save handler");
        }

        let answer;
        try {
          const result = await askFamilyHub(question, {
            jid,
            timeoutMs: addCmd || menuCmd ? 70000 : 30000,
          });
          if (result?.silence || result?.paused) {
            console.log(`[msg] paused (Ask silence) — no reply ${jid}`);
            continue;
          }
          answer = String(result.answer || "").trim();
          // Prefer silence over a filler like "No answer."
          if (!answer) {
            console.log(`[msg] empty answer — no reply ${jid}`);
            continue;
          }
          if (result.handled === "save" || result.handled === "add" || result.handled === "menu") {
            await sock.sendMessage(jid, { text: answer.slice(0, 4000) }, { quoted: msg });
            continue;
          }
          answer += "\n\n_(Zizi Family Hub)_";
          await postInbox({
            kind: "ask",
            text: question,
            answer: result.answer || "",
            jid,
          });
        } catch (err) {
          console.error("Ask failed", err);
          answer =
            "Sorry — family hub is unreachable right now. Please ask Sir or Mum, or try again later.";
        }

        await sock.sendMessage(jid, { text: answer.slice(0, 4000) }, { quoted: msg });
      } catch (err) {
        console.error("message handler error", err);
      }
    }
  });
}

console.log("Zizi Family WhatsApp bot (Baileys) starting…");
console.log("Keep this process running 24/7 (pm2 / Docker / always-on PC).");
startBot().catch((err) => {
  console.error(err);
  process.exit(1);
});
