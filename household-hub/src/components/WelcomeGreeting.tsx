"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type GreetingResponse = {
  welcome: string;
  greeting: string;
};

type Props = {
  name: string;
  lastUpdatedLabel: string;
};

function localWelcome(lang: string, name: string): string {
  if (lang === "zh") return `歡迎，${name}`;
  if (lang === "fil") return `Maligayang pagdating, ${name}`;
  return `Welcome, ${name}`;
}

function cacheKey(lang: string, name: string): string {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `hh-welcome-greeting:${dateKey}:${lang}:${name}`;
}

export function WelcomeGreeting({ name, lastUpdatedLabel }: Props) {
  const { lang } = useLanguage();
  const [welcome, setWelcome] = useState(() => localWelcome(lang, name));
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    let cancelled = false;
    const key = cacheKey(lang, name);

    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as GreetingResponse;
        if (!cancelled && parsed.welcome && parsed.greeting) {
          setWelcome(parsed.welcome);
          setGreeting(parsed.greeting);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    setWelcome(localWelcome(lang, name));
    setGreeting("");

    void (async () => {
      try {
        const res = await fetch(
          `/api/greeting?lang=${encodeURIComponent(lang)}&name=${encodeURIComponent(name)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as GreetingResponse;
        if (cancelled || !data.welcome || !data.greeting) return;
        setWelcome(data.welcome);
        setGreeting(data.greeting);
        try {
          sessionStorage.setItem(key, JSON.stringify(data));
        } catch {
          /* ignore */
        }
      } catch {
        /* keep local welcome */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang, name]);

  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-stone-900 leading-tight">
        {welcome}
      </p>
      {greeting ? (
        <p className="mt-0.5 text-xs text-teal-800/90 leading-snug line-clamp-2">
          {greeting}
        </p>
      ) : null}
      <p className="mt-0.5 text-[11px] text-stone-500">{lastUpdatedLabel}</p>
    </div>
  );
}
