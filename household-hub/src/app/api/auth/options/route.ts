import { NextResponse } from "next/server";
import {
  adminAuthFromContent,
  effectiveAuthMethods,
  effectiveFrontendAuth,
} from "@/lib/admin-auth-settings";
import { getContent } from "@/lib/data";

/** Public — login screens need method flags (no full user list). */
export async function GET() {
  try {
    const content = await getContent();
    const settings = adminAuthFromContent(content);
    const methods = effectiveAuthMethods(settings);
    const frontend = effectiveFrontendAuth(settings);
    const googleConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    return NextResponse.json({
      passwordEnabled: methods.password,
      googleEnabled: methods.google && googleConfigured,
      skipLogin: methods.skip,
      googleConfigured,
      allowlistCount: settings.users.filter((u) => u.admin && u.enabled).length,
      frontendLoginRequired: frontend.required,
      frontendGoogleEnabled: frontend.google && googleConfigured,
      frontendUserCount: settings.users.filter((u) => u.frontend && u.enabled)
        .length,
    });
  } catch {
    return NextResponse.json({
      passwordEnabled: true,
      googleEnabled: false,
      skipLogin: false,
      googleConfigured: false,
      allowlistCount: 0,
      frontendLoginRequired: false,
      frontendGoogleEnabled: false,
      frontendUserCount: 0,
    });
  }
}
