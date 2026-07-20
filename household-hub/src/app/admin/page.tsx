"use client";

import { useEffect, useState } from "react";
import type { AppContent } from "@/lib/types";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [content, setContent] = useState<AppContent | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [activeSection, setActiveSection] = useState<
    "rules" | "schedule" | "meals" | "settings" | "json"
  >("rules");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
          setContent(data);
          setJsonText(JSON.stringify(data, null, 2));
        }
      });
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    setAuthed(true);
    const data = await fetch("/api/admin/content").then((r) => r.json());
    setContent(data);
    setJsonText(JSON.stringify(data, null, 2));
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    setContent(null);
  };

  const save = async (updated: AppContent) => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    if (res.ok) {
      setContent(updated);
      setJsonText(JSON.stringify(updated, null, 2));
      setMessage("Saved successfully!");
    } else {
      setMessage("Failed to save.");
    }
  };

  const saveJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as AppContent;
      save(parsed);
    } catch {
      setMessage("Invalid JSON — please check formatting.");
    }
  };

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-stone-100 px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-stone-200"
        >
          <h1 className="mb-1 text-xl font-bold text-stone-900">Admin Login</h1>
          <p className="mb-4 text-sm text-stone-500">
            Manage ground rules, schedule & meals for Charlene
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-3 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Sign In
          </button>
          <a href="/" className="mt-4 block text-center text-sm text-teal-700">
            ← Back to app
          </a>
        </form>
      </div>
    );
  }

  if (!content) return null;

  const updateRule = (index: number, field: "title" | "description", lang: "en" | "fil", value: string) => {
    const next = structuredClone(content);
    next.groundRules[index][field][lang] = value;
    setContent(next);
  };

  const addRule = () => {
    const next = structuredClone(content);
    next.groundRules.push({
      id: `rule-${Date.now()}`,
      title: { en: "New Rule", fil: "Bagong Alituntunin" },
      description: { en: "", fil: "" },
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

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Admin Panel</h1>
            <p className="text-xs text-stone-500">Zizi Family Household Hub</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm text-teal-700 ring-1 ring-teal-200"
            >
              View App
            </a>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["rules", "schedule", "meals", "settings", "json"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSection(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                activeSection === s
                  ? "bg-teal-600 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {message && (
          <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
            {message}
          </p>
        )}

        {activeSection === "rules" && (
          <div className="space-y-4">
            {content.groundRules.map((rule, i) => (
              <div key={rule.id} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-400">
                    Rule #{rule.priority} · {rule.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteRule(i)}
                    className="text-xs text-red-500"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={rule.title.en}
                    onChange={(e) => updateRule(i, "title", "en", e.target.value)}
                    placeholder="Title (English)"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={rule.title.fil}
                    onChange={(e) => updateRule(i, "title", "fil", e.target.value)}
                    placeholder="Title (Filipino)"
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={rule.description.en}
                    onChange={(e) => updateRule(i, "description", "en", e.target.value)}
                    placeholder="Description (English)"
                    rows={2}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={rule.description.fil}
                    onChange={(e) => updateRule(i, "description", "fil", e.target.value)}
                    placeholder="Description (Filipino)"
                    rows={2}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addRule}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
            >
              + Add Rule
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(content)}
              className="ml-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Rules"}
            </button>
          </div>
        )}

        {activeSection === "schedule" && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              Edit the weekly task schedule. Use the JSON editor for bulk changes from your Numbers spreadsheet.
            </p>
            {content.weeklySchedule.map((day, di) => (
              <details key={day.dayKey} className="rounded-xl bg-white ring-1 ring-stone-200">
                <summary className="cursor-pointer px-4 py-3 font-semibold text-stone-800">
                  {day.day.en} / {day.day.fil} ({day.tasks.length} tasks)
                </summary>
                <div className="space-y-2 border-t border-stone-100 px-4 py-3">
                  {day.tasks.map((task, ti) => (
                    <div key={task.id} className="grid gap-2 sm:grid-cols-4">
                      <input
                        value={task.time}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.weeklySchedule[di].tasks[ti].time = e.target.value;
                          setContent(next);
                        }}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                        placeholder="Time"
                      />
                      <input
                        value={task.task.en}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.weeklySchedule[di].tasks[ti].task.en = e.target.value;
                          setContent(next);
                        }}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm sm:col-span-1"
                        placeholder="Task (EN)"
                      />
                      <input
                        value={task.task.fil}
                        onChange={(e) => {
                          const next = structuredClone(content);
                          next.weeklySchedule[di].tasks[ti].task.fil = e.target.value;
                          setContent(next);
                        }}
                        className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm sm:col-span-2"
                        placeholder="Task (FIL)"
                      />
                    </div>
                  ))}
                </div>
              </details>
            ))}
            <button
              type="button"
              disabled={saving}
              onClick={() => save(content)}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        )}

        {activeSection === "meals" && (
          <div className="space-y-4 rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="font-semibold text-stone-900">Dinner randomizer</h2>
            <p className="text-sm text-stone-600">
              Dinner is auto-generated each night: 1 meat + 1 vegetable + 1 soup
              (same logic as your Apple Numbers file). Recipes are stored in{" "}
              <code className="rounded bg-stone-100 px-1">data/dinner-recipes.json</code>.
            </p>
            <a
              href="/api/dinner/tonight"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-teal-700 underline"
            >
              Preview tonight&apos;s API menu →
            </a>
            <p className="text-xs text-stone-500">
              To add/edit recipes, update dinner-recipes.json on the server or ask
              for a recipe admin tab in a future update.
            </p>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Helper Name
            </label>
            <input
              value={content.helperName}
              onChange={(e) => setContent({ ...content, helperName: e.target.value })}
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Family Name
            </label>
            <input
              value={content.familyName}
              onChange={(e) => setContent({ ...content, familyName: e.target.value })}
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Zizi School (English)
            </label>
            <input
              value={content.ziziSchool?.en ?? ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  ziziSchool: {
                    en: e.target.value,
                    fil: content.ziziSchool?.fil ?? e.target.value,
                  },
                })
              }
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Zizi School (Filipino)
            </label>
            <input
              value={content.ziziSchool?.fil ?? ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  ziziSchool: {
                    en: content.ziziSchool?.en ?? "",
                    fil: e.target.value,
                  },
                })
              }
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <input
              value={content.familyName}
              onChange={(e) => setContent({ ...content, familyName: e.target.value })}
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => save(content)}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save Settings
            </button>
          </div>
        )}

        {activeSection === "json" && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              Paste content exported from your Apple Numbers schedule here for bulk updates.
            </p>
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
              {saving ? "Saving..." : "Save JSON"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
