"use client";

import { useState } from "react";
import type { AppContent, FrontendVisitSurface } from "@/lib/types";
import { LanguageToggle } from "./LanguageToggle";
import { BottomNav, type TabId } from "./BottomNav";
import { ScheduleView } from "./ScheduleView";
import { MealsView } from "./MealsView";
import { AskView } from "./AskView";
import { HkLifeView } from "./HkLifeView";
import { HelperHowtoView } from "./HelperHowtoView";
import {
  AppliancesView,
  RulesAndPreferencesView,
} from "./HouseGuidesViews";
import { LiveClock } from "./LiveClock";
import { WeatherBanner } from "./WeatherBanner";
import { WelcomeGreeting } from "./WelcomeGreeting";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemberDisplayName } from "@/contexts/FrontendUserContext";
import { useFrontendVisitLog } from "@/hooks/useFrontendVisitLog";
import { labels, uiLocale } from "@/lib/i18n";

export function HomeApp({ content }: { content: AppContent }) {
  const { lang } = useLanguage();
  const memberName = useMemberDisplayName(content.helperName);
  const [activeTab, setActiveTab] = useState<TabId>("schedule");
  const [showHowto, setShowHowto] = useState(false);

  const visitSurface: FrontendVisitSurface = showHowto ? "howto" : activeTab;
  useFrontendVisitLog({ surface: visitSurface });

  const updated = new Date(content.lastUpdated).toLocaleDateString(uiLocale(lang), {
    month: "short",
    day: "numeric",
  });
  const lastUpdatedLabel = `${labels.lastUpdated[lang]} · ${updated}`;
  const helpLabel =
    lang === "fil" ? "Tulong" : lang === "zh" ? "使用說明" : "How to use";

  return (
    <div
      className="min-h-screen bg-stone-50"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-start justify-between gap-3 px-4 py-2.5">
          <WelcomeGreeting
            name={memberName}
            lastUpdatedLabel={lastUpdatedLabel}
          />
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowHowto(true)}
              aria-label={helpLabel}
              title={helpLabel}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-1 transition ${
                showHowto
                  ? "bg-teal-600 text-white ring-teal-600"
                  : "bg-white text-teal-800 ring-teal-200"
              }`}
            >
              ?
            </button>
            <LanguageToggle />
          </div>
        </div>
        {!showHowto && (
          <>
            <LiveClock />
            <WeatherBanner adminAlert={content.hkWeather} />
          </>
        )}
      </header>

      <main className="mx-auto max-w-lg px-4 py-3">
        {showHowto ? (
          <HelperHowtoView
            helperNameFallback={content.helperName}
            onClose={() => setShowHowto(false)}
          />
        ) : (
          <>
            {activeTab === "rules" && (
              <RulesAndPreferencesView
                rules={content.groundRules}
                preferences={content.familyPreferences}
              />
            )}
            {activeTab === "schedule" && (
              <ScheduleView
                content={content}
                monthlyTasks={content.monthlyTasks}
              />
            )}
            {activeTab === "meals" && <MealsView />}
            {activeTab === "tools" && (
              <AppliancesView appliances={content.appliances ?? []} />
            )}
            {activeTab === "ask" && <AskView />}
            {activeTab === "hkLife" && <HkLifeView content={content} />}
          </>
        )}
      </main>

      {!showHowto && (
        <BottomNav active={activeTab} onChange={setActiveTab} />
      )}
    </div>
  );
}
