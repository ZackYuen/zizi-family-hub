"use client";

import { useEffect, useState } from "react";
import { startGoogleLogin } from "@/lib/google-admin-login";
import { useLanguage } from "@/contexts/LanguageContext";

type FrontendStatus = {
  required: boolean;
  googleEnabled: boolean;
  googleConfigured: boolean;
  signedIn: boolean;
  email: string | null;
};

const copy = {
  en: {
    title: "Family Hub login",
    desc: "Sign in with a Google account that Sir/Mum added under Admin → Access.",
    google: "Sign in with Google",
    loading: "Checking access…",
    signOut: "Sign out",
  },
  fil: {
    title: "Family Hub login",
    desc: "Mag-sign in gamit ang Google na idinagdag ni Sir/Mum sa Admin → Access.",
    google: "Mag-sign in gamit ang Google",
    loading: "Tinitingnan ang access…",
    signOut: "Sign out",
  },
  zh: {
    title: "家庭 Hub 登入",
    desc: "請用 Sir/Mum 在 Admin → Access 加入的 Google 帳戶登入。",
    google: "使用 Google 登入",
    loading: "檢查權限…",
    signOut: "登出",
  },
} as const;

export function FrontendAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const t = copy[lang] || copy.en;
  const [status, setStatus] = useState<FrontendStatus | null>(null);
  const [error, setError] = useState("");

  const refresh = () =>
    fetch("/api/auth/frontend")
      .then((r) => r.json())
      .then((data: FrontendStatus) => setStatus(data))
      .catch(() =>
        setStatus({
          required: false,
          googleEnabled: false,
          googleConfigured: false,
          signedIn: true,
          email: null,
        })
      );

  useEffect(() => {
    refresh();
  }, []);

  if (!status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">{t.loading}</p>
      </div>
    );
  }

  if (!status.required || status.signedIn) {
    return (
      <>
        {status.required && status.email ? (
          <div className="border-b border-stone-200 bg-white px-4 py-1.5 text-center text-[11px] text-stone-500">
            {status.email}{" "}
            <button
              type="button"
              className="ml-2 font-medium text-teal-700"
              onClick={async () => {
                await fetch("/api/auth/frontend", { method: "DELETE" });
                setStatus({ ...status, signedIn: false, email: null });
              }}
            >
              {t.signOut}
            </button>
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-stone-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-stone-200">
        <h1 className="mb-1 text-xl font-bold text-stone-900">{t.title}</h1>
        <p className="mb-4 text-sm text-stone-500">{t.desc}</p>
        {status.googleEnabled ? (
          <button
            type="button"
            onClick={async () => {
              setError("");
              const { error: gErr } = await startGoogleLogin("frontend");
              if (gErr) setError(gErr);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            <GoogleG />
            {t.google}
          </button>
        ) : (
          <p className="text-sm text-amber-800">
            Frontend login is on, but no Google method / users are enabled.
            Ask Sir/Mum to fix Admin → Access.
          </p>
        )}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function GoogleG() {
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
