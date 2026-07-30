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
 * Use for greetings / visit logs only — not for schedule or task text (those stay Charlene).
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

/**
 * @deprecated Prefer keeping helperName in schedule/task copy.
 * Login display name is for greetings only.
 */
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
