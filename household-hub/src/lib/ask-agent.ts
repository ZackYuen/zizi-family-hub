import {
  buildLiveSnapshot,
  snapshotToKnowledgeText,
  type LiveFamilySnapshot,
} from "./family-knowledge";
import { getHongKongTimeParts } from "./i18n";
import { localized } from "./localized-text";
import {
  getTaskEndTime,
  getTaskStartTime,
  isTaskActiveNow,
  parseTimeToMinutes,
  sortTasksByTime,
} from "./schedule-utils";
import type { Lang, ScheduleTask } from "./types";

export interface AskResult {
  answer: string;
  source: "live-web" | "live-web+ai" | "live-web+internet";
  usedInternet: boolean;
  dataSource: LiveFamilySnapshot["source"];
  lastUpdated: string;
}

function detectLang(q: string): Lang {
  if (/[\u4e00-\u9fff]/.test(q)) return "zh";
  // Filipino / Tagalog cues (include common conjugated forms)
  if (
    /\b(ano|anong|saan|kailan|paano|naman|salamat|ngayon|ngayong|hapunan|alituntunin|gawain|gagawin|kakainin|kakain|kain|magkain|oras|sundo|tanghalian|ulam|gabi|po|ba)\b/i.test(
      q
    )
  )
    return "fil";
  return "en";
}

const LANG_OVERRIDE_RE =
  /\b((?:please\s+)?(?:reply|answer|respond|speak|write|use)(?:\s+in|\s+with)?|in|into)\s+(filipino|tagalog|chinese|mandarin|cantonese|english)\b/i;

/** Explicit "reply with Filipino / 用中文" overrides question script */
function resolveReplyLang(question: string): { lang: Lang; contentQuestion: string } {
  const q = question.trim();
  let lang: Lang | null = null;

  const m = q.match(LANG_OVERRIDE_RE);
  if (m) {
    const target = m[2].toLowerCase();
    if (target === "filipino" || target === "tagalog") lang = "fil";
    else if (target === "chinese" || target === "mandarin" || target === "cantonese")
      lang = "zh";
    else if (target === "english") lang = "en";
  } else if (/\b(filipino|tagalog)\s*(pls|please)?\s*$/i.test(q)) {
    lang = "fil";
  } else if (/用菲律賓|用他加祿|菲律賓文|用菲語|菲文/.test(q)) {
    lang = "fil";
  } else if (/用中文|繁體|簡體|请用中文|請用中文|中文回|廣東話|粤语|粵語/.test(q)) {
    lang = "zh";
  } else if (/用英文|英語回|in english\s*(pls|please)?/i.test(q)) {
    lang = "en";
  }

  const contentQuestion = q
    .replace(LANG_OVERRIDE_RE, " ")
    .replace(/\b(filipino|tagalog|chinese|english)\s*(pls|please)?\s*$/gi, " ")
    .replace(/用(菲律賓文?|他加祿|菲語|菲文|中文|繁體|簡體|英文|英語|廣東話)/g, " ")
    .replace(/请用中文|請用中文|中文回[複复]?|英語回[複复]?/g, " ")
    .replace(/[,，]+\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    lang: lang ?? detectLang(contentQuestion || q),
    contentQuestion: contentQuestion || q,
  };
}

function langName(lang: Lang): string {
  return lang === "fil" ? "Filipino (Tagalog)" : lang === "zh" ? "Traditional Chinese" : "English";
}

function dishName(
  d: { name: string; nameEn?: string; nameFil?: string },
  lang: Lang
): string {
  const zh = d.name?.trim() || "";
  const en = d.nameEn?.trim() || "";
  const fil = d.nameFil?.trim() || "";
  // Skip known-bad machine translations in nameFil
  const filOk =
    fil &&
    !/shade|pampublikong|deformities|orchid|sportbenzin|ratio of garlic/i.test(fil) &&
    fil.toLowerCase() !== "ulam na gulay";

  if (lang === "fil") {
    if (filOk) return en && en !== fil ? `${fil} (${en})` : fil;
    return en || zh || fil;
  }
  if (lang === "zh") return zh || en || fil;
  return en || zh || fil;
}

