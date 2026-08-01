import {
  buildLiveSnapshot,
  findLifeGuide,
  snapshotToKnowledgeText,
  type LiveFamilySnapshot,
} from "./family-knowledge";
import {
  APPLIANCE_CATEGORY_ORDER,
  applianceCategory,
  applianceCategoryMeta,
} from "./appliance-categories";
import { tonightDishes } from "./dinner";
import { getHongKongTimeParts } from "./i18n";
import { localized } from "./localized-text";
import {
  getTaskEndTime,
  getTaskStartTime,
  isTaskActiveNow,
  parseTimeToMinutes,
  sortTasksByTime,
} from "./schedule-utils";
import type { HkLifeGuide, Lang, ScheduleTask } from "./types";

export interface AskResult {
  answer: string;
  source: "live-web" | "live-web+ai" | "live-web+internet";
  usedInternet: boolean;
  dataSource: LiveFamilySnapshot["source"];
  lastUpdated: string;
}

/** Public web app URL for Charlene (Ask / WhatsApp). */
export function publicAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.OPENROUTER_SITE_URL ||
    "https://zizi-family-hub.vercel.app";
  return raw.replace(/\/$/, "");
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

function formatGuide(guide: HkLifeGuide, lang: Lang): string {
  const lines = [localized(guide.title, lang), localized(guide.body, lang)];
  if (guide.sourceUrl) {
    lines.push(
      lang === "fil"
        ? `Source: ${guide.sourceUrl}`
        : lang === "zh"
          ? `來源：${guide.sourceUrl}`
          : `Source: ${guide.sourceUrl}`
    );
  }
  lines.push(
    lang === "fil"
      ? "Kumpirmahin kay Sir/Mum o opisyal na source kung legal/kontrata."
      : lang === "zh"
        ? "合約／法律細節請向 Sir/Mum 或官方來源確認。"
        : "Confirm with Sir/Mum or official sources for contract/legal details."
  );
  return lines.join("\n");
}

