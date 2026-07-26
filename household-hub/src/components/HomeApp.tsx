"use client";

import { useState } from "react";
import type { AppContent } from "@/lib/types";
import { LanguageToggle } from "./LanguageToggle";
import { BottomNav, type TabId } from "./BottomNav";
import { ScheduleView } from "./ScheduleView";
import { MealsView } from "./MealsView";
import { AskView } from "./AskView";
import { HkLifeView } from "./HkLifeView";
import {
  AppliancesView,
  RulesAndPreferencesView,
} from "./HouseGuidesViews";
import { LiveClock } from "./LiveClock";
import { WeatherBanner } from "./WeatherBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { labels, uiLocale } from "@/lib/i18n";

export function HomeApp({ content }: { content: AppContent }) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("schedule");

  const updated = new Date(content.lastUpdated).toLocaleDateString(uiLocale(lang), {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-stone-900">
              {labels.appTitle[lang]}
            </h1>
            <p className="truncate text-[11px] text-stone-500">
              {content.helperName}
              <span className="text-stone-300"> · </span>
              {labels.lastUpdated[lang]} {updated}
            </p>
          </div>
          <LanguageToggle />
        </div>
        <LiveClock />
        <WeatherBanner adminAlert={content.hkWeather} />
      </header>

      <main className="mx-auto max-w-lg px-4 py-3">
        {activeTab === "rules" && (
          <RulesAndPreferencesView
            rules={content.groundRules}
            preferences={content.familyPreferences}
          />
        )}
        {activeTab === "schedule" && (
          <ScheduleView content={content} monthlyTasks={content.monthlyTasks} />
        )}
        {activeTab === "meals" && <MealsView />}
        {activeTab === "tools" && (
          <AppliancesView appliances={content.appliances ?? []} />
        )}
        {activeTab === "ask" && <AskView />}
        {activeTab === "hkLife" && <HkLifeView content={content} />}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
