"use client";

import { useEffect, useState } from "react";
import type { AppContent } from "@/lib/types";
import type { Lang } from "@/lib/types";
import type { DinnerRecipe } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";
import { ScheduleCalendarAdmin } from "@/components/admin/ScheduleCalendarAdmin";
import { MonthlyTasksAdmin } from "@/components/admin/MonthlyTasksAdmin";
import { MealsAdmin } from "@/components/admin/MealsAdmin";
import { HkLifeAdmin } from "@/components/admin/HkLifeAdmin";
import { InboxAdmin } from "@/components/admin/InboxAdmin";
import { VisitLogAdmin } from "@/components/admin/VisitLogAdmin";
import {
  AppliancesAdmin,
  PreferencesAdmin,
} from "@/components/admin/HouseGuidesAdmin";
import { TrilingualFieldEditor } from "@/components/admin/TrilingualFieldEditor";
import { AccessControlPanel } from "@/components/admin/AccessControlPanel";
import { emptyBilingual } from "@/lib/localized-text";
import { startGoogleLogin } from "@/lib/google-admin-login";
import { normalizeAdminAuth } from "@/lib/admin-auth-settings";

const ADMIN_LANGS: Lang[] = ["en", "zh", "fil"];
const ADMIN_LANG_LABEL: Record<Lang, string> = { en: "EN", zh: "繁中", fil: "FIL" };

type AuthOptions = {
  passwordEnabled: boolean;
  googleEnabled: boolean;
  skipLogin: boolean;
  googleConfigured: boolean;
};

