/**
 * Inject panelButtons + tip tweaks for all Tools appliances.
 * Run: node scripts/apply-appliance-panels.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** @type {Record<string, { panelButtons: object[], tipPrefix?: {en:string,fil:string,zh:string}, removeImageUrl?: boolean }>} */
const PANELS = {
  "app-dyson-v12": {
    panelButtons: [
      { n: 1, en: "Power / trigger", fil: "Power / trigger", zh: "電源／扳機", hintEn: "Hold to vacuum", hintFil: "Hawakan para mag-vacuum", hintZh: "按住吸塵" },
      { n: 2, en: "Mode / LCD", fil: "Mode / LCD", zh: "模式／螢幕", hintEn: "Eco / Med / Boost", hintFil: "Eco / Med / Boost", hintZh: "Eco／中／強" },
      { n: 3, en: "Bin release (red)", fil: "Bin release (pula)", zh: "紅色塵桶掣", hintEn: "Empty at MAX line", hintFil: "Alisin sa MAX line", hintZh: "到 MAX 線就倒" },
      { n: 4, en: "Filter (twist)", fil: "Filter (twist)", zh: "濾網（拧出）", hintEn: "Wash monthly; dry 24h", hintFil: "Hugasan buwan-buwan; dry 24h", hintZh: "約每月洗；風乾 24 小時" },
      { n: 5, en: "Dock charge", fil: "Dock charge", zh: "充電座", hintEn: "Return after use", hintFil: "Ibalik pagkatapos", hintZh: "用完放回充電" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-panasonic-sd-pt1002": {
    removeImageUrl: true,
    panelButtons: [
      { n: 1, en: "Menu ▲/▼ (菜單)", fil: "Menu ▲/▼ (菜單)", zh: "菜單 ▲/▼", hintEn: "Choose program number", hintFil: "Piliin ang program", hintZh: "選程式編號" },
      { n: 2, en: "Size (重量)", fil: "Size (重量)", zh: "重量", hintEn: "Loaf size", hintFil: "Laki ng tinapay", hintZh: "麵包大小" },
      { n: 3, en: "Crust (烤色)", fil: "Crust (烤色)", zh: "烤色", hintEn: "Light / std / dark", hintFil: "Light / std / dark", hintZh: "淡／標準／濃" },
      { n: 4, en: "Timer (預約)", fil: "Timer (預約)", zh: "預約", hintEn: "Delay end (tested recipes only)", hintFil: "Delay (tested recipes lang)", hintZh: "延時（只用試過的食譜）" },
      { n: 5, en: "Start (開始)", fil: "Start (開始)", zh: "開始", hintEn: "Begin bake", hintFil: "Simulan", hintZh: "開始烘烤" },
      { n: 6, en: "Stop (取消／停止)", fil: "Stop (取消／停止)", zh: "取消／停止", hintEn: "Cancel / when finished", hintFil: "Cancel / pagtapos", hintZh: "取消或完成後按" },
    ],
    tipPrefix: {
      en: "• Bread maker: Panasonic SD-PT1002 (panel labels are Traditional Chinese).\n• See the panel guide above — numbers match the buttons.\n",
      fil: "• Bread maker: Panasonic SD-PT1002 (Traditional Chinese ang panel).\n• Tingnan ang panel guide sa itaas — tumutugma ang numero sa buttons.\n",
      zh: "• 麵包機：Panasonic SD-PT1002（面板為繁體中文）。\n• 見上方面板示意 — 數字對應按鈕。\n",
    },
  },
  "app-philips-add6910": {
    panelButtons: [
      { n: 1, en: "Temperature", fil: "Temperature", zh: "溫度", hintEn: "Ambient / 45 / 85 / 95°C", hintFil: "Ambient / 45 / 85 / 95°C", hintZh: "常溫／45／85／95°C" },
      { n: 2, en: "Volume", fil: "Volume", zh: "水量", hintEn: "150 / 210 / 300 / 500 ml", hintFil: "150 / 210 / 300 / 500 ml", hintZh: "150／210／300／500 ml" },
      { n: 3, en: "Safety unlock", fil: "Safety unlock", zh: "安全解鎖", hintEn: "Required above 45°C", hintFil: "Kailangan kapag >45°C", hintZh: "高於 45°C 要先解鎖" },
      { n: 4, en: "Dispense", fil: "Dispense", zh: "出水", hintEn: "Press after temp + volume", hintFil: "Pindutin pagkatapos ng temp + volume", hintZh: "選好溫度和水量後按" },
      { n: 5, en: "Filter life", fil: "Filter life", zh: "濾芯壽命", hintEn: "Tell Sir/Mum when low", hintFil: "Sabihin kay Sir/Mum kung low", hintZh: "將盡時告知 Sir/Mum" },
      { n: 6, en: "Raw-water tank", fil: "Raw-water tank", zh: "原水箱", hintEn: "Tap water only · 4L", hintFil: "Tap water lang · 4L", hintZh: "只用自來水 · 4L" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-zojirushi-np-rlq05": {
    panelButtons: [
      { n: 1, en: "Menu (LCD)", fil: "Menu (LCD)", zh: "菜單（LCD）", hintEn: "White / Quick / Sushi / Scorch…", hintFil: "White / Quick / Sushi / Scorch…", hintZh: "白米／快煮／壽司／焦香…" },
      { n: 2, en: "Timer", fil: "Timer", zh: "預約", hintEn: "Delay finish if needed", hintFil: "Delay kung kailangan", hintZh: "可延時完成" },
      { n: 3, en: "Start", fil: "Start", zh: "開始", hintEn: "Begin cook", hintFil: "Simulan", hintZh: "開始煮飯" },
      { n: 4, en: "Cancel / Keep Warm", fil: "Cancel / Keep Warm", zh: "取消／保溫", hintEn: "Stops or holds after done", hintFil: "Humihinto o Keep Warm", hintZh: "停止或煮完保溫" },
      { n: 5, en: "Water lines", fil: "Water lines", zh: "水位線", hintEn: "Match cups + rice type", hintFil: "Tugma sa cups + uri ng bigas", hintZh: "對準杯數＋米種" },
      { n: 6, en: "Pressure / lid", fil: "Pressure / lid", zh: "壓力／蓋", hintEn: "Never force while pressurized", hintFil: "Huwag pilitin kung may pressure", hintZh: "有壓力時勿強行開蓋" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-hitachi-hb-st388": {
    panelButtons: [
      { n: 1, en: "Left motor", fil: "Left motor", zh: "左摩打", hintEn: "Independent on/off", hintFil: "Hiwalay na on/off", hintZh: "可獨立開關" },
      { n: 2, en: "Right motor", fil: "Right motor", zh: "右摩打", hintEn: "Independent on/off", hintFil: "Hiwalay na on/off", hintZh: "可獨立開關" },
      { n: 3, en: "High / Low (L)", fil: "High / Low (L)", zh: "左高／低速", hintEn: "Speed for left side", hintFil: "Bilis sa kaliwa", hintZh: "左側風速" },
      { n: 4, en: "High / Low (R)", fil: "High / Low (R)", zh: "右高／低速", hintEn: "Speed for right side", hintFil: "Bilis sa kanan", hintZh: "右側風速" },
      { n: 5, en: "Oil cups", fil: "Oil cups", zh: "油杯", hintEn: "Empty when oily", hintFil: "Alisin kapag madami ang mantika", hintZh: "有油就清" },
      { n: 6, en: "Filters", fil: "Filters", zh: "濾網", hintEn: "Wash · dry · refit", hintFil: "Hugasan · patuyuin · ibalik", hintZh: "清洗·風乾·裝回" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-tefal-easy-fry-xxl": {
    panelButtons: [
      { n: 1, en: "Start", fil: "Start", zh: "Start", hintEn: "Begin / confirm", hintFil: "Simulan / confirm", hintZh: "開始／確認" },
      { n: 2, en: "Mode (Air Fry…)", fil: "Mode (Air Fry…)", zh: "模式（Air Fry…）", hintEn: "Air Fry / Grill / auto", hintFil: "Air Fry / Grill / auto", hintZh: "氣炸／燒烤／自動" },
      { n: 3, en: "+ / −", fil: "+ / −", zh: "+／−", hintEn: "Adjust °C and minutes", hintFil: "Ayusin °C at minuto", hintZh: "調溫度與時間" },
      { n: 4, en: "Temp 40–220°C", fil: "Temp 40–220°C", zh: "溫度 40–220°C", hintEn: "Manual cook range", hintFil: "Manual range", hintZh: "手動範圍" },
      { n: 5, en: "Time 0–60 min", fil: "Time 0–60 min", zh: "時間 0–60 分", hintEn: "Then press Start", hintFil: "Tapos pindutin Start", hintZh: "再按 Start" },
      { n: 6, en: "Grill / basket", fil: "Grill / basket", zh: "Grill／籃", hintEn: "Flip food halfway", hintFil: "Baliktarin sa gitna", hintZh: "中途翻面" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-tefal-du4120g0": {
    panelButtons: [
      { n: 1, en: "ON / OFF", fil: "ON / OFF", zh: "開關", hintEn: "Power", hintFil: "Power", hintZh: "電源" },
      { n: 2, en: "Humidity %", fil: "Humidity %", zh: "目標濕度", hintEn: "Often 50 / 60 / 70%", hintFil: "Madalas 50 / 60 / 70%", hintZh: "常見 50／60／70%" },
      { n: 3, en: "DRY (linen)", fil: "DRY (linen)", zh: "DRY（乾衣）", hintEn: "Laundry dry + continuous", hintFil: "Damit + continuous", hintZh: "乾衣＋持續抽濕" },
      { n: 4, en: "SWING", fil: "SWING", zh: "SWING 擺風", hintEn: "Wider airflow", hintFil: "Mas malawak na hangin", hintZh: "擴大送風" },
      { n: 5, en: "Water tank", fil: "Water tank", zh: "水箱", hintEn: "Empty when full", hintFil: "Alisin kapag puno", hintZh: "滿了要倒" },
      { n: 6, en: "Pre-filter", fil: "Pre-filter", zh: "前置濾網", hintEn: "Must be fitted to run", hintFil: "Dapat naka-lagay", hintZh: "必須裝好才開機" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-dyson-hp07": {
    panelButtons: [
      { n: 1, en: "Power", fil: "Power", zh: "電源", hintEn: "Remote or app", hintFil: "Remote o app", hintZh: "遙控或 App" },
      { n: 2, en: "Auto", fil: "Auto", zh: "Auto", hintEn: "Sensors adjust purify", hintFil: "Sensors ang mag-adjust", hintZh: "感應自動淨化" },
      { n: 3, en: "Temperature", fil: "Temperature", zh: "溫度", hintEn: "Target for heat", hintFil: "Target para sa init", hintZh: "暖風目標溫度" },
      { n: 4, en: "Fan speed", fil: "Fan speed", zh: "風速", hintEn: "Cool / circulate", hintFil: "Cool / circulate", hintZh: "涼風／循環" },
      { n: 5, en: "Oscillation", fil: "Oscillation", zh: "擺風", hintEn: "Spreads air", hintFil: "Kumalat ang hangin", hintZh: "擴大送風範圍" },
      { n: 6, en: "Night / filter", fil: "Night / filter", zh: "Night／濾網", hintEn: "Quiet · reset after new filter", hintFil: "Tahimik · reset pagkatapos ng bagong filter", hintZh: "靜音·換濾網後重設" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the remote/controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa remote/controls.\n",
      zh: "• 見上方面板示意 — 數字對應遙控／操作。\n",
    },
  },
  "app-tefal-epc17": {
    panelButtons: [
      { n: 1, en: "Program", fil: "Program", zh: "程式", hintEn: "Pressure / Rice / Steam / Stew…", hintFil: "Pressure / Rice / Steam / Stew…", hintZh: "壓力／飯／蒸／燉…" },
      { n: 2, en: "Pressure level", fil: "Pressure level", zh: "壓力", hintEn: "HI-P / P / LO-P", hintFil: "HI-P / P / LO-P", hintZh: "高／中／低壓" },
      { n: 3, en: "Time +/−", fil: "Time +/−", zh: "時間 +/−", hintEn: "Adjust cook minutes", hintFil: "Ayusin ang minuto", hintZh: "調烹調時間" },
      { n: 4, en: "Start / Cancel", fil: "Start / Cancel", zh: "開始／取消", hintEn: "Begin or stop", hintFil: "Simulan o huminto", hintZh: "開始或取消" },
      { n: 5, en: "Keep Warm", fil: "Keep Warm", zh: "保溫", hintEn: "Usually after done", hintFil: "Madalas pagkatapos", hintZh: "完成後通常保溫" },
      { n: 6, en: "Valve / lid lock", fil: "Valve / lid lock", zh: "閥／鎖蓋", hintEn: "Wait for full release", hintFil: "Hintaying fully released", hintZh: "等壓力完全釋放" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-whirlpool-tdlr70223": {
    panelButtons: [
      { n: 1, en: "Program", fil: "Program", zh: "程式", hintEn: "Mixed / Cotton / Rapid 30'…", hintFil: "Mixed / Cotton / Rapid 30'…", hintZh: "混合／棉質／快洗 30'…" },
      { n: 2, en: "Temperature", fil: "Temperature", zh: "溫度", hintEn: "Cold – 90°C", hintFil: "Cold – 90°C", hintZh: "冷水–90°C" },
      { n: 3, en: "Spin", fil: "Spin", zh: "脫水", hintEn: "Adjust rpm if needed", hintFil: "Ayusin ang rpm kung kailangan", hintZh: "可調轉速" },
      { n: 4, en: "Start / Pause", fil: "Start / Pause", zh: "開始／暫停", hintEn: "Close lid first", hintFil: "Isara muna ang lid", hintZh: "先蓋上蓋" },
      { n: 5, en: "Detergent drawer", fil: "Detergent drawer", zh: "清潔劑格", hintEn: "Use symbols Sir/Mum showed", hintFil: "Sundin ang symbols nina Sir/Mum", hintZh: "跟 Sir/Mum 教的符號" },
      { n: 6, en: "Drum clean", fil: "Drum clean", zh: "筒清潔", hintEn: "Empty drum · ~90°C", hintFil: "Walang damit · ~90°C", hintZh: "空筒 · 約 90°C" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-tefal-ultraglide-5570": {
    panelButtons: [
      { n: 1, en: "Temp dial", fil: "Temp dial", zh: "溫度轉盤", hintEn: "• / •• / ••• / MAX", hintFil: "• / •• / ••• / MAX", hintZh: "•／••／•••／MAX" },
      { n: 2, en: "Steam zone", fil: "Steam zone", zh: "蒸氣區", hintEn: "Usually •• to MAX", hintFil: "Madalas •• hanggang MAX", hintZh: "通常 •• 至 MAX" },
      { n: 3, en: "Steam boost", fil: "Steam boost", zh: "強力蒸氣", hintEn: "Short presses; wait between", hintFil: "Maikling pindot; maghintay sa pagitan", hintZh: "短按；間隔數秒" },
      { n: 4, en: "Spray", fil: "Spray", zh: "噴霧", hintEn: "If fitted on this model", hintFil: "Kung mayroon sa model na ito", hintZh: "若本機有此鍵" },
      { n: 5, en: "Water tank", fil: "Water tank", zh: "水箱", hintEn: "Fill to MAX; unplug first", hintFil: "Hanggang MAX; i-unplug muna", hintZh: "加至 MAX；先拔電" },
      { n: 6, en: "Soleplate / stand", fil: "Soleplate / stand", zh: "底板／豎立", hintEn: "Stand upright when idle", hintFil: "Itayo nang patayo kapag hindi ginagamit", hintZh: "不用時豎立放置" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
  "app-refa-fine-bubble-s": {
    panelButtons: [
      { n: 1, en: "Normal mode", fil: "Normal mode", zh: "普通模式", hintEn: "Everyday rinse / wash", hintFil: "Pang-araw-araw na banlaw", hintZh: "日常沖洗" },
      { n: 2, en: "Fine Bubble mode", fil: "Fine Bubble mode", zh: "微氣泡模式", hintEn: "Softer micro-bubbles", hintFil: "Mas malambot na micro-bubbles", hintZh: "更細氣泡水" },
      { n: 3, en: "Mode dial / switch", fil: "Mode dial / switch", zh: "模式切換", hintEn: "On the handle — don’t force", hintFil: "Sa handle — huwag pilitin", hintZh: "在手柄上 — 勿硬扭" },
      { n: 4, en: "Hang to drain", fil: "Hang to drain", zh: "掛起瀝水", hintEn: "After shower", hintFil: "Pagkatapos maligo", hintZh: "用後掛好" },
    ],
    tipPrefix: {
      en: "• See the panel guide above — numbers match the controls.\n",
      fil: "• Tingnan ang panel guide sa itaas — tumutugma ang numero sa controls.\n",
      zh: "• 見上方面板示意 — 數字對應操作。\n",
    },
  },
};

function stripOldPanelTipLines(tips) {
  // Remove old "see panel picture below" blocks for bread so we don't duplicate
  return tips
    .replace(
      /^• See the panel picture below[\s\S]*?(?=• Fit the correct|• Tamang kneading|• 裝好攪拌葉)/m,
      ""
    )
    .replace(
      /^• Tingnan ang panel picture sa ibaba[\s\S]*?(?=• Tamang kneading)/m,
      ""
    )
    .replace(/^• 見下方面板圖[\s\S]*?(?=• 裝好攪拌葉)/m, "")
    .replace(/^• Bread maker: Panasonic[\s\S]*?\n(?=• )/m, "")
    .replace(/^• 麵包機：Panasonic[\s\S]*?\n(?=• )/m, "");
}

function applyFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  let n = 0;
  for (const app of data.appliances || []) {
    const cfg = PANELS[app.id];
    if (!cfg) continue;
    app.panelButtons = cfg.panelButtons;
    if (cfg.removeImageUrl) delete app.imageUrl;
    if (cfg.tipPrefix) {
      for (const lang of ["en", "fil", "zh"]) {
        let t = app.tips?.[lang] || "";
        if (app.id === "app-panasonic-sd-pt1002") {
          t = stripOldPanelTipLines(t);
        }
        // Avoid double-prefix if re-run
        const marker = "panel guide above";
        const markerZh = "面板示意";
        const hasMarker =
          lang === "zh" ? t.includes(markerZh) : t.toLowerCase().includes(marker);
        if (!hasMarker) {
          app.tips[lang] = cfg.tipPrefix[lang] + t.replace(/^\n+/, "");
        } else {
          // Deduplicate identical consecutive lines
          const lines = t.split("\n");
          const out = [];
          const seen = new Set();
          for (const line of lines) {
            const key = line.trim();
            if (key && seen.has(key)) continue;
            if (key) seen.add(key);
            out.push(line);
          }
          app.tips[lang] = out.join("\n");
        }
      }
    }
    n++;
  }
  data.lastUpdated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`Updated ${n} appliances in ${path.relative(ROOT, filePath)}`);
}

applyFile(path.join(ROOT, "data/content.json"));
applyFile(path.join(ROOT, "public/data/content.json"));

// Also write a live upsert patch (appliances array replace-by-id via patch-live)
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "data/content.json"), "utf8"));
const patch = {
  upsertAppliances: seed.appliances.map((a) => {
    const copy = { ...a };
    if (a.id === "app-panasonic-sd-pt1002") copy.imageUrl = "";
    return copy;
  }),
};
const patchPath = path.join(ROOT, "scripts/_patch-appliance-panels.json");
fs.writeFileSync(patchPath, JSON.stringify(patch, null, 2) + "\n");
console.log("Wrote", path.relative(ROOT, patchPath));
