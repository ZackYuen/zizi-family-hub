"use client";

import type { BilingualText, Lang } from "@/lib/types";
import { TranslateButtons } from "./TranslateButtons";

const ROWS: { key: Lang; label: string; placeholder: string }[] = [
  { key: "en", label: "EN", placeholder: "English" },
  { key: "zh", label: "繁中", placeholder: "繁體中文" },
  { key: "fil", label: "FIL", placeholder: "Filipino" },
];

interface Props {
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  multiline?: boolean;
}

export function TrilingualFieldEditor({ value, onChange, multiline }: Props) {
  const setField = (lang: Lang, text: string) => {
    onChange({ ...value, [lang]: text });
  };

  return (
    <div className="space-y-2">
      {ROWS.map(({ key, label, placeholder }) => {
        const fieldValue = value[key] ?? "";
        const Input = multiline ? "textarea" : "input";
        return (
          <div key={key} className="flex gap-1">
            <span className="w-9 shrink-0 pt-2 text-[10px] font-bold text-stone-400">
              {label}
            </span>
            <Input
              value={fieldValue}
              onChange={(e) => setField(key, e.target.value)}
              placeholder={placeholder}
              {...(multiline ? { rows: 2 } : {})}
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <TranslateButtons
              sourceText={fieldValue}
              sourceLang={key}
              onTranslated={(target, text) => setField(target, text)}
            />
          </div>
        );
      })}
    </div>
  );
}
