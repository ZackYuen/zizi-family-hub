"use client";

import { useState } from "react";
import type { AppContent } from "@/lib/types";
import { LanguageToggle } from "./LanguageToggle";
import { BottomNav, type TabId } from "./BottomNav";
import { GroundRulesView } from "./GroundRulesView";
import { ScheduleView } from "./ScheduleView";
import { MealsView } from "./MealsView";
import { useLanguage } from "@/contexts/LanguageContext";
import { labels } from "@/lib/i18n";

export function HomeApp({ content }: { content: AppContent }) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("rules");

  const updated = new Date(content.lastUpdated).toLocaleDateString(
    lang === "fil" ? "fil-PH" : "en-HK",
    { weekday: "short", year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-stone-50 pb-24">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-stone-900">
              {labels.appTitle[lang]}
            </h1>
            <p className="text-xs text-stone-500">
              {labels.welcome[lang]}, {content.helperName} · {labels.forHelper[lang]}
            </p>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {activeTab === "rules" && <GroundRulesView rules={content.groundRules} />}
        {activeTab === "schedule" && (
          <ScheduleView
            schedule={content.weeklySchedule}
            ziziSchool={content.ziziSchool}
            monthlyTasks={content.monthlyTasks}
          />
        )}
        {activeTab === "meals" && <MealsView />}
      </main>

      <footer className="fixed bottom-16 left-0 right-0 text-center">
        <p className="text-[10px] text-stone-400">
          {labels.lastUpdated[lang]}: {updated}
        </p>
      </footer>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
