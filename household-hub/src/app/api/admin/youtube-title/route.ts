import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Fetch YouTube oEmbed title (no API key) to seed Chinese recipe names */
export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    if (!/youtu\.?be|youtube\.com/i.test(url)) {
      return NextResponse.json({ error: "Not a YouTube URL" }, { status: 400 });
    }

    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembed, {
      headers: { "User-Agent": "ZiziFamilyHub/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not fetch video title" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { title?: string; author_name?: string };
    return NextResponse.json({
      title: data.title || "",
      author: data.author_name || "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
