import { NextResponse } from "next/server";
import {
  adminAuthFromContent,
  effectiveAuthMethods,
} from "@/lib/admin-auth-settings";
import { getAdminPassword, setAuthenticated } from "@/lib/auth";
import { getContent } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { password } = body as { password?: string };

  const content = await getContent();
  const methods = effectiveAuthMethods(adminAuthFromContent(content));
  if (!methods.password) {
    return NextResponse.json(
      { error: "Password login is disabled" },
      { status: 403 }
    );
  }

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setAuthenticated();
  return NextResponse.json({ ok: true });
}
