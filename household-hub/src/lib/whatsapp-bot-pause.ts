import { getContent } from "./data";
import { parseWhatsAppGroupJids } from "./outing-reminders";

export async function getWhatsAppBotRuntime(): Promise<{
  paused: boolean;
  replyGroupJids: string[];
  reminderGroupJids: string[];
}> {
  const envPaused = process.env.WHATSAPP_BOT_PAUSED === "1";
  try {
    const content = await getContent();
    return {
      paused: envPaused || Boolean(content.whatsappBotPaused),
      replyGroupJids: parseWhatsAppGroupJids(content.whatsappReplyGroupJids),
      reminderGroupJids: parseWhatsAppGroupJids(
        content.whatsappReminderGroupJids
      ),
    };
  } catch {
    return {
      paused: envPaused,
      replyGroupJids: [],
      reminderGroupJids: [],
    };
  }
}

/**
 * WhatsApp bot mute switch (replies only — outing reminders still send).
 * Env WHATSAPP_BOT_PAUSED=1 forces pause; otherwise uses Admin → Settings flag.
 */
export async function isWhatsAppBotPaused(): Promise<boolean> {
  const runtime = await getWhatsAppBotRuntime();
  return runtime.paused;
}
