"use client";

import type { AccessUser, AdminAuthSettings, AppContent, Lang } from "@/lib/types";
import {
  normalizeAdminAuth,
  sanitizeAdminAuthForSave,
} from "@/lib/admin-auth-settings";
import { adminT } from "@/lib/admin-i18n";

interface Props {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
  saving: boolean;
  onSave: (updated: AppContent) => void;
}

export function AccessControlPanel({
  content,
  setContent,
  lang,
  saving,
  onSave,
}: Props) {
  const auth = normalizeAdminAuth(content.adminAuth);

  const patch = (next: AdminAuthSettings) => {
    setContent({ ...content, adminAuth: normalizeAdminAuth(next) });
  };

  const updateUser = (id: string, patchUser: Partial<AccessUser>) => {
    patch({
      ...auth,
      users: auth.users.map((u) => (u.id === id ? { ...u, ...patchUser } : u)),
    });
  };

  const removeUser = (id: string) => {
    patch({ ...auth, users: auth.users.filter((u) => u.id !== id) });
  };

  const addUser = () => {
    const id = `user-${Date.now()}`;
    // Draft row with empty email — kept by normalizeAdminAuth until filled or saved
    patch({
      ...auth,
      users: [
        ...auth.users,
        {
          id,
          email: "",
          name: "",
          admin: false,
          frontend: true,
          enabled: true,
        },
      ],
    });
  };

  const save = () => {
    const next = {
      ...content,
      adminAuth: sanitizeAdminAuthForSave(auth),
    };
    setContent(next);
    onSave(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
        <p className="text-sm font-bold text-teal-950">
          {adminT("accessTitle", lang)}
        </p>
        <p className="mt-0.5 text-xs text-teal-900/80">
          {adminT("accessHint", lang)}
        </p>
      </div>

      {/* Admin methods */}
      <section className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h3 className="text-sm font-bold text-stone-800">
          {adminT("authMethods", lang)}
        </h3>
        <p className="text-xs text-stone-500">{adminT("authMethodsHint", lang)}</p>

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
      </section>

      {/* Frontend login */}
      <section className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h3 className="text-sm font-bold text-stone-800">
          {adminT("frontendLoginTitle", lang)}
        </h3>
        <p className="text-xs text-stone-500">
          {adminT("frontendLoginHint", lang)}
        </p>

        <label className="flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={auth.frontendLoginRequired}
            onChange={(e) =>
              patch({ ...auth, frontendLoginRequired: e.target.checked })
            }
          />
          {adminT("requireFrontendLogin", lang)}
        </label>

        <label className="flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={auth.frontendGoogleEnabled}
            disabled={!auth.frontendLoginRequired}
            onChange={(e) =>
              patch({ ...auth, frontendGoogleEnabled: e.target.checked })
            }
          />
          {adminT("enableFrontendGoogle", lang)}
        </label>
      </section>

      {/* Users CRUD */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-stone-800">
            {adminT("accessUsers", lang)}
          </h3>
          <button
            type="button"
            onClick={addUser}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200"
          >
            {adminT("addAccessUser", lang)}
          </button>
        </div>
        <p className="text-xs text-stone-500">{adminT("accessUsersHint", lang)}</p>

        {auth.users.map((user) => (
          <div
            key={user.id}
            className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-stone-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={user.enabled}
                  onChange={(e) =>
                    updateUser(user.id, { enabled: e.target.checked })
                  }
                />
                {adminT("userEnabled", lang)}
              </label>
              <button
                type="button"
                className="text-xs text-red-500"
                onClick={() => removeUser(user.id)}
              >
                {adminT("delete", lang)}
              </button>
            </div>
            <input
              className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
              placeholder={adminT("userEmail", lang)}
              value={user.email}
              onChange={(e) => updateUser(user.id, { email: e.target.value })}
            />
            <input
              className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
              placeholder={adminT("userName", lang)}
              value={user.name || ""}
              onChange={(e) => updateUser(user.id, { name: e.target.value })}
            />
            <div className="flex flex-wrap gap-4 text-sm text-stone-800">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={user.admin}
                  onChange={(e) =>
                    updateUser(user.id, { admin: e.target.checked })
                  }
                />
                {adminT("userRoleAdmin", lang)}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={user.frontend}
                  onChange={(e) =>
                    updateUser(user.id, { frontend: e.target.checked })
                  }
                />
                {adminT("userRoleFrontend", lang)}
              </label>
            </div>
          </div>
        ))}
      </section>

      <p className="text-[11px] text-stone-500">
        {adminT("googleRedirectHint", lang)}
      </p>
      <p className="text-[11px] text-stone-500">
        {adminT("frontendRedirectHint", lang)}
      </p>

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? adminT("saving", lang) : adminT("saveAccess", lang)}
      </button>
    </div>
  );
}
