"use client";

import { useState } from "react";
import type { Lang } from "@/lib/types";

const TARGET_LABELS: Record<Lang, string> = {
  en: "EN",
  zh: "繁",
  fil: "FIL",
};

interface Props {
  sourceText: string;
  sourceLang: Lang;
  onTranslated: (target: Lang, text: string) => void;
  compact?: boolean;
}

export function TranslateButtons({
  sourceText,
  sourceLang,
  onTranslated,
  compact,
}: Props) {
  const [loading, setLoading] = useState<Lang | null>(null);
  const targets = (["en", "fil", "zh"] as Lang[]).filter((l) => l !== sourceLang);

  const translate = async (target: Lang) => {
    if (!sourceText.trim()) return;
    setLoading(target);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, from: sourceLang, to: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(
          data.error ||
            "Translation failed. MyMemory may be over quota — try EN→FIL, or add OPENROUTER_API_KEY on Vercel."
        );
        return;
      }
      const translation = (data.translation as string | undefined)?.trim() || "";
      if (!translation || /@|email\s*:|sportbenzin/i.test(translation)) {
        alert("Bad translation blocked (spam). Not applied.");
        return;
      }
      onTranslated(target, translation);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      {targets.map((target) => (
        <button
          key={target}
          type="button"
          onClick={() => translate(target)}
          disabled={loading !== null || !sourceText.trim()}
          title={`→ ${TARGET_LABELS[target]}`}
          className={`rounded-lg bg-amber-50 font-medium text-amber-800 ring-1 ring-amber-200 disabled:opacity-40 ${
            compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
          }`}
        >
          {loading === target ? "…" : `→${TARGET_LABELS[target]}`}
        </button>
      ))}
    </div>
  );
}
