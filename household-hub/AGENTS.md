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

Ask API: `POST /api/ask` (used by both). Prefer `OPENROUTER_API_KEY` + `openrouter/free` for \$0 LLM.

### WhatsApp inbox → knowledge / meals

- Bot posts to `POST /api/inbox` with header `x-inbox-secret` (= Vercel `INBOX_SECRET`).
- Admin → **WA Inbox**: review asks; promote to HK Life tip or dinner recipe.
- Commands in group: `?save …` or `?save "…"` (LLM digests into tip/recipe/note). Legacy `?save tip` / `?save recipe` / `?note` still work.
- After promote, edit FIL names / prep notes in Meals or HK Life, then Save.

## Meals / Cantonese YouTube

- Videos are often Cantonese. Meals tab shows **ingredients + prep notes** first; video is for visuals.
- Admin → Meals: add FIL ingredients, **prep notes** (EN/FIL), **Fetch YouTube title**.
- Ask: “How to cook tonight?” / “Paano magluto?” uses the same cook guide.
- Bulk seed: `scripts/fill-recipe-ingredients.mjs` (review quantities in Admin).

## Family tone

- Call Charlene a **family member**, not “helper / katulong / 家務助理” in app copy or Ask replies.
- Field `helperName` remains for API compatibility; UI labels say Charlene / family member.
- Ground rules: respectful family tone, but **firm If Broken** — no second chance to try breaking a rule.

## HK Life (FDH / Kwun Tong)

- Tab **HK Life**: emergency phones, settling checklist, bilingual guides.
- Admin → **HK Life**: edit guides, Sir/Mum phones, checklist, weather alert banner (T8+ / black rain).
- Ask / WhatsApp answer typhoon, Octopus, rest day, Consulate, AEON, etc. from `hkLifeGuides` in live content (heuristics + knowledge pack).
- Seed/backup: `data/content.json` + `scripts/seed-hk-life.mjs`. Missing Supabase fields **append** from local once on read — then prefer **Admin Save** / `patch-live` to publish.
- Legal wage/rest-day text is general guidance; always confirm with Sir/Mum / contract / Labour Department.
