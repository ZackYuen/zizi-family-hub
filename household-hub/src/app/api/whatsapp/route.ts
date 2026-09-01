import { NextResponse } from "next/server";
import { answerFamilyQuestion } from "@/lib/ask-agent";
import { parseSaveCommand, handleWhatsAppSave } from "@/lib/whatsapp-save";
import {
  addYoutubeDinnerRecipe,
  formatAddMealReply,
  parseAddCommand,
} from "@/lib/add-youtube-recipe";
import { handleWhatsAppMenu, parseMenuCommand } from "@/lib/wa-menu";
import { isWhatsAppBotPaused } from "@/lib/whatsapp-bot-pause";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type WhatsAppTextMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
};

function isConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_VERIFY_TOKEN
  );
}

function shouldReply(text: string): boolean {
  const trigger = (process.env.WHATSAPP_TRIGGER_PREFIX || "?").toLowerCase();
  const t = text.trim().toLowerCase();
  if (t.startsWith(trigger)) return true;
  if (t.startsWith("bot:") || t.startsWith("ask:") || t.startsWith("@bot")) return true;
  // If no trigger required
  if (process.env.WHATSAPP_REPLY_ALL === "1") return true;
  return false;
}

function stripTrigger(text: string): string {
  return text
    .replace(/^\s*[?？]\s*/u, "")
    .replace(/^\s*bot:\s*/i, "")
    .replace(/^\s*ask:\s*/i, "")
    .replace(/^\s*@bot\s*/i, "")
    .trim();
}

async function sendWhatsAppText(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: body.slice(0, 4000) },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send failed", err);
  }
}

/** Meta webhook verification */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verify = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && verify && token === verify && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

/** Incoming WhatsApp messages */
export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "WhatsApp not configured" },
      { status: 503 }
    );
  }

  const payload = await request.json();

  try {
    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const messages: WhatsAppTextMessage[] = value?.messages ?? [];
        for (const msg of messages) {
          if (msg.type !== "text" || !msg.text?.body) continue;
          if (await isWhatsAppBotPaused()) {
            console.log("[whatsapp] paused — skip reply");
            continue;
          }
          const raw = msg.text.body;
          if (!shouldReply(raw)) continue;
          const question = stripTrigger(raw);
          if (!question) {
            await sendWhatsAppText(
              msg.from,
              "Send ? then your question.\nExample: ? What time pick up Zizi?"
            );
            continue;
          }
          const menuCmd = parseMenuCommand(question);
          if (menuCmd) {
            const menu = await handleWhatsAppMenu(question, { jid: msg.from });
            await sendWhatsAppText(
              msg.from,
              `${menu.answer}\n\n_(Zizi Family Hub)_`
            );
            continue;
          }
          const addCmd = parseAddCommand(question);
          if (addCmd) {
            const added = await addYoutubeDinnerRecipe(addCmd.url);
            await sendWhatsAppText(
              msg.from,
              `${formatAddMealReply(added)}\n\n_(Zizi Family Hub)_`
            );
            continue;
          }
          const saveCmd = parseSaveCommand(question);
          if (saveCmd) {
            const saved = await handleWhatsAppSave(saveCmd.text, {
              jid: msg.from,
            });
            await sendWhatsAppText(
              msg.from,
              `${saved.answer}\n\n_(Zizi Family Hub)_`
            );
            continue;
          }
          const result = await answerFamilyQuestion(question);
          const answer = String(result.answer || "").trim();
          if (!answer) {
            console.log("[whatsapp] empty answer — skip reply");
            continue;
          }
          const footer = `\n\n_(Zizi Family Hub)_`;
          await sendWhatsAppText(msg.from, answer + footer);
        }
      }
    }
  } catch (err) {
    console.error("whatsapp webhook error", err);
  }

  // Always 200 so Meta does not retry forever
  return NextResponse.json({ ok: true });
}
