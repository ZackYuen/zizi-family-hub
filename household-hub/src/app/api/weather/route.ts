import { NextResponse } from "next/server";
import { fetchLiveWeather, hkoLangFor } from "@/lib/hko-weather";
import type { Lang } from "@/lib/types";

export const revalidate = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const langParam = (searchParams.get("lang") ?? "en") as Lang;
  const lang = hkoLangFor(
    langParam === "zh" || langParam === "fil" || langParam === "en"
      ? langParam
      : "en"
  );

  try {
    const data = await fetchLiveWeather(lang);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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
