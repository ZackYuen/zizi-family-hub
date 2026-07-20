"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("household-lang") as Lang | null;
    if (saved === "en" || saved === "fil") setLangState(saved);
    setMounted(true);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem("household-lang", next);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-stone-50" />;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
