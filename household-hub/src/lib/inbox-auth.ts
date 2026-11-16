/** Shared secret for bot → hub writes (inbox, meals, outbound queue). */
export function inboxAuthorized(request: Request): boolean {
  const secret = process.env.INBOX_SECRET || process.env.BOT_INBOX_SECRET;
  if (!secret) return false;
  const header = request.headers.get("x-inbox-secret");
  return Boolean(header && header === secret);
}
