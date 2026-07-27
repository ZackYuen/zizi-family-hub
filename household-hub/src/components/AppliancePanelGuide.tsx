"use client";

import type { AppliancePanelButton, Lang } from "@/lib/types";

const caption = {
  en: "Panel guide (numbers = buttons)",
  fil: "Panel guide (numero = button)",
  zh: "面板示意（數字對應按鈕）",
} as const;

/**
 * Inline numbered control map — never depends on an external image URL
 * (avoids broken images on alternate Vercel domains / CDN misses).
 */
export function AppliancePanelGuide({
  lang,
  title,
  buttons,
}: {
  lang: Lang;
  title: string;
  buttons: AppliancePanelButton[];
}) {
  if (!buttons.length) return null;

  return (
    <figure className="mb-3 overflow-hidden rounded-lg ring-1 ring-stone-200">
      <div className="bg-stone-100 px-3 pt-3 pb-2">
        <p className="mb-2 text-center text-xs font-bold text-stone-800">
          {title} · Panel
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {buttons.map((b) => {
            const label =
              lang === "zh" ? b.zh || b.en : lang === "fil" ? b.fil || b.en : b.en;
            const hint =
              lang === "zh"
                ? b.hintZh || b.hintEn
                : lang === "fil"
                  ? b.hintFil || b.hintEn
                  : b.hintEn;
            return (
              <div
                key={b.n}
                className="rounded-xl bg-white px-2.5 py-2.5 ring-1 ring-stone-300"
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    {b.n}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-stone-900">
                      {label}
                    </p>
                    {hint ? (
                      <p className="mt-0.5 text-[11px] leading-snug text-stone-500">
                        {hint}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <figcaption className="bg-white px-2 py-1.5 text-[11px] text-stone-500">
        {caption[lang]}
      </figcaption>
    </figure>
  );
}
