"use client";

import { createClient } from "@supabase/supabase-js";
import type { AuthAudience } from "@/lib/admin-auth-settings";

/** Start Google OAuth for Admin or frontend. */
export async function startGoogleLogin(
  audience: AuthAudience = "admin"
): Promise<{ error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { error: "Google login is not configured (missing Supabase anon key)." };
  }

  const redirectTo =
    audience === "frontend"
      ? `${window.location.origin}/auth/callback?audience=frontend`
      : `${window.location.origin}/admin/auth/callback`;

  const supabase = createClient(url, anon);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) return { error: error.message };
  return {};
}

/** @deprecated use startGoogleLogin("admin") */
export async function startGoogleAdminLogin(): Promise<{ error?: string }> {
  return startGoogleLogin("admin");
}
