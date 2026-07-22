"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { labels } from "@/lib/i18n";

export type TabId =
  | "rules"
  | "schedule"
  | "meals"
  | "tools"
  | "ask"
  | "hkLife";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: {
  id: TabId;
  icon: string;
  labelKey: "groundRules" | "schedule" | "meals" | "tools" | "ask" | "hkLife";
}[] = [
  { id: "schedule", icon: "🕐", labelKey: "schedule" },
  { id: "meals", icon: "🍽️", labelKey: "meals" },
  { id: "tools", icon: "🔌", labelKey: "tools" },
  { id: "ask", icon: "💬", labelKey: "ask" },
  { id: "hkLife", icon: "🌏", labelKey: "hkLife" },
  { id: "rules", icon: "📋", labelKey: "groundRules" },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  const { lang } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 transition ${
                isActive ? "text-teal-700" : "text-stone-500"
              }`}
            >
              <span className="text-lg leading-none sm:text-xl">{tab.icon}</span>
              <span
                className={`max-w-full truncate text-[9px] font-medium leading-tight sm:text-[10px] ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                {labels[tab.labelKey][lang]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
