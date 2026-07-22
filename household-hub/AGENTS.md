# Agent notes (Zizi Family Hub)

## Always prefer live Admin data

Do **not** treat `household-hub/data/content.json` as what Charlene sees in production.

1. Fetch live data:
   - `https://zizi-family-hub.vercel.app/api/live`
   - or `cd household-hub && npm run fetch-live`
2. Admin → Save writes to **Supabase**. That is the source of truth.
3. Details: `household-hub/docs/LIVE-DATA.md`

## WhatsApp (two options)

1. **Official Cloud API** — `/api/whatsapp` on Vercel (no always-on machine; Meta fees).
2. **Baileys always-on bot** — `household-hub/whatsapp-bot/` (QR login, spare number, needs 24/7 host). See that folder’s README.

Ask API: `POST /api/ask` (used by both). Prefer `OPENROUTER_API_KEY` + `openrouter/free` for \$0 LLM.

## HK Life (FDH / Kwun Tong)

- Helper tab **HK Life**: emergency phones, settling checklist, bilingual guides.
- Admin → **HK Life**: edit guides, Sir/Mum phones, checklist, weather alert banner (T8+ / black rain).
- Ask / WhatsApp answer typhoon, Octopus, rest day, Consulate, AEON, etc. from `hkLifeGuides` in live content (heuristics + knowledge pack).
- Seed/backup: `data/content.json` + `scripts/seed-hk-life.mjs`. Missing Supabase fields auto-fill from local once on read — then **Admin Save** to publish.
- Legal wage/rest-day text is general guidance; always confirm with Sir/Mum / contract / Labour Department.

