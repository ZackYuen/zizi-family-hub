import type { AccessUser, AdminAuthSettings, AppContent } from "./types";

export type AuthAudience = "admin" | "frontend";

const DEFAULT_ADMIN_EMAIL = "ghostyuen@gmail.com";

export const DEFAULT_ADMIN_AUTH: AdminAuthSettings = {
  passwordEnabled: true,
  googleEnabled: true,
  skipLogin: false,
  frontendLoginRequired: false,
  frontendGoogleEnabled: true,
  users: [
    {
      id: "user-ghostyuen",
      email: DEFAULT_ADMIN_EMAIL,
      name: "Sir",
      admin: true,
      frontend: true,
      enabled: true,
    },
  ],
};

function cleanEmail(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase();
}

function normalizeUser(
  raw: Partial<AccessUser> & { email?: string },
  index: number
): AccessUser | null {
  const email = cleanEmail(raw.email || "");
  if (!email || !email.includes("@")) return null;
  return {
    id: raw.id || `user-${email.replace(/[^a-z0-9]+/g, "-")}-${index}`,
    email,
    name: (raw.name || "").trim() || undefined,
    admin: Boolean(raw.admin),
    frontend: Boolean(raw.frontend),
    enabled: raw.enabled !== false,
  };
}

/** Migrate legacy googleAllowlist → users; fill frontend flags. */
export function normalizeAdminAuth(
  raw?: Partial<AdminAuthSettings> | null
): AdminAuthSettings {
  const fromUsers = Array.isArray(raw?.users)
    ? raw!.users
        .map((u, i) => normalizeUser(u || {}, i))
        .filter((u): u is AccessUser => Boolean(u))
    : [];

  const legacyEmails = Array.isArray(raw?.googleAllowlist)
    ? raw!.googleAllowlist.map(cleanEmail).filter(Boolean)
    : [];

  const byEmail = new Map<string, AccessUser>();
  for (const u of fromUsers) byEmail.set(u.email, u);

  for (const email of legacyEmails) {
    const existing = byEmail.get(email);
    if (existing) {
      byEmail.set(email, { ...existing, admin: true, enabled: true });
    } else {
      byEmail.set(email, {
        id: `user-${email.replace(/[^a-z0-9]+/g, "-")}`,
        email,
        admin: true,
        frontend: false,
        enabled: true,
      });
    }
  }

  let users = [...byEmail.values()];
  if (!users.length) {
    users = DEFAULT_ADMIN_AUTH.users.map((u) => ({ ...u }));
  }

  // Ensure at least one enabled admin Google user if Google admin is on
  const hasAdminUser = users.some((u) => u.admin && u.enabled);
  if (!hasAdminUser) {
    users = [
      {
        id: "user-ghostyuen",
        email: DEFAULT_ADMIN_EMAIL,
        name: "Sir",
        admin: true,
        frontend: true,
        enabled: true,
      },
      ...users.filter((u) => u.email !== DEFAULT_ADMIN_EMAIL),
    ];
  }

  return {
    passwordEnabled: raw?.passwordEnabled ?? DEFAULT_ADMIN_AUTH.passwordEnabled,
    googleEnabled: raw?.googleEnabled ?? DEFAULT_ADMIN_AUTH.googleEnabled,
    skipLogin: raw?.skipLogin ?? DEFAULT_ADMIN_AUTH.skipLogin,
    frontendLoginRequired:
      raw?.frontendLoginRequired ?? DEFAULT_ADMIN_AUTH.frontendLoginRequired,
    frontendGoogleEnabled:
      raw?.frontendGoogleEnabled ?? DEFAULT_ADMIN_AUTH.frontendGoogleEnabled,
    users,
    // Keep allowlist derived for any old callers / display
    googleAllowlist: users
      .filter((u) => u.admin && u.enabled)
      .map((u) => u.email),
  };
}

export function adminAuthFromContent(
  content?: Pick<AppContent, "adminAuth"> | null
): AdminAuthSettings {
  return normalizeAdminAuth(content?.adminAuth);
}

export function findAccessUser(
  email: string | null | undefined,
  settings: AdminAuthSettings
): AccessUser | null {
  if (!email) return null;
  const needle = cleanEmail(email);
  return settings.users.find((u) => u.email === needle) ?? null;
}

export function canAccessAudience(
  email: string | null | undefined,
  settings: AdminAuthSettings,
  audience: AuthAudience
): boolean {
  const user = findAccessUser(email, settings);
  if (!user || !user.enabled) return false;
  return audience === "admin" ? user.admin : user.frontend;
}

/** @deprecated use canAccessAudience(..., "admin") */
export function isEmailAllowlisted(
  email: string | null | undefined,
  settings: AdminAuthSettings
): boolean {
  return canAccessAudience(email, settings, "admin");
}

export function effectiveAuthMethods(settings: AdminAuthSettings): {
  password: boolean;
  google: boolean;
  skip: boolean;
} {
  const skip = Boolean(settings.skipLogin);
  const google = Boolean(settings.googleEnabled);
  let password = Boolean(settings.passwordEnabled);
  if (!password && !google && !skip) password = true;
  return { password, google, skip };
}

export function effectiveFrontendAuth(settings: AdminAuthSettings): {
  required: boolean;
  google: boolean;
} {
  const required = Boolean(settings.frontendLoginRequired);
  const google =
    required && settings.frontendGoogleEnabled !== false;
  return { required, google };
}
