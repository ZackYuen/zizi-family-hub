"use client";

import type { AdminAuthSettings, AppContent, Lang } from "@/lib/types";
import { normalizeAdminAuth } from "@/lib/admin-auth-settings";
import { adminT } from "@/lib/admin-i18n";

interface Props {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
}

export function AdminAuthSettingsPanel({ content, setContent, lang }: Props) {
  const auth = normalizeAdminAuth(content.adminAuth);

  const patch = (next: AdminAuthSettings) => {
    setContent({ ...content, adminAuth: normalizeAdminAuth(next) });
  };

  return (
    <div className="mt-6 space-y-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
      <div>
        <p className="text-sm font-bold text-teal-950">
          {adminT("authMethods", lang)}
        </p>
        <p className="mt-0.5 text-xs text-teal-900/80">
          {adminT("authMethodsHint", lang)}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-800">
        <input
          type="checkbox"
          checked={auth.passwordEnabled}
          onChange={(e) =>
            patch({ ...auth, passwordEnabled: e.target.checked })
          }
        />
        {adminT("enablePasswordLogin", lang)}
      </label>

      <label className="flex items-center gap-2 text-sm text-stone-800">
        <input
          type="checkbox"
          checked={auth.googleEnabled}
          onChange={(e) =>
            patch({ ...auth, googleEnabled: e.target.checked })
          }
        />
        {adminT("enableGoogleLogin", lang)}
      </label>

      <div>
        <label className="flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={auth.skipLogin}
            onChange={(e) => patch({ ...auth, skipLogin: e.target.checked })}
          />
          {adminT("enableSkipLogin", lang)}
        </label>
        {auth.skipLogin ? (
          <p className="mt-1 text-xs text-amber-800">
            {adminT("skipLoginWarn", lang)}
          </p>
        ) : null}
      </div>

      <label className="block text-xs font-medium text-stone-600">
        {adminT("googleAllowlist", lang)}
        <textarea
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 font-mono text-xs"
          rows={3}
          value={auth.googleAllowlist.join("\n")}
          onChange={(e) =>
            patch({
              ...auth,
              googleAllowlist: e.target.value
                .split(/[\n,;]+/)
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean),
            })
          }
        />
      </label>

      <p className="text-[11px] text-stone-500">
        {adminT("googleRedirectHint", lang)}
      </p>
    </div>
  );
}
