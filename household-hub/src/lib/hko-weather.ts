/** Hong Kong Observatory open data helpers (no API key). */

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
  70: { en: "Fine", fil: "Maganda", zh: "天晴" },
  71: { en: "Fine", fil: "Maganda", zh: "天晴" },
  72: { en: "Fine", fil: "Maganda", zh: "天晴" },
  73: { en: "Fine", fil: "Maganda", zh: "天晴" },
  74: { en: "Fine", fil: "Maganda", zh: "天晴" },
  75: { en: "Fine", fil: "Maganda", zh: "天晴" },
  76: { en: "Mainly cloudy", fil: "Maulap", zh: "大致多雲" },
  77: { en: "Mainly fine", fil: "Maganda", zh: "大致天晴" },
  80: { en: "Windy", fil: "Mahangin", zh: "風大" },
  81: { en: "Dry", fil: "Tuyo", zh: "乾燥" },
  82: { en: "Humid", fil: "Mahalumigmig", zh: "潮濕" },
  83: { en: "Fog", fil: "Makulimlim/fog", zh: "霧" },
  84: { en: "Mist", fil: "Maulap", zh: "薄霧" },
  85: { en: "Haze", fil: "Haze", zh: "煙霞" },
  90: { en: "Hot", fil: "Mainit", zh: "熱" },
  91: { en: "Warm", fil: "Mainit-init", zh: "暖" },
  92: { en: "Cool", fil: "Malamig", zh: "涼" },
  93: { en: "Cold", fil: "Malamig", zh: "冷" },
};

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

export function hkoLangFor(appLang: "en" | "fil" | "zh"): HkoLang {
  return appLang === "zh" ? "tc" : "en";
}

export async function fetchLiveWeather(lang: HkoLang): Promise<LiveWeatherSummary> {
  const qs = (dataType: string) =>
    `${HKO_BASE}?dataType=${dataType}&lang=${lang}`;

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

  const warnRaw = warnRes.ok ? ((await warnRes.json()) as Record<string, { name?: string; code?: string }>) : {};
  const flw = flwRes.ok
    ? ((await flwRes.json()) as { forecastDesc?: string })
    : {};

  const temp = pickTemp(rhr.temperature?.data);
  const humidity = rhr.humidity?.data?.[0]?.value ?? null;
  const iconCode = rhr.icon?.[0] ?? null;
  const iconLabel =
    (iconCode != null && ICON_LABELS[iconCode]) || {
      en: "HK weather",
      fil: "Panahon sa HK",
      zh: "香港天氣",
    };

  const warnings = Object.values(warnRaw)
    .filter((w) => w?.name && w?.code)
    .map((w) => ({ code: w.code!, name: w.name! }));

  return {
    temperatureC: temp?.value ?? null,
    humidityPct: typeof humidity === "number" ? humidity : null,
    place: temp?.place ?? (lang === "tc" ? "香港" : "Hong Kong"),
    iconCode,
    iconLabel,
    warnings,
    forecastShort: (flw.forecastDesc ?? "").trim(),
    updateTime: rhr.updateTime ?? null,
    source: "hko",
  };
}
