"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ui = {
  title: { en: "Ask", fil: "Magtanong", zh: "提問" },
  hint: {
    en: "Ask about schedule, meals, or rules. On WhatsApp start with ?",
    fil: "Magtanong tungkol sa schedule, meals, o rules. Sa WhatsApp, magsimula ng ?",
    zh: "可問時間表、餐單或守則。WhatsApp 請以 ? 開頭。",
  },
  placeholder: {
    en: "e.g. What time pick up Zizi?",
    fil: "hal. Anong oras sunduin si Zizi?",
    zh: "例如：幾點接 Zizi？",
  },
  send: { en: "Ask", fil: "Itanong", zh: "提問" },
  thinking: { en: "Looking up…", fil: "Hinahanap…", zh: "查詢中…" },
  examples: {
    en: ["Tonight dinner?", "How to use Dyson V12?", "Philips water?", "No borrowing money rule?"],
    fil: ["Hapunan ngayong gabi?", "Paano gamitin ang Dyson V12?", "Paano ang Philips water?", "Bawal humiram ng pera?"],
    zh: ["今晚晚餐？", "Dyson V12 怎麼用？", "Philips 飲水機？", "不准借錢的守則？"],
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
    <div className="space-y-3">
      <div className="rounded-xl bg-stone-100 px-3 py-2.5 ring-1 ring-stone-200">
        <h2 className="text-sm font-bold text-stone-900">{ui.title[lang]}</h2>
        <p className="mt-0.5 text-xs text-stone-600">{ui.hint[lang]}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ui.examples[lang].map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => ask(ex)}
            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200"
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