export default function AdminPage() {
  const [adminLang, setAdminLang] = useState<Lang>("en");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authOptions, setAuthOptions] = useState<AuthOptions | null>(null);
  const [content, setContent] = useState<AppContent | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [activeSection, setActiveSection] = useState<
    | "rules"
    | "schedule"
    | "meals"
    | "tools"
    | "hkLife"
    | "inbox"
    | "visits"
    | "access"
    | "settings"
    | "json"
  >("rules");
  const [rulesPane, setRulesPane] = useState<"ground" | "prefs">("ground");
  const [schedulePane, setSchedulePane] = useState<"weekly" | "monthly">(
    "weekly"
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const lang = adminLang;

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
          return r.json();
        }
        setAuthed(false);
        return null;
      })
      .then((data: AppContent | null) => {
        if (data) {
          setContent({
            ...data,
            adminAuth: normalizeAdminAuth(data.adminAuth),
          });
          setJsonText(JSON.stringify(data, null, 2));
        }
      });
  }, []);

  useEffect(() => {
    if (authed !== false) return;
    fetch("/api/auth/options")
      .then((r) => r.json())
      .then((opts: AuthOptions) => setAuthOptions(opts))
      .catch(() =>
        setAuthOptions({
          passwordEnabled: true,
          googleEnabled: false,
          skipLogin: false,
          googleConfigured: false,
        })
      );
  }, [authed]);

  const afterLogin = async () => {
    setAuthed(true);
    const data = (await fetch("/api/admin/content").then((r) =>
      r.json()
    )) as AppContent;
    setContent({
      ...data,
      adminAuth: normalizeAdminAuth(data.adminAuth),
    });
    setJsonText(JSON.stringify(data, null, 2));
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(
        typeof payload.error === "string"
          ? payload.error
          : adminT("wrongPassword", lang)
      );
      return;
    }
    await afterLogin();
  };

  const loginGoogle = async () => {
    setError("");
    const { error: gErr } = await startGoogleLogin("admin");
    if (gErr) setError(gErr);
  };

  const loginSkip = async () => {
    setError("");
    const res = await fetch("/api/auth/skip", { method: "POST" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(
        typeof payload.error === "string" ? payload.error : "Skip login failed"
      );
      return;
    }
    await afterLogin();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    setContent(null);
  };

  const saveContent = async (updated: AppContent) => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    if (res.ok) {
      const { content: saved } = await res.json();
      setContent(saved);
      setJsonText(JSON.stringify(saved, null, 2));
      setMessage(adminT("saved", lang));
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error ?? adminT("saveFailed", lang));
    }
  };

  const saveRecipes = async (recipes: DinnerRecipe[]) => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/recipes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipes }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage(adminT("saved", lang));
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error ?? adminT("saveFailed", lang));
    }
  };

  const saveJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as AppContent;
      saveContent(parsed);
    } catch {
      setMessage(adminT("invalidJson", lang));
    }
  };

  const downloadBackup = () => {
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "content-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const AdminLangSwitch = () => (
    <div className="flex rounded-full bg-stone-100 p-0.5">
      {ADMIN_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setAdminLang(l)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            adminLang === l ? "bg-teal-600 text-white" : "text-stone-600"
          }`}
        >
          {ADMIN_LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <p className="text-stone-500">{adminT("loading", lang)}</p>
      </div>
    );
  }

  if (!authed) {
    const showGoogle = authOptions?.googleEnabled;
    const showPassword = authOptions?.passwordEnabled !== false;
    const showSkip = authOptions?.skipLogin;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-stone-100 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-stone-200">
          <div className="mb-4 flex justify-end gap-1">
            <AdminLangSwitch />
          </div>
          <h1 className="mb-1 text-xl font-bold text-stone-900">
            {adminT("login", lang)}
          </h1>
          <p className="mb-4 text-sm text-stone-500">
            {adminT("loginDesc", lang)}
          </p>

          {showGoogle ? (
            <button
              type="button"
              onClick={loginGoogle}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              <GoogleIcon />
              {adminT("signInGoogle", lang)}
            </button>
          ) : null}

          {showSkip ? (
            <button
              type="button"
              onClick={loginSkip}
              className="mb-3 w-full rounded-xl bg-amber-100 py-2.5 text-sm font-semibold text-amber-950 ring-1 ring-amber-300 hover:bg-amber-200"
            >
              {adminT("skipLoginBtn", lang)}
            </button>
          ) : null}

          {showPassword ? (
            <form onSubmit={login}>
              {(showGoogle || showSkip) && (
                <p className="mb-2 text-center text-[11px] uppercase tracking-wide text-stone-400">
                  {adminT("orPassword", lang)}
                </p>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={adminT("password", lang)}
                className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                {adminT("signIn", lang)}
              </button>
            </form>
          ) : null}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <a href="/" className="mt-4 block text-center text-sm text-teal-700">
            {adminT("backToApp", lang)}
          </a>
        </div>
      </div>
    );
  }

  if (!content) return null;

  const updateRuleField = (
    index: number,
    field: "title" | "description" | "consequences",
    value: AppContent["groundRules"][0]["title"]
  ) => {
    const next = structuredClone(content);
    next.groundRules[index][field] = value;
    setContent(next);
  };

  const addRule = () => {
    const next = structuredClone(content);
    next.groundRules.push({
      id: `rule-${Date.now()}`,
      title: { en: "New Rule", fil: "Bagong Alituntunin", zh: "新規則" },
      description: emptyBilingual(),
      consequences: {
        en: "If Broken: Written warning and a talk with Sir/Mum. We coach and follow up — not an automatic immediate contract end (except borrow-money / Zizi-safety rules).",
        fil: "If Broken: Written warning at usapan kay Sir/Mum. May coaching at follow-up — hindi automatic na agad matatapos ang kontrata (maliban sa borrow-money / Zizi-safety rules).",
        zh: "若違反：書面警告並與 Sir/Mum 面談。會輔導與跟進 — 不是自動即時終止合約（借錢／Zizi 安全除外）。",
      },
      category: "general",
      priority: next.groundRules.length + 1,
    });
    setContent(next);
  };

  const deleteRule = (index: number) => {
    const next = structuredClone(content);
    next.groundRules.splice(index, 1);
    setContent(next);
  };

  const tabs = [
    { id: "rules" as const, label: adminT("rules", lang) },
    { id: "schedule" as const, label: adminT("schedule", lang) },
    { id: "meals" as const, label: adminT("meals", lang) },
    { id: "tools" as const, label: adminT("appliances", lang) },
    { id: "hkLife" as const, label: adminT("hkLife", lang) },
    { id: "inbox" as const, label: adminT("inbox", lang) },
    { id: "visits" as const, label: adminT("visits", lang) },
    { id: "access" as const, label: adminT("accessTab", lang) },
    { id: "settings" as const, label: adminT("settings", lang) },
    { id: "json" as const, label: adminT("json", lang) },
  ];

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">{adminT("adminPanel", lang)}</h1>
            <p className="text-xs text-stone-500">Zizi Family Household Hub</p>
          </div>
          <div className="flex items-center gap-2">
            <AdminLangSwitch />
            <a
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm text-teal-700 ring-1 ring-teal-200"
            >
              {adminT("viewApp", lang)}
            </a>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-200"
            >
              {adminT("logout", lang)}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeSection === tab.id
                  ? "bg-teal-600 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{message}</p>
        )}

        <div className="mb-4 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-sky-100">
          <p className="font-semibold">{adminT("liveSource", lang)}</p>
          <p className="mt-0.5">{adminT("liveSourceHint", lang)}</p>
          {content.lastUpdated && (
            <p className="mt-1 text-sky-700">
              lastUpdated: {new Date(content.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {activeSection === "rules" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-200/80 p-1">
              <button
                type="button"
                onClick={() => setRulesPane("ground")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  rulesPane === "ground"
                    ? "bg-red-600 text-white"
                    : "text-stone-600"
                }`}
              >
                {adminT("rulesSubGround", lang)}
                <span className="ml-1 text-xs opacity-80">
                  ({content.groundRules.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRulesPane("prefs")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  rulesPane === "prefs"
                    ? "bg-teal-600 text-white"
                    : "text-stone-600"
                }`}
              >
                {adminT("rulesSubPrefs", lang)}
                <span className="ml-1 text-xs opacity-80">
                  ({content.familyPreferences?.length ?? 0})
                </span>
              </button>
            </div>

            {rulesPane === "ground" ? (
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
                  <p className="font-bold">{adminT("rulesSubGround", lang)}</p>
                  <p className="mt-0.5">{adminT("groundRulesAdminHint", lang)}</p>
                </div>
                {content.groundRules.map((rule, i) => (
                  <div
                    key={rule.id}
                    className="rounded-xl bg-white p-4 ring-2 ring-red-100"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-600">
                        Ground rule #{rule.priority} · {rule.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteRule(i)}
                        className="text-xs text-red-500"
                      >
                        {adminT("delete", lang)}
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-xs font-medium text-stone-500">
                          {adminT("titleEn", lang).replace("English", "…")}
                        </p>
                        <TrilingualFieldEditor
                          value={rule.title}
                          onChange={(v) => updateRuleField(i, "title", v)}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-stone-500">
                          {adminT("descEn", lang).replace("English", "…")}
                        </p>
                        <TrilingualFieldEditor
                          value={rule.description}
                          onChange={(v) => updateRuleField(i, "description", v)}
                          multiline
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-bold text-red-700">
                          {adminT("consequences", lang)}
                        </p>
                        <TrilingualFieldEditor
                          value={rule.consequences ?? emptyBilingual()}
                          onChange={(v) => updateRuleField(i, "consequences", v)}
                          multiline
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRule}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200"
                >
                  {adminT("addRule", lang)}
                </button>
              </div>
            ) : (
              <PreferencesAdmin
                content={content}
                setContent={setContent}
                lang={lang}
              />
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => saveContent(content)}
              className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? adminT("saving", lang)
                : adminT("saveRulesAndPrefs", lang)}
            </button>
          </div>
        )}

        {activeSection === "schedule" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-200/80 p-1">
              <button
                type="button"
                onClick={() => setSchedulePane("weekly")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  schedulePane === "weekly"
                    ? "bg-teal-600 text-white"
                    : "text-stone-600"
                }`}
              >
                {adminT("scheduleSubWeekly", lang)}
              </button>
              <button
                type="button"
                onClick={() => setSchedulePane("monthly")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  schedulePane === "monthly"
                    ? "bg-amber-600 text-white"
                    : "text-stone-600"
                }`}
              >
                {adminT("scheduleSubMonthly", lang)}
                <span className="ml-1 text-xs opacity-80">
                  ({content.monthlyTasks?.length ?? 0})
                </span>
              </button>
            </div>

            {schedulePane === "weekly" ? (
              <ScheduleCalendarAdmin
                content={content}
                setContent={setContent}
                lang={lang}
              />
            ) : (
              <MonthlyTasksAdmin
                content={content}
                setContent={setContent}
                lang={lang}
              />
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => saveContent(content)}
              className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? adminT("saving", lang) : adminT("saveSchedule", lang)}
            </button>
          </div>
        )}

        {activeSection === "meals" && (
          <MealsAdmin
            lang={lang}
            saving={saving}
            onSave={saveRecipes}
            setMessage={setMessage}
          />
        )}

        {activeSection === "tools" && (
          <AppliancesAdmin
            content={content}
            setContent={setContent}
            lang={lang}
            saving={saving}
            onSave={() => saveContent(content)}
          />
        )}

        {activeSection === "hkLife" && (
          <HkLifeAdmin
            content={content}
            setContent={setContent}
            lang={lang}
            saving={saving}
            onSave={() => saveContent(content)}
          />
        )}

        {activeSection === "inbox" && (
          <InboxAdmin lang={lang} setMessage={setMessage} />
        )}

        {activeSection === "visits" && (
          <VisitLogAdmin lang={lang} setMessage={setMessage} />
        )}

        {activeSection === "access" && (
          <AccessControlPanel
            content={content}
            setContent={setContent}
            lang={lang}
            saving={saving}
            onSave={(updated) => saveContent(updated)}
          />
        )}

        {activeSection === "settings" && (
          <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {adminT("helperName", lang)}
            </label>
            <input
              value={content.helperName}
              onChange={(e) => setContent({ ...content, helperName: e.target.value })}
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {adminT("familyName", lang)}
            </label>
            <input
              value={content.familyName}
              onChange={(e) => setContent({ ...content, familyName: e.target.value })}
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <label className="mb-2 block text-sm font-medium text-stone-700">
              {adminT("schoolEn", lang).replace("(English)", "")}
            </label>
            <TrilingualFieldEditor
              value={content.ziziSchool ?? emptyBilingual()}
              onChange={(ziziSchool) => setContent({ ...content, ziziSchool })}
              multiline
            />
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(content.whatsappBotPaused)}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      whatsappBotPaused: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-teal-600"
                />
                <span>
                  <span className="block text-sm font-medium text-stone-800">
                    {adminT("whatsappBotPaused", lang)}
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {adminT("whatsappBotPausedHint", lang)}
                  </span>
                </span>
              </label>
            </div>
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
              <label className="block text-sm font-medium text-stone-800">
                {adminT("whatsappReplyGroups", lang)}
              </label>
              <p className="mt-1 text-xs text-stone-500">
                {adminT("whatsappReplyGroupsHint", lang)}
              </p>
              <input
                value={content.whatsappReplyGroupJids ?? ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    whatsappReplyGroupJids: e.target.value,
                  })
                }
                placeholder="120363xxxxxxxx@g.us"
                className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
              <label className="block text-sm font-medium text-stone-800">
                {adminT("whatsappReminderGroups", lang)}
              </label>
              <p className="mt-1 text-xs text-stone-500">
                {adminT("whatsappReminderGroupsHint", lang)}
              </p>
              <input
                value={content.whatsappReminderGroupJids ?? ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    whatsappReminderGroupJids: e.target.value,
                  })
                }
                placeholder="120363xxxxxxxx@g.us"
                className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-mono text-sm"
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveContent(content)}
              className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? adminT("saving", lang) : adminT("saveSettings", lang)}
            </button>
            <button
              type="button"
              onClick={downloadBackup}
              className="ml-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200"
            >
              {adminT("downloadBackup", lang)}
            </button>
          </div>
        )}

        {activeSection === "json" && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">{adminT("jsonHelp", lang)}</p>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={24}
              className="w-full rounded-xl border border-stone-200 bg-white p-3 font-mono text-xs"
            />
            <button
              type="button"
              disabled={saving}
              onClick={saveJson}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? adminT("saving", lang) : adminT("saveJson", lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 36 26.8 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.3 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
