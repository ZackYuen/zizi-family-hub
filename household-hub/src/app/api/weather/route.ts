import { NextResponse } from "next/server";
import { fetchLiveWeather } from "@/lib/hko-weather";
import type { Lang } from "@/lib/types";

export const revalidate = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("lang") ?? "en";
  const appLang: Lang =
    raw === "zh" || raw === "fil" || raw === "en" ? raw : "en";

  try {
    const data = await fetchLiveWeather(appLang);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          appLang === "fil"
            ? "private, max-age=120"
            : "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("weather api", err);
    return NextResponse.json(
      { error: "Weather unavailable" },
      { status: 502 }
    );
  }
}
