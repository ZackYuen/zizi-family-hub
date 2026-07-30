import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getFrontendVisitLog, saveFrontendVisitLog } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const log = await getFrontendVisitLog();
  return NextResponse.json(log);
}

export async function PUT(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "clear";
    };

    if (body.action === "clear") {
      const saved = await saveFrontendVisitLog({
        items: [],
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        ok: true,
        log: saved,
        message: "Visit log cleared",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "visits admin failed";
    console.error("admin visits error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
