import { NextResponse } from "next/server";
import { buildLiveSnapshot, snapshotToKnowledgeText } from "@/lib/family-knowledge";
import { getContentWithSource, getDinnerRecipes } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Live snapshot for cloud agents / integrations.
 * Prefer this over committed content.json — Admin saves live in Supabase.
 */
export async function GET() {
  const { content, source } = await getContentWithSource();
  const recipes = await getDinnerRecipes();
  const snapshot = await buildLiveSnapshot();

  return NextResponse.json(
    {
      source,
      lastUpdated: content.lastUpdated,
      note:
        "Production truth is Admin → Supabase when source=supabase. Repo content.json is seed/backup only.",
      content,
      recipes,
      tonight: snapshot.tonight,
      knowledgeText: snapshotToKnowledgeText(snapshot),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Source": source,
      },
    }
  );
}
