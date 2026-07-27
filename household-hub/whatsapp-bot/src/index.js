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
const INBOX_SECRET = process.env.INBOX_SECRET || process.env.BOT_INBOX_SECRET || "";
const BOT_NAME = process.env.BOT_NAME || "CharleneBot";
/** Comma-separated group JIDs to listen to; empty = all groups */
const GROUP_ALLOWLIST = (process.env.GROUP_JIDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
/** Also reply to DMs if 1 */
const REPLY_DM = process.env.REPLY_DM === "1";
const TRIGGER_PREFIX = (process.env.TRIGGER_PREFIX || "?").trim();

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
  let url = LIVE_ASK_URL;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, allowInternet: true, ...extra }),
      signal: AbortSignal.timeout(30000),
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

function allowedChat(jid) {
  if (isJidGroup(jid)) {
    if (!GROUP_ALLOWLIST.length) return true;
    return GROUP_ALLOWLIST.includes(jid);
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
        `[ok] Listen: groups${GROUP_ALLOWLIST.length ? ` allowlist=${GROUP_ALLOWLIST.join(",")}` : " (all)"} · DM=${REPLY_DM ? "on" : "off"} · trigger=${TRIGGER_PREFIX} / @${BOT_NAME}`
      );
      console.log(
        "[ok] Retest from a DIFFERENT phone in the FAMILY GROUP (bot number must be a member)."
      );
    }
    if (connection === "close") {
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
        if (!allowedChat(jid)) {
          const why = isJidGroup(jid)
            ? "group not in GROUP_JIDS allowlist"
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

        const question = stripTriggers(text, BOT_NAME);
        if (!question) {
          await sock.sendMessage(
            jid,
            {
              text: `Hi — mention me (@${BOT_NAME}) or start with ${TRIGGER_PREFIX}\nExample: ${TRIGGER_PREFIX} Tonight dinner?\nSave anything: ${TRIGGER_PREFIX}save Charlene likes less salt\nOr: ${TRIGGER_PREFIX}save "https://youtube.com/… crispy dumplings"`,
            },
            { quoted: msg }
          );
          continue;
        }

        console.log(`[ask] ${jid}: ${question}`);
        await sock.sendPresenceUpdate("composing", jid);

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
          const result = await askFamilyHub(question, { jid });
          answer = result.answer || "No answer.";
          if (result.handled === "save") {
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
