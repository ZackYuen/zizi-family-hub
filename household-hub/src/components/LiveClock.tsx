"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { uiLocale } from "@/lib/i18n";

const HK_TZ = "Asia/Hong_Kong";

export function LiveClock() {
  const { lang } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const locale = uiLocale(lang);

  const dateStr = now.toLocaleDateString(locale, {
    timeZone: HK_TZ,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString(locale, {
    timeZone: HK_TZ,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="border-b border-stone-100 bg-stone-50/80 px-4 py-1.5">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <p className="truncate text-xs text-stone-600">{dateStr}</p>
        <time
          dateTime={now.toISOString()}
          className="shrink-0 font-mono text-sm font-semibold tabular-nums text-stone-800"
        >
          {timeStr}
        </time>
      </div>
    </div>
  );
}
