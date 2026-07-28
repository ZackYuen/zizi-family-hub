import type { AdminAuthSettings, AppContent } from "./types";

/** Default Admin login methods (Google allowlist starts with Sir’s Gmail). */
export const DEFAULT_ADMIN_AUTH: AdminAuthSettings = {
  passwordEnabled: true,
  googleEnabled: true,
  skipLogin: false,
  googleAllowlist: ["ghostyuen@gmail.com"],
};

export function normalizeAdminAuth(
  raw?: Partial<AdminAuthSettings> | null
): AdminAuthSettings {
  const allowlist = Array.isArray(raw?.googleAllowlist)
    ? raw!.googleAllowlist
        .map((e) => String(e || "").trim().toLowerCase())
        .filter(Boolean)
    : [...DEFAULT_ADMIN_AUTH.googleAllowlist];

  return {
    passwordEnabled: raw?.passwordEnabled ?? DEFAULT_ADMIN_AUTH.passwordEnabled,
    googleEnabled: raw?.googleEnabled ?? DEFAULT_ADMIN_AUTH.googleEnabled,
    skipLogin: raw?.skipLogin ?? DEFAULT_ADMIN_AUTH.skipLogin,
    googleAllowlist:
      allowlist.length > 0 ? allowlist : [...DEFAULT_ADMIN_AUTH.googleAllowlist],
  };
}

export function adminAuthFromContent(
  content?: Pick<AppContent, "adminAuth"> | null
): AdminAuthSettings {
  return normalizeAdminAuth(content?.adminAuth);
}

export function isEmailAllowlisted(
  email: string | null | undefined,
  settings: AdminAuthSettings
): boolean {
  if (!email) return false;
  const needle = email.trim().toLowerCase();
  return settings.googleAllowlist.some((e) => e === needle);
}

/** At least one way in — if everything is off, keep password as emergency. */
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
