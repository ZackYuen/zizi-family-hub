import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { translateEnToFil } from "@/lib/translate";

export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = (await request.json()) as { text?: string };
  if (!text?.trim()) {
    return NextResponse.json({ translation: "" });
  }

  try {
    const translation = await translateEnToFil(text);
    return NextResponse.json({ translation });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
