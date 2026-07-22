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
import { useLanguage } from "@/contexts/LanguageContext";
import { labels, uiLocale } from "@/lib/i18n";
import { localized } from "@/lib/localized-text";

export function HomeApp({ content }: { content: AppContent }) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>("schedule");

  const updated = new Date(content.lastUpdated).toLocaleDateString(
    uiLocale(lang),
    { weekday: "short", year: "numeric", month: "short", day: "numeric" }
  );

  const weather = content.hkWeather;
  const weatherOn = Boolean(weather?.alertActive);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-stone-50 pb-24">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-stone-900">
              {labels.appTitle[lang]}
            </h1>
            <p className="text-xs text-stone-500">
              {labels.welcome[lang]}, {content.helperName} · {labels.familyMember[lang]}
            </p>
          </div>
          <LanguageToggle />
        </div>
        <LiveClock />
        {weatherOn && weather && (
          <div className="border-t border-sky-200 bg-sky-100 px-4 py-2">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-sky-950">
              {labels.weatherAlert[lang]}
              {weather.level !== "none" ? ` · ${weather.level}` : ""}
            </p>
            <p className="mt-0.5 text-center text-sm text-sky-900">
              {localized(weather.note, lang)}
            </p>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {content.familyWelcome && (
          <p className="mb-4 rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-relaxed text-teal-950 ring-1 ring-teal-100">
            {localized(content.familyWelcome, lang)}
          </p>
        )}
        {activeTab === "rules" && (
          <RulesAndPreferencesView
            rules={content.groundRules}
            preferences={content.familyPreferences}
          />
        )}
        {activeTab === "schedule" && (
          <ScheduleView
            schedule={content.weeklySchedule}
            ziziSchool={content.ziziSchool}
            monthlyTasks={content.monthlyTasks}
          />
        )}
        {activeTab === "meals" && <MealsView />}
        {activeTab === "tools" && (
          <AppliancesView appliances={content.appliances ?? []} />
        )}
        {activeTab === "ask" && <AskView />}
        {activeTab === "hkLife" && <HkLifeView content={content} />}
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