function lifeGuideAnswer(
  snap: LiveFamilySnapshot,
  lang: Lang,
  predicate: (g: HkLifeGuide) => boolean
): string | null {
  const guide = findLifeGuide(snap.hkLifeGuides, predicate);
  return guide ? formatGuide(guide, lang) : null;
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

/**
 * General cooking / common-sense technique (not “where is X in our flat”).
 * These should reach the LLM instead of the Tools tip dump.
 */
function isGeneralCookingTechniqueQuestion(q: string): boolean {
  return /foil|aluminium|aluminum|baking\s*paper|parchment|油紙|錫紙|鋁箔|container|lalagyan|baking\s*tray|oven\s*safe|directly\s*(in|into)|put\s*(it\s*)?(in|into)\s*(the\s*)?(air\s*)?fryer|do\s*i\s*need|need\s*(a\s*)?(special\s*)?(tray|pan|container|dish)|can\s*i\s*(use|put|cook)|pwede\s*(ba\s*)?(mag|gamitin|ilagay)|可以.*氣炸|氣炸.*箔|氣炸.*紙|要用.*盒|要不要.*盒|需不需要.*盒/.test(
    q
  );
}

/** Asking where something is stored in THIS home — family-specific, not common sense. */
function isWhereStoredQuestion(q: string): boolean {
  return /\bwhere\b.*(keep|store|put|find|located)|nasaan|saan\s*(naka|ang)|放在哪|在哪[裡里]|去哪[裡里]找|where.*(foil|container|tray|lalagyan)/.test(
    q
  );
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

  // Family Hub website / app link
  if (
    /(family\s*hub|gabay\s*sa\s*bahay|zizi\s*(family)?\s*hub).*(link|url|website|site|app|open)/.test(
      q
    ) ||
    /(link|url|website|site).*(family\s*hub|gabay\s*sa\s*bahay|zizi)/.test(q) ||
    /^(send|give|share|open)\s*(me\s*)?(the\s*)?(link|url|website)/.test(q) ||
    /website|app link|open the app|link ng (app|hub)|網站|網址|連結|link ng family/.test(q)
  ) {
    const url = publicAppUrl();
    if (lang === "fil") {
      return `Family Hub (Gabay sa Bahay):\n${url}\nBuksan sa Chrome/Safari sa phone.`;
    }
    if (lang === "zh") {
      return `家庭 Hub（Gabay sa Bahay）連結：\n${url}\n用手機瀏覽器打開即可。`;
    }
    return `Family Hub (Gabay sa Bahay):\n${url}\nOpen in your phone browser.`;
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
    /how to cook|paano magluto|paano lutuin|lutuin|cook (this|the|tonight)|煮法|怎麼煮|怎煮|paano.*ulam|steps? to cook|cook helper/.test(
      q
    )
  ) {
    if (!snap.tonight) {
      return lang === "fil"
        ? "Wala pang dinner menu — hindi ko mabigay ang cook guide."
        : lang === "zh"
          ? "尚未有晚餐菜單，無法提供烹調說明。"
          : "No dinner menu yet — cannot give cook guide.";
    }
    const dishes = tonightDishes(snap.tonight);
    if (!dishes.length) {
      return lang === "fil"
        ? "Wala pang dinner dishes — hindi ko mabigay ang cook guide."
        : lang === "zh"
          ? "今晚尚未有菜式，無法提供烹調說明。"
          : "No dinner dishes tonight — cannot give cook guide.";
    }
    const cantoneseNote =
      lang === "fil"
        ? "⚠️ Maraming YouTube recipe sa Cantonese. Sundin ang ingredients + prep notes sa Meals tab. Kung hindi clear ang video, tanungin si Sir/Mum."
        : lang === "zh"
          ? "⚠️ 不少 YouTube 食譜是廣東話。請跟 Meals 分頁的材料與準備說明。影片不清楚就問 Sir/Mum。"
          : "⚠️ Many YouTube recipes are in Cantonese. Follow the ingredients + prep notes in the Meals tab. If the video is unclear, ask Sir/Mum.";

    const blocks: string[] = [
      lang === "fil"
        ? "Paano magluto (hapunan ngayong gabi):"
        : lang === "zh"
          ? "今晚怎麼煮："
          : "How to cook tonight:",
      cantoneseNote,
    ];

    for (const dish of dishes) {
      blocks.push("");
      blocks.push(`▶ ${dishName(dish, lang)}`);
      if (dish.ingredients?.length) {
        blocks.push(
          lang === "fil" ? "Mga sangkap:" : lang === "zh" ? "材料：" : "Ingredients:"
        );
        for (const ing of dish.ingredients) {
          const name = ingredientName(ing, lang);
          blocks.push(`  • ${ing.qty ? `${name} (${ing.qty})` : name}`);
        }
      } else {
        blocks.push(
          lang === "fil"
            ? "  (wala pang ingredients — buksan ang link o hilingin kay Sir i-add)"
            : lang === "zh"
              ? "  （尚未列出材料 — 打開連結或請 Sir 加入）"
              : "  (no ingredients listed — open link or ask Sir to add)"
        );
      }
      if (dish.prepNotes) {
        const notes = localized(dish.prepNotes, lang);
        if (notes) {
          blocks.push(
            lang === "fil" ? "Prep notes:" : lang === "zh" ? "準備說明：" : "Prep notes:"
          );
          blocks.push(notes);
        }
      }
      if (dish.link) blocks.push(`Video: ${dish.link}`);
    }
    return blocks.join("\n");
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
    const dishes = tonightDishes(snap.tonight);
    if (!dishes.length) {
      return lang === "fil"
        ? "Wala pang dinner dishes ngayon."
        : lang === "zh"
          ? "今晚尚未有菜式。"
          : "No dinner dishes for tonight.";
    }
    const cat =
      lang === "fil"
        ? { Meat: "Karne", Vegetable: "Gulay", Soup: "Sabaw" }
        : lang === "zh"
          ? { Meat: "肉類", Vegetable: "蔬菜", Soup: "湯" }
          : { Meat: "Meat", Vegetable: "Vegetable", Soup: "Soup" };
    const line = (d: (typeof dishes)[number]) =>
      `${cat[d.category]}: ${dishName(d, lang)}`;
    return [
      lang === "fil" ? "Hapunan ngayong gabi:" : lang === "zh" ? "今晚晚餐：" : "Tonight's dinner:",
      ...dishes.map((d) => `• ${line(d)}`),
      lang === "fil"
        ? "Buksan ang Meals tab para sa ingredients."
        : lang === "zh"
          ? "可在 Meals 分頁查看材料。"
          : "Open the Meals tab for ingredients.",
    ].join("\n");
  }

  if (
    /ingredient|bilihin|shopping|買|材料|sangkap/.test(q) &&
    !/aeon|yata|一田|\bapm\b|yau\s*tong|supermarket|買菜/.test(q)
  ) {
    if (!snap.tonight) return null;
    const lines: string[] = [
      lang === "fil"
        ? "Ingredients ngayong gabi:"
        : lang === "zh"
          ? "今晚材料："
          : "Tonight's ingredients:",
    ];
    for (const dish of tonightDishes(snap.tonight)) {
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

  // HK Life weather first (before school regex)
  if (
    /typhoon|t8|signal\s*8|black\s*rain|bagyo|風球|八號|暴雨|rainstorm|t3|signal\s*3/.test(
      q
    )
  ) {
    const weatherNote =
      snap.hkWeather?.alertActive
        ? lang === "fil"
          ? `⚠ WEATHER ALERT ON (level=${snap.hkWeather.level}): ${localized(snap.hkWeather.note, lang)}\n\n`
          : lang === "zh"
            ? `⚠ 天氣警報開啟（${snap.hkWeather.level}）：${localized(snap.hkWeather.note, lang)}\n\n`
            : `⚠ WEATHER ALERT ON (level=${snap.hkWeather.level}): ${localized(snap.hkWeather.note, lang)}\n\n`
        : "";
    const tip =
      lifeGuideAnswer(snap, lang, (g) => g.id === "life-typhoon") ||
      lifeGuideAnswer(snap, lang, (g) => g.category === "weather");
    if (tip) return weatherNote + tip;
  }

  if (
    /\bmilk\b|gatas|牛奶|glass\s*straw|warm\s*(the\s*)?milk|painitin.*gatas/.test(q)
  ) {
    if (snap.isHelperDayOffToday) {
      return lang === "fil"
        ? "Ngayon day off ni Charlene — hindi kasama ang gatas task sa kanyang schedule. Sir/Mum ang bahala kay Zizi kung may gatas."
        : lang === "zh"
          ? "今天是 Charlene 放假 — 日程沒有牛奶任務。Zizi 的牛奶由 Sir/Mum 安排。"
          : "Today is Charlene’s day off — the milk task is not on her schedule. Sir/Mum handle Zizi’s milk if needed.";
    }
    return lang === "fil"
      ? "Tuwing umaga (hindi sa day off ni Charlene): pakuluan ang tubig, painitin ang gatas ni Zizi sa baso, painumin gamit ang glass straw (huwag plastic)."
      : lang === "zh"
        ? "每天早上（Charlene 放假日除外）：先煲滾水，用熱水把 Zizi 的牛奶溫在玻璃杯裡，用玻璃吸管給他喝（不要用膠吸管）。"
        : "Every morning (not on Charlene’s day off): boil water, warm Zizi’s milk in a glass, and let him drink with a glass straw (not plastic).";
  }

  if (
    /drawing\s*class|one\s*point|觀塘工業|paint(ing)?\s*class|art\s*class|drawing\s*(lesson|studio)/.test(
      q
    )
  ) {
    const d = snap.drawingClass;
    const classRange = d
      ? `${d.classStart}–${d.classEnd}`
      : "12:00–13:00";
    const leaveRange = d
      ? `${d.leaveStart}–${d.leaveEnd}`
      : "11:15–11:30";
    const daysEn = d?.daysEn || "Wed & Fri";
    const daysFil = d?.daysFil || "Miyerkules at Biyernes";
    const daysZh = d?.daysZh || "三、五";
    const venueEn =
      d?.venue.en ||
      "One Point Studio, Kwun Tong Industrial Centre Phase 1, 12/F Room B (觀塘工業中心一期12樓B室)";
    const venueZh =
      d?.venue.zh || "One Point Studio，觀塘工業中心一期12樓B室";
    const summerEndLabel =
      snap.schoolCalendar.summerEndsOn === "2026-09-01" ? "1 Sep" : snap.schoolCalendar.summerEndsOn;
    const termStartLabel =
      snap.schoolCalendar.termStartsOn === "2026-09-02" ? "2 Sep" : snap.schoolCalendar.termStartsOn;

    return lang === "fil"
      ? `Drawing class (summer): ${daysFil} ${classRange} — ${venueEn}. Umalis ~${leaveRange}. Walang kindergarten hanggang ${summerEndLabel}; balik-eskwela ${termStartLabel} (K3 PM).`
      : lang === "zh"
        ? `繪畫班（暑假）：逢星期${daysZh} ${classRange} — ${venueZh}。約 ${leaveRange} 出門。暑假至 ${summerEndLabel} 無幼稚園；${termStartLabel} 復課（K3 下午班）。`
        : `Drawing class (summer): ${daysEn} ${classRange} — ${venueEn}. Leave home ~${leaveRange}. No kindergarten until ${summerEndLabel}; school resumes ${termStartLabel} (K3 PM).`;
  }

  if (
    /pick ?up|sundo|接送|16:30|1630|drop[- ]?off|kindergarten|eskwela|school\s*(run|walk|time)|hatid|k3\b|summer\s*holiday|balik[- ]?eskwela|復課/.test(
      q
    )
  ) {
    if (snap.scheduleSeason === "summer") {
      const d = snap.drawingClass;
      const classRange = d
        ? `${d.classStart}–${d.classEnd}`
        : "12:00–13:00";
      const daysEn = d?.daysEn || "Wed/Fri";
      const daysFil = d?.daysFil || "Miyerkules/Biyernes";
      const daysZh = d?.daysZh || "三／五";
      const summerEndLabel =
        snap.schoolCalendar.summerEndsOn === "2026-09-01"
          ? "1 Sep"
          : snap.schoolCalendar.summerEndsOn;
      const termStartLabel =
        snap.schoolCalendar.termStartsOn === "2026-09-02"
          ? "2 Sep"
          : snap.schoolCalendar.termStartsOn;
      return lang === "fil"
        ? `Summer holiday ngayon (hanggang ${summerEndLabel}) — walang kindergarten. ${daysFil}: drawing class ${classRange} sa One Point Studio (觀塘工業中心一期12樓B室). Balik-eskwela ${termStartLabel} — K3 PM (drop-off bago 13:00, sundo 16:30).`
        : lang === "zh"
          ? `現正暑假（至 ${summerEndLabel}）— 無幼稚園。星期${daysZh}：繪畫班 ${classRange}（One Point Studio，觀塘工業中心一期12樓B室）。${termStartLabel} 復課 — K3 下午班（13:00 前送到，16:30 接）。`
          : `Summer holiday now (until ${summerEndLabel}) — no kindergarten. ${daysEn}: drawing class ${classRange} at One Point Studio (觀塘工業中心一期12樓B室). School resumes ${termStartLabel} — K3 PM (drop-off by 13:00, pick-up 16:30).`;
    }
    const walk = lifeGuideAnswer(snap, lang, (g) => g.id === "life-kt-school-walk");
    if (walk) return walk;
    return lang === "fil"
      ? "Zizi: K3 Mon–Fri PM class. Umalis sa bahay 12:30 (30 min lakad) — drop-off bago 13:00. Umalis 16:00 para sunduin si Zizi ng 16:30."
      : lang === "zh"
        ? "Zizi：K3 星期一至五下午班。12:30 出門（步行約 30 分鐘），13:00 前送到。16:00 出門，16:30 接 Zizi。"
        : "Zizi: K3 Mon–Fri PM class. Leave home 12:30 (30 min walk) — drop off by 13:00. Leave 16:00 to pick up Zizi at 16:30.";
  }

  // HK Life / FDH settling tips (deterministic from guides)
  if (/octopus|八達通|oyster\s*card/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-octopus");
    if (tip) return tip;
  }

  if (
    /recycl|回收|plastic|glass|metal|綠在|6green|yue\s*wah|月華街|天星樓|green\s*@?\s*kwun\s*tong/.test(
      q
    ) &&
    !/chopping\s*board|砧板|raw\s*and\s*cooked/.test(q)
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-rubbish");
    if (tip) return tip;
  }

  if (
    /iphone|ios\s*app|app\s*store|apple\s*id|android\s*app|must[- ]?have\s*app|kailangan.*app|必備.*(app|應用)|app.*hong\s*kong|openrice|alipayhk|\bpayme\b|myobservatory|mtr\s*mobile|anong\s*app|which\s*apps?\s*(to\s*)?(download|install)|apps?\s*to\s*(download|install)|google\s*translate/.test(
      q
    ) &&
    !/whatsapp\s*(bot|number|save|\?save)/.test(q)
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-iphone-apps");
    if (tip) return tip;
  }

  if (
    /healthy\s*(holiday|rest\s*day|sunday|activity)|rest\s*day.*(hike|walk|yoga|fitness|activity)|holiday.*(hike|walk|yoga|fitness)|kadoorie|kfbg|g-?class|tamar\s*park|masusustansiya|malusog.*linggo|健康.*(休息|假|活動)|行山|yoga.*helper|nature\s*day/.test(
      q
    )
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-healthy-holiday");
    if (tip) return tip;
  }

  if (
    /rest\s*day|24\s*hours?|lingguhang\s*pahinga|休息日|statutory\s*holiday|法定假|stat\s*holiday|holiday\s*list|假日清單|mga\s*holiday/.test(
      q
    ) &&
    !/today|ngayon|今天/.test(q)
  ) {
    if (/statutory|法定|stat\s*holiday|holiday\s*list|假日清單/.test(q)) {
      const list = snap.statutoryHolidays;
      if (list.length) {
        const from =
          snap.statutoryHolidayEntitledFrom || "2026-10-27";
        const lines = list.map((h) => {
          const entitled = h.entitled !== false;
          const mark = !entitled ? "—" : h.taken ? "☑" : "☐";
          const tag = !entitled
            ? lang === "zh"
              ? "（尚未享有）"
              : lang === "fil"
                ? " (hindi pa entitled)"
                : " (not entitled yet)"
            : "";
          return `${mark} ${h.date} ${localized(h.name, lang)}${
            h.altDate ? ` (alt ${h.altDate})` : ""
          }${tag}`;
        });
        const tip =
          lifeGuideAnswer(snap, lang, (g) => g.id === "life-rest-day") || "";
        return lang === "fil"
          ? `Statutory holidays 2026 — entitled mula ${from} (HK Life → My records):\n${lines.join("\n")}${tip ? `\n\n${tip}` : ""}`
          : lang === "zh"
            ? `2026 法定假日 — 由 ${from} 起享有（香港生活 → 我的記錄）：\n${lines.join("\n")}${tip ? `\n\n${tip}` : ""}`
            : `Statutory holidays 2026 — entitled from ${from} (HK Life → My records):\n${lines.join("\n")}${tip ? `\n\n${tip}` : ""}`;
      }
      const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-rest-day");
      if (tip) return tip;
    }
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-rest-day");
    if (tip) return tip;
  }

  if (
    /salary|sahod|薪金|工資|wage|payroll|resibo.*sahod|salary\s*receipt|confirm.*salary|nakuha.*sahod|月薪/.test(
      q
    )
  ) {
    const list = snap.salaryPayments;
    if (list.length) {
      const lines = list.map(
        (s) =>
          `${s.received ? "☑" : "☐"} ${localized(s.label, lang)} — HK$${s.amountHkd.toLocaleString("en-HK")}`
      );
      return lang === "fil"
        ? `Sahod / salary receipt (i-tap sa HK Life para kumpirmahin):\n${lines.join("\n")}\n\nHalaga ayon sa listahan — kumpirmahin ang kontrata kay Sir/Mum.`
        : lang === "zh"
          ? `薪金簽收（可在 HK Life 點選確認已收）：\n${lines.join("\n")}\n\n金額以清單為準 — 請向 Sir/Mum 確認合約。`
          : `Salary receipts (confirm received in HK Life):\n${lines.join("\n")}\n\nAmounts follow the list — confirm your contract with Sir/Mum.`;
    }
  }

  if (
    /consulate|pcg|mwo|owwa|labour\s*department|labor\s*department|勞工處|領事|konsulado|9155|2171\s*1771/.test(
      q
    )
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-ph-support");
    if (tip) return tip;
  }

  if (/999|ambulance|ambulansya|emergency\s*number|緊急|bombero|police|pulis/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-emergency-999");
    if (tip) {
      const phones = snap.emergencyContacts
        .filter((c) => c.phone?.trim())
        .map((c) => `• ${localized(c.name, lang)}: ${c.phone}`)
        .join("\n");
      return phones ? `${tip}\n\n${phones}` : tip;
    }
  }

  if (/yata|一田|\bapm\b|aeon|yau\s*tong|grocery|pamimili|買菜|supermarket|wet\s*market|街市|瑞和|錢大媽|qin\s*dama|kai\s*bo/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-aeon");
    if (tip) return tip;
  }

  if (
    /\bhome\b|flat|apartment|660|sq\s*ft|呎|kwun\s*tong\s*(flat|home|bahay)|我們的家|bahay\s*namin|air\s*con|aircon|冷氣|kwarto\s*ni\s*charlene|charlene.*room|bedroom/.test(
      q
    )
  ) {
    const area = snap.homeArea ? localized(snap.homeArea, lang) : "";
    if (lang === "fil") {
      return [
        area ? `Home area: ${area}` : null,
        "Mga 660 sq ft sa Kwun Tong. Pamilya naming 3 (Sir, Mum, Zizi) + Charlene = 4. May sariling kwarto si Charlene na may AC; 3 AC lahat. ~3 min lakad sa Kwun Tong MTR; konektado sa apm — YATA muna sa pamimili.",
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (lang === "zh") {
      return [
        area ? `住址區域：${area}` : null,
        "觀塘約660呎。三口之家（Sir、Mum、Zizi）＋Charlene 共四人。Charlene 有獨立睡房及冷氣；全屋 3 部冷氣。步行約3分鐘到觀塘港鐵，連接 apm — 買菜優先一田 YATA。",
      ]
        .filter(Boolean)
        .join("\n");
    }
    return [
      area ? `Home area: ${area}` : null,
      "~660 sq ft in Kwun Tong. Family of 3 (Sir, Mum, Zizi) + Charlene = 4. Charlene has her own bedroom with AC; 3 ACs total. ~3 min walk to Kwun Tong MTR; linked to apm — YATA first for groceries.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (
    /breakfast|almusal|早餐|lunch|tanghalian|午餐|siumai|燒賣|蕃薯|spaghetti|fried\s*rice|炒飯|烏冬|udon|eat\s*the\s*rainbow|彩虹|chew|ngumuya|含.*嘴|hold.*mouth|bibig/.test(
      q
    ) &&
    !/dinner|tonight|hapunan|今晚|晚餐/.test(q)
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-zizi-meals");
    if (tip) return tip;
  }

  if (/bicycle|bike|bisikleta|單車|helmet|helmete|頭盔/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-zizi-bike");
    if (tip) return tip;
  }

  if (
    /weekly\s*(chore|clean|house)|lingguhang|每週.*(家務|清潔)|monthly\s*task|buwanan|每月任務|mop|laundry|labada/.test(
      q
    )
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-weekly-chores");
    if (tip) return tip;
  }

  if (
    /\bmtr\b|kwun\s*tong\s*mtr|觀塘站|lam\s*tin|藍田|yau\s*tong|油塘/.test(q) ||
    (/taxi|grab/.test(q) && /go|paano|去|saan/.test(q))
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-kt-mtr");
    if (tip) return tip;
  }

  if (/maw|minimum\s*(allowable\s*)?wage|5100|5,?100|kontrata|standard\s*contract|最低.*(工|薪)|id\s*407/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-contract-maw");
    if (tip) return tip;
  }

  if (/live[- ]?in|nakatira|留宿|overnight|matulog sa labas/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-live-in");
    if (tip) return tip;
  }

  if (/food\s*allowance|膳食津貼|allowance.*pagkain|libre.*pagkain/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-food-allowance");
    if (tip) return tip;
  }

  if (/passport|hkid|dokumento|documents|證件|kontrata.*kopya/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-documents");
    if (tip) return tip;
  }

  if (/heat|mainit|熱|humid|overheat|tubig.*lakad|hot\s*weather/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-heat");
    if (tip) return tip;
  }

  if (/rubbish|basura|recycling|垃圾|recycle/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-rubbish");
    if (tip) return tip;
  }

  if (/quiet|tahimik|安靜|maingay|noise|tv.*gabi/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-quiet");
    if (tip) return tip;
  }

  if (
    /insurance|seguro|保險|msig|ihelper|i\s*helper|medical\s*cover|clinic\s*(cover|expense)|hospital.*(cover|insurance)|牙科.*保險|dental.*(cover|insurance)|personal\s*accident/.test(
      q
    )
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-msig-insurance");
    if (tip) return tip;
  }

  if (
    /(?:i\s*(?:am|'m)\s*sick|may\s*sakit\s*ako|我.*病|看醫生|去診所|go\s*(?:to\s*)?(?:clinic|doctor|hospital)|magpa-?(?:clinic|doctor|ospital)|dental|看牙|ngipin)/.test(
      q
    ) &&
    !/zizi|bata|child|anak|baby/.test(q)
  ) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-msig-insurance");
    if (tip) return tip;
  }

  if (/sick|lagnat|fever|vomiting|sakit.*zizi|不適|發燒/.test(q) && /zizi|bata|child|anak/.test(q)) {
    const tip = lifeGuideAnswer(snap, lang, (g) => g.id === "life-zizi-sick");
    if (tip) return tip;
  }

  if (/settling|checklist|bagong\s*dating|first\s*week|unang\s*linggo|安頓|清單/.test(q)) {
    const items = snap.settlingChecklist;
    if (items.length) {
      const lines = items.map(
        (item, i) =>
          `${item.done ? "☑" : "☐"} ${i + 1}. ${localized(item.title, lang)}`
      );
      return lang === "fil"
        ? `Settling checklist:\n${lines.join("\n")}\n\nBuksan ang HK Life tab.`
        : lang === "zh"
          ? `安頓清單：\n${lines.join("\n")}\n\n請打開 HK Life 分頁。`
          : `Settling checklist:\n${lines.join("\n")}\n\nOpen the HK Life tab.`;
    }
  }

  if (
    /hk\s*life|hong\s*kong\s*life|tips?\s*(sa|for|para)?\s*(hk|hong\s*kong)|gabay.*(hong\s*kong|hk)|香港.*(貼士|生活)/.test(
      q
    )
  ) {
    const top = [...snap.hkLifeGuides]
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 8)
      .map((g, i) => `${i + 1}. ${localized(g.title, lang)}`)
      .join("\n");
    if (top) {
      return lang === "fil"
        ? `HK Life tips (tanungin ang topic, o buksan ang HK Life tab):\n${top}`
        : lang === "zh"
          ? `HK Life 貼士（可問某一主題，或打開 HK Life 分頁）：\n${top}`
          : `HK Life tips (ask about a topic, or open the HK Life tab):\n${top}`;
    }
  }

  if (
    /preference|prefer|gusto ng pamilya|family tip|錢大媽|qin\s*dama|kai\s*bo|made in china|gawa sa china|中國製|中国制|avoid.*(china|meat)|huwag.*(karne|bumili)/.test(
      q
    )
  ) {
    const prefs = [...snap.familyPreferences].sort(
      (a, b) => a.priority - b.priority
    );
    if (prefs.length) {
      const china = prefs.find((p) => /china|中國|中国/i.test(p.title.en + p.body.en));
      const qin = prefs.find((p) =>
        /錢大媽|qin|kai bo|meat/i.test(p.title.en + p.title.zh + p.body.en)
      );
      const hit =
        (/china|中國|中国|gawa sa china/i.test(q) && china) ||
        (/錢大媽|qin|kai\s*bo|meat|karne/i.test(q) && qin) ||
        null;
      if (hit) {
        return [
          localized(hit.title, lang),
          localized(hit.body, lang),
          lang === "fil"
            ? "(Preference tip — hindi House Rule.)"
            : lang === "zh"
              ? "（偏好貼士——不是家規。）"
              : "(Family preference tip — not a House Rule.)",
        ].join("\n");
      }
      const list = prefs
        .map((p, i) => `${i + 1}. ${localized(p.title, lang)}`)
        .join("\n");
      return lang === "fil"
        ? `Mga family preference (soft tips, hindi House Rules):\n${list}\n\nTanungin ang specific tip, o buksan ang House Rules tab → Preferences.`
        : lang === "zh"
          ? `家庭偏好（軟性貼士，不是家規）：\n${list}\n\n可問某一項，或打開「家規」分頁 →「偏好」。`
          : `Family preferences (soft tips, not House Rules):\n${list}\n\nAsk about one, or open the House Rules tab → Preferences.`;
    }
  }

  if (
    /vacuum|dyson|v12|hp07|purifier|hot\+?cool|空氣清新|暖風|rice\s*cooker|zojirushi|np-?rlq|pressure\s*cooker|epc17|epc\s*17|高速煲|壓力鍋|washing\s*machine|washer|whirlpool|tdlr70223|tdlr|bread\s*machine|panasonic|sd-?pt1002|air\s*fryer|tefal|easy\s*fry|du4120|dehumidifier|linen\s*dry|抽濕|philips|add6910|water\s*dispenser|飲水|range\s*hood|cooker\s*hood|抽油煙|hitachi|hb-?st388|gas\s*hob|built-?in\s*hob|煮食爐|煤氣爐|石油氣爐|rinnai|林內|rb2gb|rb-?2gb|appliance|gamit sa bahay|吸塵|電飯煲|洗衣機|麵包機|氣炸|how to (use|wash|cook)|paano (gamitin|maglaba|magprito)/.test(
      q
    )
  ) {
    // Foil / container / “do I need a tray?” → LLM common sense (not Tools dump).
    // “Where is the tray in our kitchen?” stays family-specific via LLM hub rules.
    if (!(isGeneralCookingTechniqueQuestion(q) && !isWhereStoredQuestion(q))) {
    const apps = [...snap.appliances].sort((a, b) => a.priority - b.priority);
    if (apps.length) {
      const kindMatchers: { re: RegExp; kind?: string; id?: string }[] = [
        { re: /v12|vacuum|吸塵/, kind: "vacuum" },
        {
          re: /hp07|purifier|hot\+?cool|空氣清新|暖風/,
          kind: "air-purifier",
        },
        { re: /\bdyson\b/, kind: "vacuum" },
        {
          re: /zojirushi|np-?rlq|rice\s*cooker|eletr?ic\s*rice|電飯煲|飯煲/,
          kind: "rice-cooker",
        },
        {
          re: /epc17|epc\s*17|pressure\s*cooker|高速煲|壓力鍋|壓力/,
          kind: "pressure-cooker",
        },
        {
          re: /panasonic|sd-?pt1002|bread\s*machine|麵包機/,
          kind: "bread-machine",
        },
        {
          re: /easy\s*fry|air\s*fryer|氣炸/,
          kind: "air-fryer",
        },
        {
          re: /du4120|dehumidifier|linen\s*dry|抽濕|乾衣抽濕/,
          kind: "dehumidifier",
        },
        {
          re: /philips|add6910|water\s*dispenser|飲水|RO\s*water/,
          kind: "water-dispenser",
        },
        {
          re: /hitachi|hb-?st388|range\s*hood|cooker\s*hood|抽油煙/,
          kind: "range-hood",
        },
        {
          re: /rb2gb|rb-?2gb|rinnai|林內|gas\s*hob|built-?in\s*hob|煮食爐|煤氣爐|石油氣爐|stove|burner/,
          kind: "gas-hob",
        },
        {
          re: /whirlpool|tdlr70223|tdlr|wash(ing)?\s*machine|washer|lavander|洗濯機|洗衣機|maglaba/,
          kind: "washing-machine",
        },
        {
          re: /ultra\s*glide|5570|steam\s*iron|\biron\b|plantsa|熨斗/,
          kind: "iron",
        },
        {
          re: /refa|fine\s*bubble|shower\s*head|花灑|shower|bula/,
          kind: "shower",
        },
        { re: /\btefal\b/, kind: "air-fryer" },
      ];
      const matched = kindMatchers.find((m) => m.re.test(q));
      const hit = matched
        ? apps.find((a) => a.kind === matched.kind) ||
          apps.find((a) =>
            matched.re.test(
              `${a.model || ""} ${a.title.en} ${a.title.zh || ""} ${a.id}`
            )
          )
        : undefined;
      if (hit) {
        const caution = hit.warnings ? localized(hit.warnings, lang) : "";
        return [
          localized(hit.title, lang),
          hit.model ? `Model: ${hit.model}` : null,
          localized(hit.tips, lang),
          caution
            ? lang === "fil"
              ? `Babala: ${caution}`
              : lang === "zh"
                ? `注意：${caution}`
                : `Caution: ${caution}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
      const list = APPLIANCE_CATEGORY_ORDER.map((category) => {
        const items = apps.filter((a) => applianceCategory(a.kind) === category);
        if (!items.length) return null;
        const heading = applianceCategoryMeta[category][lang];
        const rows = items
          .map(
            (a) =>
              `• ${localized(a.title, lang)}${a.model ? ` (${a.model})` : ""}`
          )
          .join("\n");
        return `${heading}\n${rows}`;
      })
        .filter(Boolean)
        .join("\n\n");
      return lang === "fil"
        ? `Mga tools / appliances:\n${list}\n\nTanungin ang pangalan (hal. Dyson / rice cooker), o buksan ang Tools tab.`
        : lang === "zh"
          ? `家電／工具：\n${list}\n\n可問名稱（例如 Dyson、飯煲），或打開「家電」分頁。`
          : `House tools / appliances:\n${list}\n\nAsk by name (e.g. Dyson, rice cooker), or open the Tools tab.`;
    }
    }
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
      ? `Mga House Rules:\n${titles}\n\nTanungin ang specific rule, o buksan ang House Rules tab.`
      : lang === "zh"
        ? `家規：\n${titles}\n\n可問某一條，或打開「家規」分頁。`
        : `House Rules:\n${titles}\n\nAsk about a specific rule, or open the House Rules tab.`;
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

  const system = `You are the Zizi Family household assistant for Charlene (family member), Sir, and Mum.
CRITICAL LANGUAGE RULE: Reply ONLY in ${langName(replyLang)}. Every sentence must be in that language.
If the user wrote Chinese/English but asked to "reply with Filipino" (or similar), still reply ONLY in ${langName(replyLang)}.
Do not mix languages except for unavoidable dish proper names — prefer Filipino dish names (nameFil) when replying in Filipino.
Prefer FAMILY LIVE DATA below over the internet.
Answer policy — two buckets:
(A) FAMILY-SPECIFIC (this household only): schedule, current/next task, tonight’s menu, House Rules, preferences, where things are stored in THIS flat, Zizi routines, salary/holidays, exact appliance buttons/models for OUR machines, pickup times, day-off. → Use FAMILY LIVE DATA only. If missing, say you are unsure and tell Charlene to ask Sir/Mum. Never invent these.
(B) GENERAL COOKING / COMMON SENSE: brief, widely known food-safety or technique tips that are NOT about this flat’s inventory or rules (e.g. air-fryer wings: usually put food directly in the basket, or use aluminum foil / a small oven-safe tray — do not block airflow or cover the heater; no special “bake container” required). → OK to answer in 1–3 short sentences. Prefer FAMILY LIVE DATA / Tools tips when they already cover it. Do not invent long recipes. Do not claim “in our kitchen we keep X in Y”.
For dinner questions, list tonight's dishes from FAMILY LIVE DATA (meat / vegetable / soup — may be zero or more of each) using the correct language names — never invent literal translations like "Winter Shade Public Soup".
For "how to cook" / "paano magluto" of TONIGHT’s dishes, use tonight's ingredients + prepNotes from FAMILY LIVE DATA. Warn that YouTube may be Cantonese — do not invent long cooking steps not in the data. Short common-sense technique (foil, oil, don’t overcrowd) is still OK under (B).
For "what time is it" / current time questions, use ONLY the field "CURRENT Hong Kong date/time". Never use "Admin data lastUpdated" as the clock.
For "what should I do now?", give only the current or next task for CURRENT Hong Kong time — not the whole day.
When asked for the Family Hub / Gabay sa Bahay / app website link or URL, give the Family Hub website URL from FAMILY LIVE DATA.
For HK Life / FDH / typhoon / Octopus / rest day / Consulate / YATA(apm) / groceries / iPhone & Android apps / recycling (Yue Wah St Thu) / healthy holiday / home flat questions, use the HK Life guides and emergency contacts in FAMILY LIVE DATA. Mark general Labour Department facts as "confirm with Sir/Mum / your contract". First supermarket is YATA at apm near home — not AEON unless Sir/Mum say so.
If the answer is FAMILY-SPECIFIC and missing from family data (and web notes do not help), say you are unsure and ask Charlene to check with Sir or Mum.
Never invent House Rules, schedule times, or where items are stored in this flat.
Family preferences are soft tips only — never call them House Rules or invent “If Broken” for them.
For OUR appliance panel/buttons, use the Tools / appliances section; if unsure about exact buttons, tell Charlene to ask Sir/Mum. General cooking technique with that appliance can still use bucket (B).
Do not call Charlene a "helper" or "katulong" or 家務助理 in replies — she is a family member. Do not use the word 姐姐 — say Charlene.

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
    /how to cook|paano magluto|substitute|palit|recipe tip|weather forecast|天氣預測/.test(
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
        ? "Hindi ko mahanap ang sagot sa family hub. Pakitanong si Sir o Mum. Subukan: tonight menu, pickup, Tools (rice cooker), preferences, o House Rules."
        : lang === "zh"
          ? "家庭資料中找不到答案，請問 Sir 或 Mum。可試：今晚菜單、接送、家電用法、偏好貼士、家規。"
          : "I could not find that in the family hub. Please ask Sir or Mum. Try: tonight menu, pickup, Tools (rice cooker), preferences, or House Rules.",
    source: "live-web",
    usedInternet: false,
    dataSource: snap.source,
    lastUpdated: snap.lastUpdated,
  };
}
