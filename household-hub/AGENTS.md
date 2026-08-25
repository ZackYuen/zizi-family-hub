# Agent notes (Zizi Family Hub)

## DEFAULT: Supabase-first (do not overwrite Admin)

**Production truth = Admin Save → Supabase.**  
Committed `household-hub/data/content.json` is **seed/backup only**.

Charlene / Sir / Mum edits in Admin must not be wiped by agents.

### Required workflow for any content change

1. **Fetch live first**
   - `cd household-hub && npm run fetch-live`
   - or `GET https://zizi-family-hub.vercel.app/api/live`
2. **Edit on top of live data** (merge / append by `id` — never replace whole arrays from seed)
3. **Write back to Supabase** via Admin Save:
   - `ADMIN_PASSWORD=… npm run patch-live -- path/to/patch.json`
   - Patch must be append/upsert/set only (see `scripts/patch-live-content.mjs`)
4. **Optionally** update `data/content.json` afterward as seed mirror — never the other way around as the only step

### Forbidden by default

- Treating `content.json` as what Charlene sees
- `FORCE_SEED_FROM_LOCAL=1` / `npm run seed` (full overwrite) unless the user explicitly asks to reset
- Replacing entire `appliances` / `groundRules` / `hkLifeGuides` / `weeklySchedule` from repo seed when Supabase already has Admin data

### Auto-merge on read (server)

`getContent()` may **append missing ids** from seed (new appliance, new HK Life tip). It must **not** wholesale replace Admin collections. Prefer `patch-live` for intentional updates.

## WhatsApp (two options)

1. **Official Cloud API** — `/api/whatsapp` on Vercel (no always-on machine; Meta fees).
2. **Baileys always-on bot** — `household-hub/whatsapp-bot/` (QR login, spare number, needs 24/7 host). See that folder’s README.
   - On Azure VM: **`npm run pm2:up`** (never bare `pm2 restart` — “Process not found”).
   - Session: **`~/.zizi-whatsapp-auth` only**. Never `sudo node`, never project `./auth_info` (`EACCES` + `MessageCounterError`).
   - One process only: `pgrep -af 'whatsapp-bot/src/index'`.

Ask API: `POST /api/ask` (used by both). Prefer `OPENROUTER_API_KEY` + `openrouter/free` for \$0 LLM.

### WhatsApp inbox → knowledge / meals

- Bot posts to `POST /api/inbox` with header `x-inbox-secret` (= Vercel `INBOX_SECRET`).
- Admin → **WA Inbox**: review asks; promote to HK Life tip or dinner recipe.
- **`?add <youtube>`** writes the recipe to **Meals live** (LLM digest + category + cook tool). `POST /api/meals/add`. Skips Inbox.
- Commands in group: `?save …` or `?save "…"` (LLM digests into tip/recipe/note). Legacy `?save tip` / `?save recipe` / `?note` still work.
- After promote, edit FIL names / prep notes in Meals or HK Life, then Save.

## Meals / Cantonese YouTube

- Videos are often Cantonese. Meals tab shows **ingredients + prep notes** first; video is for visuals.
- Admin → Meals: add FIL ingredients, **prep notes** (EN/FIL), **Fetch YouTube title**.
- Ask: “How to cook tonight?” / “Paano magluto?” uses the same cook guide.
- Bulk seed: `scripts/fill-recipe-ingredients.mjs` (review quantities in Admin).

## Schedule seasons (summer ↔ K3 term)

- `schoolCalendar.summerEndsOn` / `termStartsOn` (HK dates) switch which week Charlene sees.
- `weeklySchedule` = school term (K3 PM from 2026-09-02).
- `weeklyScheduleSummer` = summer holiday (no kindergarten; Wed/Fri drawing class from live schedule — currently 12:00–13:00 at One Point Studio, 觀塘工業中心一期12樓B室). Ask/bot must read times from this schedule, not hardcode.
- App + Ask use `resolveActiveSchedule()` — do not manually wipe the inactive week.
- Admin Schedule tab: toggle **Summer holiday** / **School term (K3)** to edit either week.
- Rebuild seed + patch helper: `node scripts/build-summer-k3-schedule.mjs [live.json]` then `npm run patch-live -- scripts/_patch-summer-k3.json`.

## Family tone

- Call Charlene a **family member**, not “helper / katulong / 家務助理” in app copy or Ask replies.
- Field `helperName` remains for API compatibility; UI labels say Charlene / family member.
- Ground rules: respectful family tone. **Borrow money** and **Zizi safety** stay firm (may end contract). Other rules use written warning + coaching — not immediate terminate.

## HK Life (living tips for Charlene in Hong Kong)

- Tab **HK Life**: tips for living in HK (emergency, first-weeks checklist, tip categories). Holiday taken / salary receipt confirms sit under **My records** (not tip content).
- Admin → **HK Life**: edit guides, Sir/Mum phones, checklist, weather alert banner (T8+ / black rain), holiday/salary lists.
- Ask / WhatsApp answer typhoon, Octopus, rest day, Consulate, AEON, etc. from `hkLifeGuides` in live content (heuristics + knowledge pack).
- Seed/backup: `data/content.json` + `scripts/seed-hk-life.mjs`. Missing Supabase fields **append** from local once on read — then prefer **Admin Save** / `patch-live` to publish.
- Legal wage/rest-day text is general guidance; always confirm with Sir/Mum / contract / Labour Department.
- Prefer short tip bodies (bullets). Long policy detail → `sourceUrl` PDF link.