function ingredientName(
  ing: { en?: string; fil?: string; zh?: string },
  lang: Lang
): string {
  if (lang === "fil") return ing.fil || ing.en || ing.zh || "";
  if (lang === "zh") return ing.zh || ing.en || ing.fil || "";
  return ing.en || ing.fil || ing.zh || "";
}

function taskLabel(task: ScheduleTask, lang: Lang): string {
  const start = getTaskStartTime(task);
  const end = getTaskEndTime(task);
  const range = task.fullDay
    ? lang === "fil"
      ? "Buong araw"
      : lang === "zh"
        ? "全日"
        : "All day"
    : end && end !== start
      ? `${start}–${end}`
      : start;
  return `${range} — ${localized(task.task, lang)}`;
}

/** Exact current / next task from today's HK schedule */
function currentTaskAnswer(snap: LiveFamilySnapshot, lang: Lang): string | null {
  if (!snap.todaySchedule?.tasks?.length) return null;
  if (snap.isHelperDayOffToday) {
    return lang === "fil"
      ? "Day off ni Charlene ngayon — walang work schedule."
      : lang === "zh"
        ? "今天是 Charlene 放假 — 沒有工作時間表。"
        : "Charlene day off today — no work schedule.";
  }

  const { minutesSinceMidnight } = getHongKongTimeParts();
  const timeOnly = snap.nowHongKong.match(/\d{2}:\d{2}/)?.[0] ?? "";
  const sorted = sortTasksByTime(snap.todaySchedule.tasks).filter((t) => !t.fullDay);

  const active = sorted.find((t) => isTaskActiveNow(t, minutesSinceMidnight));
  if (active) {
    if (lang === "fil") {
      return `Ngayon (${timeOnly} HKT):\n▶ ${taskLabel(active, lang)}\n\nIto ang current task.`;
    }
    if (lang === "zh") {
      return `現在（${timeOnly} HKT）：\n▶ ${taskLabel(active, lang)}\n\n這是目前要做的事。`;
    }
    return `Now (${timeOnly} HKT):\n▶ ${taskLabel(active, lang)}\n\nThis is the current task.`;
  }

  const next = sorted.find(
    (t) => parseTimeToMinutes(getTaskStartTime(t)) > minutesSinceMidnight
  );
  const prev = [...sorted]
    .reverse()
    .find((t) => {
      const end = getTaskEndTime(t);
      const endMin = end
        ? parseTimeToMinutes(end)
        : parseTimeToMinutes(getTaskStartTime(t)) + 30;
      return endMin <= minutesSinceMidnight;
    });

  if (next) {
    const nextStart = getTaskStartTime(next);
    if (lang === "fil") {
      return [
        `Ngayon (${timeOnly} HKT): walang ongoing task (gap).`,
        prev ? `Tapos na: ${taskLabel(prev, lang)}` : null,
        `Susunod (${nextStart}):\n▶ ${taskLabel(next, lang)}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (lang === "zh") {
      return [
        `現在（${timeOnly} HKT）：暫無進行中的工作（空檔）。`,
        prev ? `剛完成：${taskLabel(prev, lang)}` : null,
        `下一項（${nextStart}）：\n▶ ${taskLabel(next, lang)}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    return [
      `Now (${timeOnly} HKT): no task in progress (gap).`,
      prev ? `Just finished: ${taskLabel(prev, lang)}` : null,
      `Next (at ${nextStart}):\n▶ ${taskLabel(next, lang)}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (prev) {
    return lang === "fil"
      ? `Ngayon (${timeOnly} HKT): tapos na ang schedule ngayong araw.\nHuli: ${taskLabel(prev, lang)}`
      : lang === "zh"
        ? `現在（${timeOnly} HKT）：今天的時間表已完成。\n最後一項：${taskLabel(prev, lang)}`
        : `Now (${timeOnly} HKT): today's schedule is finished.\nLast task: ${taskLabel(prev, lang)}`;
  }

  return null;
}

function heuristicAnswer(
  question: string,
  snap: LiveFamilySnapshot,
  lang: Lang
): string | null {
  const q = question.toLowerCase();

  // Language-only request: "in Filipino pls" (keep Unicode letters — \W strips CJK!)
  const hasContent = /[\p{L}\p{N}]/u.test(q);
  if (
    !hasContent ||
    /^(please|pls|po|lang)?$/i.test(q.trim()) ||
    /^(in\s+)?(filipino|tagalog|chinese|english)\s*(pls|please)?$/i.test(q.trim())
  ) {
    if (lang === "fil") return "Sige — itanong mo na (hal. Ano ang gagawin ko ngayon?).";
    if (lang === "zh") return "好的 — 請直接提問（例如：我現在該做什麼？）。";
    return "OK — please ask your question (e.g. What should I do now?).";
  }

  if (
    /what time|current time|time now|now time|幾點|现在几|現在幾|anong oras|oras na|what'?s the time/.test(
      q
    ) &&
    !/what should|gawain|task|do now|做什麼|做什么/.test(q)
  ) {
    const timeOnly = snap.nowHongKong.match(/\d{2}:\d{2}/)?.[0] ?? snap.nowHongKong;
    if (lang === "fil") return `Ngayon sa Hong Kong: ${timeOnly} (HKT).`;
    if (lang === "zh") return `香港現在時間：${timeOnly}（HKT）。`;
    return `Hong Kong time now: ${timeOnly} (HKT).`;
  }

  // "what should I do now?" → exact current / next task (not full day list)
  if (
    /what should i do|do now|current task|now task|ano.*gawain|ano.*gagawin|susunod na gawain|現在(要?做|該做)|此刻|該做什麼|该做什么/.test(
      q
    ) ||
    /\bwhat('s| is) next\b/.test(q) ||
    (/\bnow\b/.test(q) && /task|do|gawain|做/.test(q))
  ) {
    return currentTaskAnswer(snap, lang);
  }

  if (
    /day off|holiday|勞工|星期日|linggo|sunday|bakasyon|dayoff/.test(q) &&
    /today|ngayon|今天|charlene|helper|假/.test(q)
  ) {
    if (snap.isHelperDayOffToday) {
      return lang === "fil"
        ? "Oo — ngayon ay day off ni Charlene (Linggo o HK public holiday / 勞工假)."
        : lang === "zh"
          ? "是 — 今天是 Charlene 放假（星期日或香港公眾假期／勞工假）。"
          : "Yes — today is Charlene day off (Sunday or HK public holiday / 勞工假).";
    }
    return lang === "fil"
      ? "Hindi — Charlene ay may trabaho ngayon. Sundin ang schedule ngayong araw."
      : lang === "zh"
        ? "否 — Charlene 今天要上班，請跟今日時間表。"
        : "No — Charlene works today. Follow today's schedule.";
  }

  if (
    /tonight|dinner|hapunan|今晚|晚餐|menu|ulam|kakainin|kakain|magkain|kain.*(gabi|hapunan)|食乜|食咩|今晚食/.test(
      q
    )
  ) {
    if (!snap.tonight) {
      return lang === "fil"
        ? "Wala pang dinner menu ngayon."
        : lang === "zh"
          ? "今晚尚未有晚餐菜單。"
          : "No dinner menu available yet.";
    }
    const { meat, vegetable, soup } = snap.tonight;
    const cat =
      lang === "fil"
        ? { Meat: "Karne", Vegetable: "Gulay", Soup: "Sabaw" }
        : lang === "zh"
          ? { Meat: "肉類", Vegetable: "蔬菜", Soup: "湯" }
          : { Meat: "Meat", Vegetable: "Vegetable", Soup: "Soup" };
    const line = (d: typeof meat) =>
      `${cat[d.category]}: ${dishName(d, lang)}`;
    return [
      lang === "fil" ? "Hapunan ngayong gabi:" : lang === "zh" ? "今晚晚餐：" : "Tonight's dinner:",
      `• ${line(meat)}`,
      `• ${line(vegetable)}`,
      `• ${line(soup)}`,
      lang === "fil"
        ? "Buksan ang Meals tab para sa ingredients."
        : lang === "zh"
          ? "可在 Meals 分頁查看材料。"
          : "Open the Meals tab for ingredients.",
    ].join("\n");
  }

  if (/ingredient|bilihin|shopping|買|材料|grocery|sangkap/.test(q)) {
    if (!snap.tonight) return null;
    const lines: string[] = [
      lang === "fil"
        ? "Ingredients ngayong gabi:"
        : lang === "zh"
          ? "今晚材料："
          : "Tonight's ingredients:",
    ];
    for (const dish of [snap.tonight.meat, snap.tonight.vegetable, snap.tonight.soup]) {
      lines.push(`• ${dishName(dish, lang)}`);
      if (dish.ingredients?.length) {
        for (const ing of dish.ingredients) {
          const name = ingredientName(ing, lang);
          lines.push(`  - ${ing.qty ? `${name} (${ing.qty})` : name}`);
        }
      } else {
        lines.push(
          lang === "fil"
            ? `  - (wala pa — tingnan: ${dish.link})`
            : lang === "zh"
              ? `  - （未列出 — 見食譜：${dish.link}）`
              : `  - (not listed — see recipe: ${dish.link})`
        );
      }
    }
    return lines.join("\n");
  }

  if (/pick ?up|sundo|接|16:30|1630|school|kindergarten|eskwela/.test(q)) {
    return lang === "fil"
      ? "Zizi: Mon–Fri PM class. Umalis sa bahay 12:30 (30 min lakad) — drop-off bago 13:00. Umalis 16:00 para sunduin si Zizi ng 16:30."
      : lang === "zh"
        ? "Zizi：星期一至五下午班。12:30 出門（步行約 30 分鐘），13:00 前送到。16:00 出門，16:30 接 Zizi。"
        : "Zizi: Mon–Fri PM class. Leave home 12:30 (30 min walk) — drop off by 13:00. Leave 16:00 to pick up Zizi at 16:30.";
  }

  if (/rule|alituntunin|規則|ground|broken|borrow|pera|money|hiram/.test(q)) {
    const money = snap.groundRules.find((r) =>
      r.title.en.toLowerCase().includes("borrow")
    );
    if (money && /borrow|pera|money|hiram|借錢|借钱/.test(q)) {
      return [
        localized(money.title, lang),
        localized(money.description, lang),
        lang === "fil"
          ? `Kung labag: ${localized(money.consequences, lang)}`
          : lang === "zh"
            ? `若違反：${localized(money.consequences, lang)}`
            : `If Broken: ${localized(money.consequences, lang)}`,
      ].join("\n");
    }
    const titles = snap.groundRules
      .map((r, i) => `${i + 1}. ${localized(r.title, lang)}`)
      .join("\n");
    return lang === "fil"
      ? `Mga ground rules:\n${titles}\n\nTanungin ang specific rule, o buksan ang Ground Rules tab.`
      : lang === "zh"
        ? `守則：\n${titles}\n\n可問某一條，或打開 Ground Rules 分頁。`
        : `Ground rules:\n${titles}\n\nAsk about a specific rule, or open the Ground Rules tab.`;
  }

  // Full day list only when explicitly asking for schedule overview
  if (
    /full schedule|whole (day )?schedule|today'?s schedule|iskedyul|時間表|buong (araw )?na schedule/.test(
      q
    ) ||
    (/^schedule\??$/.test(q.trim()) || (/\bschedule\b/.test(q) && !/\bnow\b/.test(q)))
  ) {
    if (!snap.todaySchedule) return null;
    const tasks = sortTasksByTime(snap.todaySchedule.tasks)
      .map((t) => `• ${taskLabel(t, lang)}`)
      .join("\n");
    return `${localized(snap.todaySchedule.day, lang)}:\n${tasks}`;
  }

  return null;
}

async function fetchWebSnippets(query: string): Promise<string> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ZiziFamilyHub/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      AbstractText?: string;
      Answer?: string;
      RelatedTopics?: { Text?: string }[];
    };
    const bits: string[] = [];
    if (data.Answer) bits.push(data.Answer);
    if (data.AbstractText) bits.push(data.AbstractText);
    for (const t of data.RelatedTopics?.slice(0, 3) ?? []) {
      if (t.Text) bits.push(t.Text);
    }
    return bits.join("\n").slice(0, 1200);
  } catch {
    return "";
  }
}

