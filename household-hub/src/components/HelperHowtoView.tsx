"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useMemberDisplayName } from "@/contexts/FrontendUserContext";

const copy = {
  en: {
    title: "How to use this app",
    subtitle: "A short guide for your day with Zizi and the family.",
    back: "← Back",
    morningTitle: "1. Start your day — Schedule",
    morningBody:
      "Open Schedule first. Check today’s times: when to leave for school, pick-up, cleaning, and shopping. Follow the order on the list. If it is Sunday or a public holiday, the app will show you are on day off.",
    mealsTitle: "2. Shopping & cooking — Meals",
    mealsBody:
      "Open Meals before you buy food or cook. See Tonight’s dinner (and Tomorrow if you want to prepare early). Open each dish for ingredients and cooking steps. Tick items on the shopping / prep list as you go so you don’t forget anything.",
    mapsTitle: "3. Going somewhere — HK Life → Maps",
    mapsBody:
      "Need home, kindergarten, YATA, wet market, or AEON? Open HK Life → Maps and tap the place. It opens Google Maps so you can walk or take transport with confidence.",
    toolsTitle: "4. Appliances — Tools",
    toolsBody:
      "Before using the vacuum, washing machine, rice cooker, pressure cooker, or air fryer, open Tools. Follow the steps there. If you are unsure, ask Sir/Mum or use Ask.",
    askTitle: "5. When you are unsure — Ask",
    askBody:
      "Type your question in Ask (dinner, schedule, how to use a machine, rules…). On WhatsApp in the family group, @mention the bot or write ask: then your question. Better to ask than guess.",
    rulesTitle: "6. Important family rules — House Rules",
    rulesBody:
      "Read House Rules carefully — these must be followed (especially with Zizi’s safety). Preferences are softer tips, like where to shop. If something is unclear, ask Sir/Mum.",
    tipTitle: "Tips",
    tip1: "Add this website to your phone Home Screen so you can open it quickly every day.",
    tip2: "Switch language at the top (EN / 繁 / FIL) anytime.",
    tip3: "If the page looks old, refresh. Sir/Mum update the live schedule and dinner menu.",
    tip4: "Tap the ? at the top anytime to open this guide again.",
    close: "Got it — back to app",
  },
  fil: {
    title: "Paano gamitin ang app",
    subtitle: "Maikling gabay para sa araw-araw mo kasama si Zizi at ang pamilya.",
    back: "← Bumalik",
    morningTitle: "1. Simula ng araw — Schedule",
    morningBody:
      "Buksan muna ang Schedule. Tingnan ang oras ngayong araw: alis papuntang school, sundo, linis, at pamimili. Sundin ang listahan. Kung Linggo o public holiday, ipapakita ng app na day off mo.",
    mealsTitle: "2. Pamimili at pagluluto — Meals",
    mealsBody:
      "Buksan ang Meals bago bumili o magluto. Tingnan ang hapunan Ngayon (at Bukas kung gusto mong maghanda nang maaga). Buksan ang bawat dish para sa ingredients at steps. I-tick ang shopping / prep list habang ginagawa para hindi makalimutan.",
    mapsTitle: "3. Papunta sa isang lugar — HK Life → Maps",
    mapsBody:
      "Kailangan ng bahay, kindergarten, YATA, wet market, o AEON? Buksan ang HK Life → Maps at i-tap ang lugar. Magbubukas ang Google Maps para madali kang makarating.",
    toolsTitle: "4. Mga appliance — Tools",
    toolsBody:
      "Bago gamitin ang vacuum, washing machine, rice cooker, pressure cooker, o air fryer, buksan ang Tools. Sundin ang steps. Kung unsure, tanungin si Sir/Mum o gamitin ang Ask.",
    askTitle: "5. Kung unsure — Ask",
    askBody:
      "I-type ang tanong sa Ask (hapunan, schedule, paano gamitin ang machine, rules…). Sa WhatsApp family group, i-@mention ang bot o magsulat ng ask: tapos ang tanong. Mas mabuti ang magtanong kaysa mag-guess.",
    rulesTitle: "6. Mahahalagang rules — House Rules",
    rulesBody:
      "Basahin nang mabuti ang House Rules — dapat sundin (lalo na ang safety ni Zizi). Ang Preferences ay softer tips, tulad ng saan mamili. Kung hindi clear, tanungin si Sir/Mum.",
    tipTitle: "Mga tip",
    tip1: "I-add ang website sa Home Screen ng phone para mabilis buksan araw-araw.",
    tip2: "Palitan ang language sa itaas (EN / 繁 / FIL) kahit kailan.",
    tip3: "Kung mukhang luma ang page, i-refresh. Ina-update nina Sir/Mum ang live schedule at dinner menu.",
    tip4: "I-tap ang ? sa taas kahit kailan para buksan ulit ang gabay na ito.",
    close: "OK — bumalik sa app",
  },
  zh: {
    title: "怎樣使用這個 App",
    subtitle: "給你日常照顧 Zizi、幫忙家務的簡單指引。",
    back: "← 返回",
    morningTitle: "1. 開始一天 — 日程",
    morningBody:
      "先打開「日程」。看今天的時間：何時出門送學、接學、清潔、買餸。按列表順序做。若是星期日或公眾假期，App 會顯示你放假。",
    mealsTitle: "2. 買餸與煮食 — 膳食",
    mealsBody:
      "買餸或煮飯前打開「膳食」。看今晚晚餐（若想提早準備可睇明日）。點開每道菜看材料與步驟。邊做邊在購物／準備清單打勾，免得漏掉。",
    mapsTitle: "3. 要去某處 — 香港生活 → 地圖",
    mapsBody:
      "要找家、幼稚園、一田、街市或 AEON？打開「香港生活 → 地圖」並點選地點，會開啟 Google 地圖，方便步行或乘車。",
    toolsTitle: "4. 家電用法 — 家電",
    toolsBody:
      "使用吸塵機、洗衣機、電飯煲、壓力鍋或氣炸鍋前，先打開「家電」跟步驟。不肯定就問 Sir/Mum，或用「提問」。",
    askTitle: "5. 有疑問 — 提問",
    askBody:
      "在「提問」輸入問題（晚餐、日程、家電用法、守則…）。WhatsApp 家庭群組請 @機器人 或寫 ask: 再寫問題。有疑問就問，不要自己猜。",
    rulesTitle: "6. 必須遵守 — 家規",
    rulesBody:
      "請仔細閱讀「家規」— 必須遵守（尤其 Zizi 安全）。「偏好」是較軟性的提示，例如去哪裡買餸。不清楚就問 Sir/Mum。",
    tipTitle: "小提示",
    tip1: "把網站加到手機主畫面，每天更快打開。",
    tip2: "隨時可在上方切換語言（EN／繁／FIL）。",
    tip3: "若內容看起來舊了，請重新整理。Sir/Mum 會更新即時日程與晚餐。",
    tip4: "隨時點上方的 ? 可再打開這份指引。",
    close: "明白了 — 返回 App",
  },
} as const;

