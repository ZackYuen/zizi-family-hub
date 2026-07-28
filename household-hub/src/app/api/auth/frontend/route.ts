import { NextResponse } from "next/server";
import {
  adminAuthFromContent,
  canAccessAudience,
  effectiveFrontendAuth,
} from "@/lib/admin-auth-settings";
import {
  clearFrontendSession,
  getFrontendSessionEmail,
} from "@/lib/auth";
import { getContent } from "@/lib/data";

/** Public status for the family app gate */
export async function GET() {
  const content = await getContent();
  const settings = adminAuthFromContent(content);
  const frontend = effectiveFrontendAuth(settings);
  const email = await getFrontendSessionEmail();
  const allowed =
    !frontend.required ||
    (Boolean(email) && canAccessAudience(email, settings, "frontend"));

  return NextResponse.json({
    required: frontend.required,
    googleEnabled: frontend.google,
    googleConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    signedIn: Boolean(email) && allowed,
    email: allowed ? email : null,
  });
}

export async function DELETE() {
  await clearFrontendSession();
  return NextResponse.json({ ok: true });
}
