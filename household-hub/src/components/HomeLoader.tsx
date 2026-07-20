"use client";

import { useEffect, useState } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { HomeApp } from "@/components/HomeApp";
import { fetchContent } from "@/lib/data-client";
import type { AppContent } from "@/lib/types";

export function HomeLoader() {
  const [content, setContent] = useState<AppContent | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchContent()
      .then(setContent)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-stone-600">
        <p>Could not load app data. Please refresh the page.</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-teal-50">
        <p className="text-sm text-stone-500">Loading...</p>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <HomeApp content={content} />
    </LanguageProvider>
  );
}
