import { getContent } from "./data";

/**
 * WhatsApp bot mute switch.
 * Env WHATSAPP_BOT_PAUSED=1 forces pause; otherwise uses Admin → Settings flag.
 */
export async function isWhatsAppBotPaused(): Promise<boolean> {
  if (process.env.WHATSAPP_BOT_PAUSED === "1") return true;
  try {
    const content = await getContent();
    return Boolean(content.whatsappBotPaused);
  } catch {
    return false;
  }
}