type Props = {
  helperNameFallback: string;
  onClose: () => void;
};

export function HelperHowtoView({ helperNameFallback, onClose }: Props) {
  const { lang } = useLanguage();
  const name = useMemberDisplayName(helperNameFallback);
  const t = copy[lang] || copy.en;

  const sections = [
    { title: t.morningTitle, body: t.morningBody },
    { title: t.mealsTitle, body: t.mealsBody },
    { title: t.mapsTitle, body: t.mapsBody },
    { title: t.toolsTitle, body: t.toolsBody },
    { title: t.askTitle, body: t.askBody },
    { title: t.rulesTitle, body: t.rulesBody },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-teal-50 px-3 py-3 ring-1 ring-teal-100">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-teal-800"
        >
          {t.back}
        </button>
        <h2 className="mt-1 text-base font-bold text-teal-950">{t.title}</h2>
        <p className="mt-1 text-sm text-teal-900">
          {lang === "fil"
            ? `Kumusta, ${name}. ${t.subtitle}`
            : lang === "zh"
              ? `${name}，${t.subtitle}`
              : `Hi ${name}. ${t.subtitle}`}
        </p>
      </div>

      {sections.map((s) => (
        <section
          key={s.title}
          className="rounded-xl bg-white px-3.5 py-3 ring-1 ring-stone-100"
        >
          <h3 className="text-sm font-bold text-stone-900">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-700">
            {s.body}
          </p>
        </section>
      ))}

      <section className="rounded-xl bg-amber-50 px-3.5 py-3 ring-1 ring-amber-100">
        <h3 className="text-sm font-bold text-amber-950">{t.tipTitle}</h3>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-amber-950">
          <li>{t.tip1}</li>
          <li>{t.tip2}</li>
          <li>{t.tip3}</li>
          <li>{t.tip4}</li>
        </ul>
      </section>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
      >
        {t.close}
      </button>
    </div>
  );
}
