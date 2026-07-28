"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { AuthAudience } from "@/lib/admin-auth-settings";

function CallbackInner({
  defaultAudience,
  failHref,
  okHref,
}: {
  defaultAudience: AuthAudience;
  failHref: string;
  okHref: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) {
        setError("Supabase is not configured on this deploy.");
        return;
      }

      const audience: AuthAudience =
        searchParams.get("audience") === "frontend" ||
        defaultAudience === "frontend"
          ? "frontend"
          : "admin";

      const supabase = createClient(url, anon);
      const code = searchParams.get("code");
      let accessToken: string | undefined;

      if (code) {
        const { data, error: exErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          if (!cancelled) setError(exErr.message);
          return;
        }
        accessToken = data.session?.access_token;
      } else {
        const { data } = await supabase.auth.getSession();
        accessToken = data.session?.access_token;
      }

      if (!accessToken) {
        if (!cancelled) {
          setError("No Google session — try Sign in with Google again.");
        }
        return;
      }

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, audience }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!cancelled) {
          setError(
            typeof payload.error === "string"
              ? payload.error
              : "Google login failed"
          );
        }
        return;
      }

      await supabase.auth.signOut().catch(() => undefined);
      router.replace(audience === "frontend" ? "/" : okHref);
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, defaultAudience, okHref]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-100 px-4">
      {error ? (
        <>
          <p className="max-w-md text-center text-sm text-red-600">{error}</p>
          <a href={failHref} className="text-sm font-medium text-teal-700">
            ← Back
          </a>
        </>
      ) : (
        <p className="text-stone-500">Signing in with Google…</p>
      )}
    </div>
  );
}

export function GoogleAuthCallback({
  defaultAudience,
  failHref,
  okHref,
}: {
  defaultAudience: AuthAudience;
  failHref: string;
  okHref: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-100">
          <p className="text-stone-500">Signing in with Google…</p>
        </div>
      }
    >
      <CallbackInner
        defaultAudience={defaultAudience}
        failHref={failHref}
        okHref={okHref}
      />
    </Suspense>
  );
}