async function answerWithLlm(
  question: string,
  knowledge: string,
  web: string,
  replyLang: Lang
): Promise<string | null> {
  // Prefer OpenRouter (can use free models). Fall back to OpenAI.
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const useOpenRouter = Boolean(openRouterKey);

  const key = openRouterKey || openAiKey;
  if (!key) return null;

  const endpoint = useOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  // openrouter/free = $0 router that picks an available free model
  const model = useOpenRouter
    ? process.env.OPENROUTER_MODEL || "openrouter/free"
    : process.env.OPENAI_MODEL || "gpt-4o-mini";

  const system = `You are the Zizi Family household helper assistant for Charlene (helper), Sir, and Mum.
CRITICAL LANGUAGE RULE: Reply ONLY in ${langName(replyLang)}. Every sentence must be in that language.
If the user wrote Chinese/English but asked to "reply with Filipino" (or similar), still reply ONLY in ${langName(replyLang)}.
Do not mix languages except for unavoidable dish proper names — prefer Filipino dish names (nameFil) when replying in Filipino.
Prefer FAMILY LIVE DATA below over the internet.
For dinner questions, list tonight's meat / vegetable / soup from FAMILY LIVE DATA using the correct language names — never invent literal translations like "Winter Shade Public Soup".
For "what time is it" / current time questions, use ONLY the field "CURRENT Hong Kong date/time". Never use "Admin data lastUpdated" as the clock.
For "what should I do now?", give only the current or next task for CURRENT Hong Kong time — not the whole day.
If the answer is not in family data and web notes, say you are unsure and ask Charlene to check with Sir or Mum.
Never invent ground rules or schedule times.
Do not use the word 姐姐 — say Charlene.

FAMILY LIVE DATA:
${knowledge}

${web ? `INTERNET NOTES (optional):\n${web}` : ""}`;

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
    if (useOpenRouter) {
      headers["HTTP-Referer"] =
        process.env.OPENROUTER_SITE_URL || "https://zizi-family-hub.vercel.app";
      headers["X-Title"] = process.env.OPENROUTER_APP_NAME || "Zizi Family Hub";
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      console.error("LLM error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("LLM call failed", err);
    return null;
  }
}

export async function answerFamilyQuestion(
  question: string,
  options?: { allowInternet?: boolean }
): Promise<AskResult> {
  const snap = await buildLiveSnapshot();
  const knowledge = snapshotToKnowledgeText(snap);
  const allowInternet = options?.allowInternet !== false;

  const { lang, contentQuestion } = resolveReplyLang(question);
  const quick = heuristicAnswer(contentQuestion, snap, lang);

  // Deterministic answers (time, schedule, meals, rules) win over free LLMs
  if (quick) {
    return {
      answer: quick,
      source: "live-web",
      usedInternet: false,
      dataSource: snap.source,
      lastUpdated: snap.lastUpdated,
    };
  }

  const needsWeb =
    allowInternet &&
    /weather|typhoon|天氣|bagyo|how to cook|paano magluto|substitute|palit|recipe tip/.test(
      contentQuestion.toLowerCase()
    );

  let web = "";
  if (needsWeb || (allowInternet && (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY))) {
    web = await fetchWebSnippets(contentQuestion);
  }

  const ai = await answerWithLlm(contentQuestion, knowledge, web, lang);
  if (ai) {
    return {
      answer: ai,
      source: web ? "live-web+internet" : "live-web+ai",
      usedInternet: Boolean(web),
      dataSource: snap.source,
      lastUpdated: snap.lastUpdated,
    };
  }

  return {
    answer:
      lang === "fil"
        ? "Hindi ko mahanap ang sagot sa family hub. Pakitanong si Sir o Mum. Subukan: tonight menu, pickup time, day off, o ground rules."
        : lang === "zh"
          ? "家庭資料中找不到答案，請問 Sir 或 Mum。可試：今晚菜單、接送時間、放假、守則。"
          : "I could not find that in the family hub. Please ask Sir or Mum. Try: tonight menu, pickup time, day off, or ground rules.",
    source: "live-web",
    usedInternet: false,
    dataSource: snap.source,
    lastUpdated: snap.lastUpdated,
  };
}
