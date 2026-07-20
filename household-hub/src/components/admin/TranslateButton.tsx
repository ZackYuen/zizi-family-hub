"use client";

import { useState } from "react";
import type { Lang } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";

interface Props {
  sourceText: string;
  onTranslated: (text: string) => void;
  lang: Lang;
  compact?: boolean;
}

export function TranslateButton({ sourceText, onTranslated, lang, compact }: Props) {
  const [loading, setLoading] = useState(false);

  const translate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      if (res.ok) {
        const { translation } = await res.json();
        onTranslated(translation);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={translate}
      disabled={loading || !sourceText.trim()}
      title={adminT("translateToFil", lang)}
      className={`shrink-0 rounded-lg bg-amber-50 font-medium text-amber-800 ring-1 ring-amber-200 disabled:opacity-40 ${
        compact ? "px-2 py-1 text-[10px]" : "px-2 py-2 text-xs"
      }`}
    >
      {loading ? "…" : "FIL"}
    </button>
  );
}
