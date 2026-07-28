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

/** Keep draft rows (empty / partial email) so Admin “+ Add user” can edit them. */
function normalizeUser(
  raw: Partial<AccessUser> & { email?: string },
  index: number
): AccessUser | null {
  const id =
    (raw.id && String(raw.id).trim()) ||
    `user-draft-${index}-${Math.random().toString(36).slice(2, 8)}`;
  const emailRaw = String(raw.email ?? "").trim();
  const email = cleanEmail(emailRaw);

  // Drop completely empty anonymous junk (no id from caller and no email)
  if (!raw.id && !emailRaw) return null;

  return {
    id,
    // Preserve in-progress typing; only normalize when it looks like an email
    email: email.includes("@") ? email : emailRaw,
    name: (raw.name || "").trim() || undefined,
    admin: Boolean(raw.admin),
    frontend: Boolean(raw.frontend),
    enabled: raw.enabled !== false,
  };
}

function isValidEmail(email: string): boolean {
  return Boolean(email && email.includes("@"));
}

/** Migrate legacy googleAllowlist → users; keep draft users while editing. */
export function normalizeAdminAuth(
  raw?: Partial<AdminAuthSettings> | null
): AdminAuthSettings {
  const fromUsers = Array.isArray(raw?.users)
    ? raw!.users
        .map((u, i) => normalizeUser(u || {}, i))
        .filter((u): u is AccessUser => Boolean(u))
    : [];

  // Key by id so multiple draft (empty-email) rows are not collapsed
  const byId = new Map<string, AccessUser>();
  for (const u of fromUsers) byId.set(u.id, u);

  const legacyEmails = Array.isArray(raw?.googleAllowlist)
    ? raw!.googleAllowlist.map(cleanEmail).filter(Boolean)
    : [];

  for (const email of legacyEmails) {
    if (!isValidEmail(email)) continue;
    const existing = [...byId.values()].find((u) => cleanEmail(u.email) === email);
    if (existing) {
      byId.set(existing.id, { ...existing, admin: true, enabled: true });
    } else {
      const id = `user-${email.replace(/[^a-z0-9]+/g, "-")}`;
      byId.set(id, {
        id,
        email,
        admin: true,
        frontend: false,
        enabled: true,
      });
    }
  }

  let users = [...byId.values()];
  if (!users.length) {
    users = DEFAULT_ADMIN_AUTH.users.map((u) => ({ ...u }));
  }

  // Ensure at least one enabled admin with a real email (for Google Admin)
  const hasAdminUser = users.some(
    (u) => u.admin && u.enabled && isValidEmail(u.email)
  );
  if (!hasAdminUser) {
    const already = users.find((u) => cleanEmail(u.email) === DEFAULT_ADMIN_EMAIL);
    if (already) {
      users = users.map((u) =>
        u.id === already.id
          ? { ...u, admin: true, enabled: true, email: DEFAULT_ADMIN_EMAIL }
          : u
      );
    } else {
      users = [
        {
          id: "user-ghostyuen",
          email: DEFAULT_ADMIN_EMAIL,
          name: "Sir",
          admin: true,
          frontend: true,
          enabled: true,
        },
        ...users,
      ];
    }
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
    googleAllowlist: users
      .filter((u) => u.admin && u.enabled && isValidEmail(u.email))
      .map((u) => cleanEmail(u.email)),
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
  return (
    settings.users.find(
      (u) => isValidEmail(u.email) && cleanEmail(u.email) === needle
    ) ?? null
  );
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
  const google = required && settings.frontendGoogleEnabled !== false;
  return { required, google };
}

/** Drop draft rows without a real email before persisting (optional cleanup). */
export function sanitizeAdminAuthForSave(
  settings: AdminAuthSettings
): AdminAuthSettings {
  const normalized = normalizeAdminAuth(settings);
  const users = normalized.users.filter((u) => isValidEmail(u.email));
  return normalizeAdminAuth({ ...normalized, users });
}
