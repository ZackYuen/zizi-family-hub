# Agent notes (Zizi Family Hub)

## Always prefer live Admin data

Do **not** treat `household-hub/data/content.json` as what Charlene sees in production.

1. Fetch live data:
   - `https://zizi-family-hub.vercel.app/api/live`
   - or `cd household-hub && npm run fetch-live`
2. Admin → Save writes to **Supabase**. That is the source of truth.
3. Details: `household-hub/docs/LIVE-DATA.md`

## Features

- `/api/ask` — Q&A from live schedule / meals / rules (+ optional OpenAI / internet)
- `/api/whatsapp` — WhatsApp Cloud API webhook (`?` trigger)
- Meals tab — per-dish ingredients + tonight shopping list (edit in Admin → Meals)
