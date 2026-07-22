import { appendWhatsAppInboxItem } from "./data";
import { digestWhatsAppSave } from "./save-digest";
import type { DinnerRecipe } from "./types";

/** Parse save commands after the leading `?` / bot trigger is stripped. */
export function parseSaveCommand(question: string): { text: string } | null {
  const q = question.trim();
  if (!q) return null;

  const mTip = q.match(/^save\s+tip\s+([\s\S]+)$/i);
  if (mTip) return { text: mTip[1].trim() };

  const mNote = q.match(/^(note|remember)\s+([\s\S]+)$/i);
  if (mNote) return { text: mNote[2].trim() };

  const mRecipe = q.match(/^save\s+recipe\s+([\s\S]+)$/i);
  if (mRecipe) return { text: mRecipe[1].trim() };

  const mSave = q.match(/^save\s+([\s\S]+)$/i);
  if (mSave) {
    let content = mSave[1].trim();
    content = content
      .replace(/^["“«]+/, "")
      .replace(/["”»]+$/, "")
      .trim();
    if (content) return { text: content };
  }
  return null;
}

export function formatSaveReply(digest: {
  kind: string;
  summary: string;
  link?: string;
}): string {
  const kindLabel =
    digest.kind === "recipe_candidate"
      ? "recipe"
      : digest.kind === "tip_candidate"
        ? "HK Life tip"
        : "note";
  return [
    `Saved → Admin → WA Inbox (${kindLabel})`,
    digest.summary ? `Digest: ${digest.summary}` : null,
    digest.link ? `Link: ${digest.link}` : null,
    "Promote there after you review.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Digest free-form WhatsApp save text into Admin WA Inbox. */
export async function handleWhatsAppSave(
  text: string,
  meta?: {
    jid?: string;
    fromName?: string;
    link?: string;
    category?: DinnerRecipe["category"];
  }
) {
  const digested = await digestWhatsAppSave(text);
  const link = digested.link || meta?.link;
  const category = digested.category || meta?.category;
  const item = await appendWhatsAppInboxItem({
    kind: digested.kind,
    text: digested.text,
    answer: [
      digested.summary,
      digested.original !== digested.text
        ? `Original: ${digested.original}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    jid: meta?.jid,
    fromName: meta?.fromName,
    link,
    category,
  });
  const digest = { ...digested, link, category };
  return {
    item,
    digest,
    answer: formatSaveReply(digest),
  };
}
