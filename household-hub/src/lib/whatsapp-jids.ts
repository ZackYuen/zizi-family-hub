/** Parse Admin WhatsApp group JID field(s): comma / whitespace / semicolon separated. */

export function parseWhatsAppGroupJids(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /@g\.us$/i.test(s));
}
