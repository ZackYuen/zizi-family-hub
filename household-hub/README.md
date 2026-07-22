# Zizi Family Household Hub

Mobile-friendly web app for household helper **Charlene** — ground rules, task schedule, and nightly dinner randomizer. English & Filipino.

## Deploy on Vercel + Supabase (recommended)

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier)
2. Open **SQL Editor** → paste and run `supabase/migrations/001_app_data.sql`
3. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Seed the database

```bash
cd household-hub
npm install
cp .env.example .env.local   # fill in Supabase keys + ADMIN_PASSWORD
npm run seed
```

### 3. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `zizi-family-hub`
3. Set **Root Directory** to `household-hub`
4. Add environment variables (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
5. Deploy

Your live URL will be something like `https://zizi-family-hub.vercel.app`

- App: `/`
- Admin: `/admin/` — save updates instantly (no JSON download needed)

### Local development

Without Supabase keys, the app falls back to local `data/*.json` files (read-only save).

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Updating content

1. Open `/admin/` on your live Vercel URL
2. Sign in with `ADMIN_PASSWORD`
3. Edit rules, schedule, or settings → **Save**
4. Charlene refreshes the app and sees changes immediately

## WhatsApp Q&A bot (optional)

- **Official API:** configure Meta Cloud API → `/api/whatsapp` (see `docs/LIVE-DATA.md`)
- **Free QR bot (Baileys):** always-on process in `whatsapp-bot/` — spare WhatsApp number, scan QR, `@CharleneBot` or `?` in the group. Needs a PC/Pi/VPS that stays awake (`pm2` or Docker). See `whatsapp-bot/README.md`.

Ask answers come from live Admin data via `/api/ask`. Add `OPENROUTER_API_KEY` on Vercel for free LLM answers.

## Legacy: GitHub Pages (static, no Supabase)

Still available via `npm run build:pages` — admin requires manual JSON upload. See git history for GitHub Actions workflow.
