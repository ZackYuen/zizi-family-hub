import { NextResponse } from "next/server";
import { getContentWithSource } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const { content, source } = await getContentWithSource();
  return NextResponse.json(
    { ...content, _meta: { source } },
    { headers: { "X-Data-Source": source, "Cache-Control": "no-store" } }
  );
}
