import { NextResponse } from "next/server";
import {
  adminAuthFromContent,
  effectiveAuthMethods,
} from "@/lib/admin-auth-settings";
import { setAuthenticated } from "@/lib/auth";
import { getContent } from "@/lib/data";

export async function POST() {
  const content = await getContent();
  const methods = effectiveAuthMethods(adminAuthFromContent(content));
  if (!methods.skip) {
    return NextResponse.json(
      { error: "Skip login is disabled" },
      { status: 403 }
    );
  }
  await setAuthenticated();
  return NextResponse.json({ ok: true });
}
