import { NextResponse } from "next/server";
import { getFrontendSessionEmail } from "@/lib/auth";
import { getContent, appendFrontendVisit } from "@/lib/data";
import { resolveFrontendDisplayName } from "@/lib/frontend-display-name";
import type { FrontendVisitSurface } from "@/lib/types";

export const dynamic = "force-dynamic";

const SURFACES = new Set<FrontendVisitSurface>([
  "open",
  "howto",
  "schedule",
  "meals",
  "tools",
  "ask",
  "hkLife",
  "rules",
]);

/** Public — family app logs visits (identity from frontend session cookie when present). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      surface?: string;
      lang?: string;
      sessionId?: string;
    };

    const surface = body.surface as FrontendVisitSurface | undefined;
    if (!surface || !SURFACES.has(surface)) {
      return NextResponse.json({ error: "invalid surface" }, { status: 400 });
    }

    const content = await getContent();
    const email = await getFrontendSessionEmail();
    const displayName = resolveFrontendDisplayName({
      email,
      settings: content.adminAuth,
      fallback: content.helperName || "Visitor",
    });

    const item = await appendFrontendVisit({
      surface,
      displayName,
      email: email || undefined,
      lang: body.lang,
      sessionId: body.sessionId,
    });

    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "visit log failed";
    console.error("visit log error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
