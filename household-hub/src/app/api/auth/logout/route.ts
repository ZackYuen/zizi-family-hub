import { NextResponse } from "next/server";
import { clearAuthentication } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAuthentication();
  return NextResponse.json({ ok: true });
}
