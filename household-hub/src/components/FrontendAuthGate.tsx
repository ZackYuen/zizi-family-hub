"use client";

import { useEffect, useState } from "react";
import { Fraunces, Nunito } from "next/font/google";
import { startGoogleLogin } from "@/lib/google-admin-login";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-login-display",
});

const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-login-body",
});

type FrontendStatus = {
  required: boolean;
  googleEnabled: boolean;
  googleConfigured: boolean;
  signedIn: boolean;
  email: string | null;
};

const copy = {
  en: {
    brand: "Zizi Family Hub",
    headline: "Welcome home",
    google: "Continue with Google",
    loading: "Opening the family hub…",
    signOut: "Sign out",
    signedInAs: "Signed in as",
    googleNotReady:
      "Frontend login is on, but Google is not ready. Check Admin → Access.",
  },
  fil: {
    brand: "Zizi Family Hub",
    headline: "Maligayang pagdating",
    google: "Magpatuloy gamit ang Google",
    loading: "Binubuksan ang family hub…",
    signOut: "Sign out",
    signedInAs: "Naka-sign in bilang",
    googleNotReady:
      "Naka-on ang frontend login, pero hindi pa ready ang Google. Tingnan ang Admin → Access.",
  },
  zh: {
    brand: "Zizi Family Hub",
    headline: "歡迎回家",
    google: "使用 Google 繼續",
    loading: "正在開啟家庭 Hub…",
    signOut: "登出",
    signedInAs: "已登入",
    googleNotReady:
      "已開啟前端登入，但 Google 尚未就緒。請到 Admin → Access 檢查。",
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
  }, []);

  if (!status) {
    return (
      <div
        className={`${display.variable} ${body.variable} flex min-h-screen items-center justify-center`}
        style={{
          fontFamily: "var(--font-login-body), system-ui, sans-serif",
          background:
            "radial-gradient(120% 80% at 50% 0%, #dff7f2 0%, #f7f1e8 55%, #efe6d8 100%)",
        }}
      >
        <p className="animate-pulse text-[#3d5c56]">{t.loading}</p>
      </div>
    );
  }

  if (!status.required || status.signedIn) {
    return (
      <>
        {status.required && status.email ? (
          <div className="border-b border-teal-100 bg-[#f7fffc] px-4 py-1.5 text-center text-[11px] text-stone-600">
            {t.signedInAs} {status.email}{" "}
            <button
              type="button"
              className="ml-2 font-semibold text-teal-700"
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
    <div
      className={`${display.variable} ${body.variable} relative min-h-screen overflow-hidden`}
      style={{
        fontFamily: "var(--font-login-body), system-ui, sans-serif",
        color: "#1f3a36",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 70% 10%, #9ee5d8 0%, transparent 55%), radial-gradient(80% 60% at 10% 90%, #f6c9a8 0%, transparent 50%), linear-gradient(165deg, #e8faf6 0%, #f8f1e7 48%, #f0e4d4 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-10 pt-5 sm:px-6">
        <div className="mb-4 flex items-center justify-end">
          <LanguageToggle />
        </div>

        <div className="login-hero-enter relative -mx-4 mb-5 overflow-hidden sm:-mx-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/login-family-hero.png?v=manga1"
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f3a36]/45 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-12 text-white">
              <h1
                className="login-fade-up text-[1.85rem] leading-tight sm:text-[2.15rem]"
                style={{
                  fontFamily: "var(--font-login-display), Georgia, serif",
                  animationDelay: "120ms",
                }}
              >
                {t.brand}
              </h1>
            </div>
          </div>
        </div>

        <div
          className="login-fade-up mx-auto w-full max-w-sm"
          style={{ animationDelay: "220ms" }}
        >
          <h2
            className="text-[1.45rem] leading-snug text-[#1f3a36]"
            style={{ fontFamily: "var(--font-login-display), Georgia, serif" }}
          >
            {t.headline}
          </h2>

          {status.googleEnabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setError("");
                setBusy(true);
                const { error: gErr } = await startGoogleLogin("frontend");
                if (gErr) {
                  setError(gErr);
                  setBusy(false);
                }
              }}
              className="login-cta-press mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0f766e] py-3.5 text-[0.95rem] font-bold text-white shadow-[0_12px_28px_-12px_rgba(15,118,110,0.7)] transition hover:bg-[#0d9488] disabled:opacity-60"
            >
              <GoogleG />
              {busy ? "…" : t.google}
            </button>
          ) : (
            <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
              {t.googleNotReady}
            </p>
          )}

          {error ? (
            <p className="mt-3 text-center text-sm text-red-600">{error}</p>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginHeroIn {
          from { opacity: 0; transform: scale(1.04); }
          to { opacity: 1; transform: scale(1); }
        }
        .login-fade-up {
          animation: loginFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .login-hero-enter {
          animation: loginHeroIn 1s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .login-cta-press:active { transform: scale(0.98); }
      `}</style>
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
