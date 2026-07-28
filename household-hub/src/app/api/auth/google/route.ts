import { NextResponse } from "next/server";
import {
  adminAuthFromContent,
  effectiveAuthMethods,
  isEmailAllowlisted,
} from "@/lib/admin-auth-settings";
import { setAuthenticated } from "@/lib/auth";
import { getContent } from "@/lib/data";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    access_token?: string;
  };
  const accessToken = body.access_token?.trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  const content = await getContent();
  const settings = adminAuthFromContent(content);
  const methods = effectiveAuthMethods(settings);
  if (!methods.google) {
    return NextResponse.json(
      { error: "Google login is disabled" },
      { status: 403 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: "Google login is not configured" },
      { status: 503 }
    );
  }

  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.email) {
    return NextResponse.json(
      { error: "Invalid Google session" },
      { status: 401 }
    );
  }

  const email = data.user.email;
  if (!isEmailAllowlisted(email, settings)) {
    return NextResponse.json(
      {
        error: `Google account ${email} is not on the Admin allowlist`,
      },
      { status: 403 }
    );
  }

  await setAuthenticated();
  return NextResponse.json({ ok: true, email });
}
