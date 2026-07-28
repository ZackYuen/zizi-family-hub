import type { AccessUser, AdminAuthSettings } from "./types";
import { findAccessUser } from "./admin-auth-settings";

/** Title-case email local-part: "maria.santos" → "Maria Santos" */
export function nameFromEmail(email: string | null | undefined): string {
  if (!email) return "";
  const local = email.split("@")[0] || "";
  return local
    .replace(/[._+-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Prefer Access user name → email local-part → fallback (usually content.helperName).
 */
export function resolveFrontendDisplayName(opts: {
  email?: string | null;
  settings?: AdminAuthSettings | null;
  user?: AccessUser | null;
  fallback: string;
}): string {
  const user =
    opts.user ??
    (opts.email && opts.settings
      ? findAccessUser(opts.email, opts.settings)
      : null);
  const named = user?.name?.trim();
  if (named) return named;
  const fromEmail = nameFromEmail(opts.email || user?.email);
  if (fromEmail) return fromEmail;
  return opts.fallback || "Friend";
}

/** Swap the household helper label for the logged-in member’s display name in UI text. */
export function personalizeHelperCopy(
  text: string,
  helperName: string,
  displayName: string
): string {
  if (!text || !helperName || !displayName || helperName === displayName) {
    return text;
  }
  return text.split(helperName).join(displayName);
}
