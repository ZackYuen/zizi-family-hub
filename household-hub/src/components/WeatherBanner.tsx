"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localized } from "@/lib/localized-text";
import { labels } from "@/lib/i18n";
import type { HkWeatherFlag } from "@/lib/types";
import type { LiveWeatherSummary } from "@/lib/hko-weather";

const REFRESH_MS = 10 * 60 * 1000;

function iconEmoji(code: number | null, warnings: { code: string }[]): string {
  if (warnings.some((w) => /WRAINA|WRAINB|WRAINR|WL|WTCS|TC/i.test(w.code))) {
    return "⛈️";
  }
  if (warnings.some((w) => /WHOT/i.test(w.code))) return "🥵";
  if (warnings.some((w) => /WCOLD/i.test(w.code))) return "🥶";
  if (code == null) return "🌤️";
  if (code >= 50 && code <= 52) return "☀️";
  if (code >= 53 && code <= 54) return "🌦️";
  if (code >= 60 && code <= 61) return "☁️";
  if (code >= 62 && code <= 64) return "🌧️";
  if (code === 65) return "⛈️";
  if (code >= 70 && code <= 77) return "🌙";
  if (code === 90) return "🥵";
  return "🌤️";
}

export function WeatherBanner({ adminAlert }: { adminAlert?: HkWeatherFlag }) {
  const { lang } = useLanguage();
  const [live, setLive] = useState<LiveWeatherSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/weather?lang=${lang}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as LiveWeatherSummary;
        if (!cancelled) {
          setLive(data);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [lang]);

  const alertOn = Boolean(adminAlert?.alertActive);
  const warningText = live?.warnings.map((w) => w.name).join(" · ") ?? "";
  const condition =
    live != null
      ? lang === "zh"
        ? live.iconLabel.zh
        : lang === "fil"
          ? live.iconLabel.fil
          : live.iconLabel.en
      : "";

  const headline = live
    ? [
        live.place,
        live.temperatureC != null ? `${live.temperatureC}°C` : null,
        live.humidityPct != null
          ? lang === "zh"
            ? `相對濕度 ${live.humidityPct}%`
            : lang === "fil"
              ? `RH ${live.humidityPct}%`
              : `RH ${live.humidityPct}%`
          : null,
        condition,
      ]
        .filter(Boolean)
        .join(" · ")
    : failed
      ? lang === "zh"
        ? "未能載入天氣"
        : lang === "fil"
          ? "Hindi ma-load ang weather"
          : "Weather unavailable"
      : lang === "zh"
        ? "載入天氣中…"
        : lang === "fil"
          ? "Naglo-load ang weather…"
          : "Loading weather…";

  return (
    <div className="border-t border-sky-200/80">
      <div className="bg-sky-50 px-4 py-2">
        <p className="flex items-start justify-center gap-1.5 text-center text-sm font-semibold text-sky-950">
          <span aria-hidden className="shrink-0">
            {iconEmoji(live?.iconCode ?? null, live?.warnings ?? [])}
          </span>
          <span className="min-w-0 leading-snug">{headline}</span>
        </p>
        {warningText && (
          <p className="mt-0.5 text-center text-xs font-medium text-amber-800">
            ⚠ {warningText}
          </p>
        )}
        {live?.forecastShort && (
          <p className="mt-0.5 line-clamp-2 text-center text-[11px] leading-snug text-sky-900/80">
            {live.forecastShort}
          </p>
        )}
      </div>

      {alertOn && adminAlert && (
        <div className="border-t border-red-200 bg-red-100 px-4 py-2">
          <p className="text-center text-xs font-bold uppercase tracking-wide text-red-950">
            {labels.weatherAlert[lang]}
            {adminAlert.level !== "none" ? ` · ${adminAlert.level}` : ""}
          </p>
          <p className="mt-0.5 text-center text-sm text-red-900">
            {localized(adminAlert.note, lang)}
          </p>
        </div>
      )}
    </div>
  );
}
