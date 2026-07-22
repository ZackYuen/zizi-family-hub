/** Hong Kong Observatory open data helpers (no API key). */

import { translateWeatherForecastToFil } from "@/lib/translate";
import type { Lang } from "@/lib/types";

export type HkoLang = "en" | "tc";

export interface LiveWeatherSummary {
  temperatureC: number | null;
  humidityPct: number | null;
  place: string;
  iconCode: number | null;
  iconLabel: { en: string; fil: string; zh: string };
  warnings: { code: string; name: string }[];
  forecastShort: string;
  updateTime: string | null;
  source: "hko";
  /** App language used for place / warning / forecast text */
  displayLang: Lang;
}

const HKO_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";

/** Prefer Kwun Tong (home area), then nearby, then HKO HQ. */
const TEMP_PLACE_PRIORITY = [
  "Kwun Tong",
  "觀塘",
  "Kai Tak Runway Park",
  "啟德跑道公園",
  "Tseung Kwan O",
  "將軍澳",
  "King's Park",
  "京士柏",
  "Hong Kong Observatory",
  "香港天文台",
];

const PLACE_FIL: Record<string, string> = {
  "Kwun Tong": "Kwun Tong",
  "Kai Tak Runway Park": "Kai Tak Runway Park",
  "Tseung Kwan O": "Tseung Kwan O",
  "King's Park": "King's Park",
  "Hong Kong Observatory": "Hong Kong Observatory",
  "Hong Kong": "Hong Kong",
};

/** Official HKO warning codes → Filipino (Tagalog) names for helpers. */
const WARNING_FIL: Record<string, string> = {
  WHOT: "Babala sa Napakainit na Panahon",
  WCOLD: "Babala sa Malamig na Panahon",
  WRAINA: "Amber Rainstorm Warning (malakas na ulan)",
  WRAINR: "Red Rainstorm Warning (napakalakas na ulan)",
  WRAINB: "Black Rainstorm Warning (extreme — huwag lumabas)",
  WL: "Babala sa Landslip",
  WTCSGNL: "Babala sa Bagyo",
  TC1: "Signal No. 1 (Standby)",
  TC3: "Signal No. 3 (Malakas na hangin)",
  TC8NE: "Signal No. 8 (NE) — huwag lumabas kung hindi kinakailangan",
  TC8NW: "Signal No. 8 (NW) — huwag lumabas kung hindi kinakailangan",
  TC8SE: "Signal No. 8 (SE) — huwag lumabas kung hindi kinakailangan",
  TC8SW: "Signal No. 8 (SW) — huwag lumabas kung hindi kinakailangan",
  TC9: "Signal No. 9",
  TC10: "Signal No. 10 (Hurricane)",
  WTMW: "Babala sa Tsunami",
  WFROST: "Babala sa Frost",
  WFNTSA: "Babala sa Sunog (Fire Danger)",
  WMSGNL: "Strong Monsoon Signal",
  WFIREY: "Yellow Fire Danger Warning",
  WFIRER: "Red Fire Danger Warning",
  WTS: "Babala sa Kulog at Kidlat",
  WCW: "Babala sa Malamig na Panahon",
};

const ICON_LABELS: Record<number, { en: string; fil: string; zh: string }> = {
  50: { en: "Sunny", fil: "Maaraw", zh: "晴朗" },
  51: { en: "Sunny periods", fil: "May araw", zh: "間中有陽光" },
  52: { en: "Sunny intervals", fil: "May araw", zh: "短暫陽光" },
  53: { en: "Sunny with showers", fil: "Maaraw may ambon", zh: "晴有驟雨" },
  54: { en: "Sunny with thundery showers", fil: "Maaraw may kulog", zh: "晴有狂風雷雨" },
  60: { en: "Cloudy", fil: "Maulap", zh: "多雲" },
  61: { en: "Overcast", fil: "Makulimlim", zh: "密雲" },
  62: { en: "Light rain", fil: "Mahinang ulan", zh: "微雨" },
  63: { en: "Rain", fil: "Ulan", zh: "雨" },
  64: { en: "Heavy rain", fil: "Malakas na ulan", zh: "大雨" },
  65: { en: "Thunderstorms", fil: "Kulog at kidlat", zh: "雷暴" },
  70: { en: "Fine", fil: "Maganda ang panahon", zh: "天晴" },
  71: { en: "Fine", fil: "Maganda ang panahon", zh: "天晴" },
  72: { en: "Fine", fil: "Maganda ang panahon", zh: "天晴" },
  73: { en: "Fine", fil: "Maganda ang panahon", zh: "天晴" },
  74: { en: "Fine", fil: "Maganda ang panahon", zh: "天晴" },
  75: { en: "Fine", fil: "Maganda ang panahon", zh: "天晴" },
  76: { en: "Mainly cloudy", fil: "Maulap", zh: "大致多雲" },
  77: { en: "Mainly fine", fil: "Karaniwang maganda", zh: "大致天晴" },
  80: { en: "Windy", fil: "Mahangin", zh: "風大" },
  81: { en: "Dry", fil: "Tuyo", zh: "乾燥" },
  82: { en: "Humid", fil: "Mahalumigmig", zh: "潮濕" },
  83: { en: "Fog", fil: "May fog", zh: "霧" },
  84: { en: "Mist", fil: "May mist", zh: "薄霧" },
  85: { en: "Haze", fil: "May haze", zh: "煙霞" },
  90: { en: "Hot", fil: "Mainit", zh: "熱" },
  91: { en: "Warm", fil: "Mainit-init", zh: "暖" },
  92: { en: "Cool", fil: "Malamig", zh: "涼" },
  93: { en: "Cold", fil: "Malamig", zh: "冷" },
};

