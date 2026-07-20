"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { labels, uiLocale } from "@/lib/i18n";

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
    <div className="border-b border-teal-100 bg-gradient-to-r from-amber-50 via-white to-teal-50 px-4 py-2.5">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {labels.today[lang]}
            </span>
            <p className="truncate text-sm font-semibold text-stone-800">{dateStr}</p>
          </div>
        </div>
        <time
          dateTime={now.toISOString()}
          className="shrink-0 font-mono text-lg font-bold tabular-nums text-teal-700"
        >
          {timeStr}
        </time>
      </div>
    </div>
  );
}
