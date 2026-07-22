import "dotenv/config";
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
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const AUTH_DIR = process.env.AUTH_DIR || path.join(ROOT, "auth_info");

const LIVE_ASK_URL =
  process.env.LIVE_ASK_URL || "https://zizi-family-hub.vercel.app/api/ask";
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

fs.mkdirSync(AUTH_DIR, { recursive: true });

async function askFamilyHub(question) {
  const res = await fetch(LIVE_ASK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, allowInternet: true }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ask API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
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
  const lower = text.toLowerCase();
  if (mentionedBot(msg, sock)) return true;
  if (TRIGGER_PREFIX && lower.startsWith(TRIGGER_PREFIX.toLowerCase())) return true;
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
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("\n=== Scan this QR with WhatsApp (Linked Devices) ===\n");
      qrcode.generate(qr, { small: true });
      console.log(`\nBot name trigger: @${BOT_NAME} or prefix "${TRIGGER_PREFIX}"\n`);
    }
    if (connection === "open") {
      console.log(`[ok] Connected as ${sock.user?.id || "unknown"}`);
      console.log(`[ok] Asking live API: ${LIVE_ASK_URL}`);
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
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        if (msg.key.fromMe) continue;
        const jid = msg.key.remoteJid;
        if (!jid || !allowedChat(jid)) continue;

        const text = extractText(msg);
        if (!shouldHandle(text, msg, sock)) continue;

        const question = stripTriggers(text, BOT_NAME);
        if (!question) {
          await sock.sendMessage(
            jid,
            {
              text: `Hi — mention me (@${BOT_NAME}) or start with ${TRIGGER_PREFIX}\nExample: ${TRIGGER_PREFIX} Tonight dinner?`,
            },
            { quoted: msg }
          );
          continue;
        }

        console.log(`[ask] ${jid}: ${question}`);
        await sock.sendPresenceUpdate("composing", jid);

        let answer;
        try {
          const result = await askFamilyHub(question);
          answer = result.answer || "No answer.";
          // Do not print Admin lastUpdated as a date — it looks like "today" and confuses
          answer += "\n\n_(Zizi Family Hub)_";
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
