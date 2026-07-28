import { NextResponse } from "next/server";
import {
  adminAuthFromContent,
  canAccessAudience,
  effectiveAuthMethods,
  type AuthAudience,
} from "@/lib/admin-auth-settings";
import { setAuthenticated, setFrontendSession } from "@/lib/auth";
import { getContent } from "@/lib/data";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    access_token?: string;
    audience?: AuthAudience;
  };
  const accessToken = body.access_token?.trim();
  const audience: AuthAudience =
    body.audience === "frontend" ? "frontend" : "admin";

  if (!accessToken) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  const content = await getContent();
  const settings = adminAuthFromContent(content);
  const methods = effectiveAuthMethods(settings);

  if (audience === "admin" && !methods.google) {
    return NextResponse.json(
      { error: "Google login is disabled for Admin" },
      { status: 403 }
    );
  }
  if (audience === "frontend") {
    if (!settings.frontendLoginRequired) {
      return NextResponse.json(
        { error: "Frontend login is not required" },
        { status: 403 }
      );
    }
    if (settings.frontendGoogleEnabled === false) {
      return NextResponse.json(
        { error: "Google login is disabled for the app" },
        { status: 403 }
      );
    }
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
  if (!canAccessAudience(email, settings, audience)) {
    return NextResponse.json(
      {
        error:
          audience === "admin"
            ? `Google account ${email} is not an Admin user`
            : `Google account ${email} is not allowed on the family app`,
      },
      { status: 403 }
    );
  }

  if (audience === "admin") {
    await setAuthenticated();
  } else {
    await setFrontendSession(email);
  }

  return NextResponse.json({ ok: true, email, audience });
}
