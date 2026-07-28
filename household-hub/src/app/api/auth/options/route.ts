import { NextResponse } from "next/server";
import {
  adminAuthFromContent,
  effectiveAuthMethods,
} from "@/lib/admin-auth-settings";
import { getContent } from "@/lib/data";

/** Public — login page needs to know which methods to show (no secrets). */
export async function GET() {
  try {
    const content = await getContent();
    const settings = adminAuthFromContent(content);
    const methods = effectiveAuthMethods(settings);
    const googleConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    return NextResponse.json({
      passwordEnabled: methods.password,
      googleEnabled: methods.google && googleConfigured,
      skipLogin: methods.skip,
      googleConfigured,
      /** Hint only — not a full list leak of other emails beyond count */
      allowlistCount: settings.googleAllowlist.length,
    });
  } catch {
    return NextResponse.json({
      passwordEnabled: true,
      googleEnabled: false,
      skipLogin: false,
      googleConfigured: false,
      allowlistCount: 0,
    });
  }
}
