"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ui = {
  title: { en: "Ask", fil: "Magtanong", zh: "提問" },
  hint: {
    en: "Quick answers from the family hub (schedule, meals, rules). Start WhatsApp questions with ?",
    fil: "Mabilis na sagot mula sa family hub (iskedyul, pagkain, rules). Sa WhatsApp, magsimula ng ?",
    zh: "根據家庭資料快速回答（時間表、餐單、守則）。WhatsApp 請以 ? 開頭。",
  },
  placeholder: {
    en: "e.g. What time pick up Zizi?",
    fil: "hal. Anong oras sunduin si Zizi?",
    zh: "例如：幾點接 Zizi？",
  },
  send: { en: "Ask", fil: "Itanong", zh: "提問" },
  thinking: { en: "Looking up…", fil: "Hinahanap…", zh: "查詢中…" },
  examples: {
    en: ["Tonight dinner?", "How to use air fryer?", "錢大媽 meat?", "No borrowing money rule?"],
    fil: ["Hapunan ngayong gabi?", "Paano gamitin ang air fryer?", "Bawal ba sa 錢大媽?", "Bawal humiram ng pera?"],
    zh: ["今晚晚餐？", "氣炸鍋怎麼用？", "可以去錢大媽買肉嗎？", "不准借錢的守則？"],
  },
};

export function AskView() {
  const { lang } = useLanguage();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [meta, setMeta] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text) return;
    setQuestion(text);
    setLoading(true);
    setAnswer("");
    setMeta("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnswer(data.error || "Failed");
        return;
      }
      setAnswer(data.answer);
      setMeta(
        data.lastUpdated
          ? `Updated ${String(data.lastUpdated).slice(0, 10)}`
          : ""
      );
    } catch {
      setAnswer("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 p-4 text-white shadow-md">
        <h2 className="text-lg font-bold">{ui.title[lang]}</h2>
        <p className="mt-1 text-xs opacity-80">{ui.hint[lang]}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ui.examples[lang].map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => ask(ex)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200"
          >
            {ex}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={ui.placeholder[lang]}
          className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "…" : ui.send[lang]}
        </button>
      </form>

      {loading && (
        <p className="text-sm text-stone-500">{ui.thinking[lang]}</p>
      )}

      {answer && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
            {answer}
          </p>
          {meta && <p className="mt-3 text-[10px] text-stone-400">{meta}</p>}
        </div>
      )}
    </div>
  );
}
