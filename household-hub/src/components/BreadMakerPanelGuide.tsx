"use client";

import type { Lang } from "@/lib/types";

/** Numbered Traditional Chinese panel map for Panasonic SD-PT1002 — inline so it never 404s. */
export function BreadMakerPanelGuide({ lang }: { lang: Lang }) {
  const caption =
    lang === "zh"
      ? "面板示意（數字對應按鈕）"
      : lang === "fil"
        ? "Panel guide (numero = button)"
        : "Panel guide (numbers = buttons)";

  return (
    <figure className="mb-3 overflow-hidden rounded-lg ring-1 ring-stone-200">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 420"
        className="h-auto w-full bg-stone-100"
        role="img"
        aria-label={
          lang === "zh"
            ? "Panasonic 麵包機面板按鈕編號"
            : "Panasonic bread maker panel button numbers"
        }
      >
        <rect width="640" height="420" fill="#f5f5f4" />
        <rect
          x="40"
          y="28"
          width="560"
          height="364"
          rx="24"
          fill="#e7e5e4"
          stroke="#a8a29e"
          strokeWidth="2"
        />
        <text
          x="320"
          y="58"
          textAnchor="middle"
          fontFamily="system-ui,sans-serif"
          fontSize="18"
          fontWeight="700"
          fill="#1c1917"
        >
          Panasonic SD-PT1002 · Panel
        </text>

        <rect x="180" y="78" width="280" height="70" rx="10" fill="#111827" />
        <text
          x="320"
          y="108"
          textAnchor="middle"
          fontFamily="ui-monospace,monospace"
          fontSize="22"
          fill="#86efac"
        >
          MENU 01
        </text>
        <text
          x="320"
          y="132"
          textAnchor="middle"
          fontFamily="ui-monospace,monospace"
          fontSize="14"
          fill="#a7f3d0"
        >
          4:00
        </text>

        <g fontFamily="system-ui,sans-serif" textAnchor="middle">
          <rect
            x="70"
            y="190"
            width="110"
            height="70"
            rx="12"
            fill="#fff"
            stroke="#78716c"
            strokeWidth="2"
          />
          <text x="125" y="218" fontSize="14" fontWeight="700" fill="#0f766e">
            1 Menu
          </text>
          <text x="125" y="240" fontSize="12" fill="#44403c">
            ▲ ▼
          </text>

          <rect
            x="200"
            y="190"
            width="110"
            height="70"
            rx="12"
            fill="#fff"
            stroke="#78716c"
            strokeWidth="2"
          />
          <text x="255" y="218" fontSize="14" fontWeight="700" fill="#0f766e">
            2 Size
          </text>
          <text x="255" y="240" fontSize="12" fill="#44403c">
            loaf
          </text>

          <rect
            x="330"
            y="190"
            width="110"
            height="70"
            rx="12"
            fill="#fff"
            stroke="#78716c"
            strokeWidth="2"
          />
          <text x="385" y="218" fontSize="14" fontWeight="700" fill="#0f766e">
            3 Crust
          </text>
          <text x="385" y="240" fontSize="12" fill="#44403c">
            light–dark
          </text>

          <rect
            x="460"
            y="190"
            width="110"
            height="70"
            rx="12"
            fill="#fff"
            stroke="#78716c"
            strokeWidth="2"
          />
          <text x="515" y="218" fontSize="14" fontWeight="700" fill="#0f766e">
            4 Timer
          </text>
          <text x="515" y="240" fontSize="12" fill="#44403c">
            delay
          </text>

          <rect
            x="160"
            y="290"
            width="140"
            height="64"
            rx="32"
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="2"
          />
          <text x="230" y="318" fontSize="16" fontWeight="700" fill="#fff">
            5 Start
          </text>
          <text x="230" y="338" fontSize="12" fill="#dcfce7">
            begin
          </text>

          <rect
            x="340"
            y="290"
            width="140"
            height="64"
            rx="32"
            fill="#b91c1c"
            stroke="#7f1d1d"
            strokeWidth="2"
          />
          <text x="410" y="318" fontSize="16" fontWeight="700" fill="#fff">
            6 Stop
          </text>
          <text x="410" y="338" fontSize="12" fill="#fee2e2">
            cancel
          </text>
        </g>

        <text
          x="320"
          y="375"
          textAnchor="middle"
          fontFamily="system-ui,sans-serif"
          fontSize="12"
          fill="#57534e"
        >
          1→2→3→(4)→5 Start · done: 6 Stop
        </text>
      </svg>
      <figcaption className="bg-white px-2 py-1.5 text-[11px] text-stone-500">
        {caption}
      </figcaption>
    </figure>
  );
}