/** In-memory cache for Filipino forecast translations (key = updateTime|en text). */
const filForecastCache = new Map<string, string>();

function pickTemp(
  rows: { place: string; value: number }[] | undefined
): { place: string; value: number } | null {
  if (!rows?.length) return null;
  for (const want of TEMP_PLACE_PRIORITY) {
    const hit = rows.find((r) => r.place === want);
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

export function hkoLangFor(appLang: Lang): HkoLang {
  return appLang === "zh" ? "tc" : "en";
}

function localizePlace(place: string, appLang: Lang): string {
  if (appLang === "fil") return PLACE_FIL[place] ?? place;
  return place;
}

function localizeWarningName(
  code: string,
  englishOrChineseName: string,
  appLang: Lang
): string {
  if (appLang !== "fil") return englishOrChineseName;
  // Prefer code map; fall back to English name from HKO
  if (WARNING_FIL[code]) return WARNING_FIL[code];
  // Soft fallbacks for codes we only know by prefix
  if (/^TC8/.test(code)) return "Signal No. 8 (Malakas na hangin / bagyo)";
  if (/^WRAIN/.test(code)) return englishOrChineseName; // keep Amber/Red/Black English labels helpers know
  if (code === "WHOT" || /HOT/i.test(code))
    return "Babala sa Napakainit na Panahon";
  return englishOrChineseName;
}

async function localizeForecast(
  englishForecast: string,
  appLang: Lang,
  updateTime: string | null
): Promise<string> {
  const text = englishForecast.trim();
  if (!text || appLang !== "fil") return text;

  const cacheKey = `${updateTime ?? "na"}|${text}`;
  const cached = filForecastCache.get(cacheKey);
  if (cached) return cached;

  try {
    const out = await translateWeatherForecastToFil(text);
    if (out?.trim()) {
      filForecastCache.set(cacheKey, out.trim());
      // Bound cache size
      if (filForecastCache.size > 40) {
        const first = filForecastCache.keys().next().value;
        if (first) filForecastCache.delete(first);
      }
      return out.trim();
    }
  } catch (err) {
    console.error("weather fil forecast translate", err);
  }
  return text;
}

export async function fetchLiveWeather(
  appLang: Lang = "en"
): Promise<LiveWeatherSummary> {
  const hkoLang = hkoLangFor(appLang);
  const qs = (dataType: string) =>
    `${HKO_BASE}?dataType=${dataType}&lang=${hkoLang}`;

  const [rhrRes, warnRes, flwRes] = await Promise.all([
    fetch(qs("rhrread"), { next: { revalidate: 600 } }),
    fetch(qs("warnsum"), { next: { revalidate: 300 } }),
    fetch(qs("flw"), { next: { revalidate: 600 } }),
  ]);

  if (!rhrRes.ok) {
    throw new Error(`HKO rhrread ${rhrRes.status}`);
  }

  const rhr = (await rhrRes.json()) as {
    temperature?: { data?: { place: string; value: number; unit: string }[] };
    humidity?: { data?: { place: string; value: number; unit: string }[] };
    icon?: number[];
    updateTime?: string;
  };

  const warnRaw = warnRes.ok
    ? ((await warnRes.json()) as Record<
        string,
        { name?: string; code?: string }
      >)
    : {};
  const flw = flwRes.ok
    ? ((await flwRes.json()) as { forecastDesc?: string })
    : {};

  // Filipino forecast is translated from English HKO text
  let forecastSource = (flw.forecastDesc ?? "").trim();
  if (appLang === "fil") {
    // rhr/flw already fetched in English for fil via hkoLangFor
    forecastSource = (flw.forecastDesc ?? "").trim();
  }

  const temp = pickTemp(rhr.temperature?.data);
  const humidity = rhr.humidity?.data?.[0]?.value ?? null;
  const iconCode = rhr.icon?.[0] ?? null;
  const iconLabel =
    (iconCode != null && ICON_LABELS[iconCode]) || {
      en: "HK weather",
      fil: "Panahon sa HK",
      zh: "香港天氣",
    };

  const updateTime = rhr.updateTime ?? null;
  const rawPlace =
    temp?.place ?? (hkoLang === "tc" ? "香港" : "Hong Kong");

  const warnings = Object.values(warnRaw)
    .filter((w) => w?.name && w?.code)
    .map((w) => ({
      code: w.code!,
      name: localizeWarningName(w.code!, w.name!, appLang),
    }));

  const forecastShort = await localizeForecast(
    forecastSource,
    appLang,
    updateTime
  );

  return {
    temperatureC: temp?.value ?? null,
    humidityPct: typeof humidity === "number" ? humidity : null,
    place: localizePlace(rawPlace, appLang),
    iconCode,
    iconLabel,
    warnings,
    forecastShort,
    updateTime,
    source: "hko",
    displayLang: appLang,
  };
}
