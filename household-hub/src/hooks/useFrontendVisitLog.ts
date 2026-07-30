"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { FrontendVisitSurface } from "@/lib/types";

const SESSION_KEY = "hh_visit_session";

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s-${Date.now().toString(36)}`;
  }
}

function logVisit(surface: FrontendVisitSurface, lang: string) {
  const sessionId = getSessionId();
  void fetch("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ surface, lang, sessionId }),
    keepalive: true,
  }).catch(() => {
    /* ignore offline / transient */
  });
}

/**
 * Logs app open once per browser session, plus each tab / how-to surface.
 */
export function useFrontendVisitLog(opts: {
  surface: FrontendVisitSurface;
  enabled?: boolean;
}) {
  const { lang } = useLanguage();
  const { surface, enabled = true } = opts;
  const opened = useRef(false);
  const lastSurface = useRef<string>("");

  useEffect(() => {
    if (!enabled || opened.current) return;
    opened.current = true;
    logVisit("open", lang);
  }, [enabled, lang]);

  useEffect(() => {
    if (!enabled) return;
    const key = `${surface}|${lang}`;
    if (lastSurface.current === key) return;
    lastSurface.current = key;
    logVisit(surface, lang);
  }, [surface, lang, enabled]);
}
