# Zizi Family Household Hub

Mobile-friendly web app for household helper **Charlene** — ground rules, task schedule, and nightly dinner randomizer. English & Filipino.

## Live site (GitHub Pages)

After deployment: **https://zackyuen.github.io/zizi-family-hub/**

- App: `/`
- Admin: `/admin/`

## Local development

```bash
cd household-hub
npm install
npm run dev
```

Open http://localhost:3000

Default admin password: `charlene2026` (override with `NEXT_PUBLIC_ADMIN_PASSWORD` at build time).

## Deploy to GitHub Pages

Deployment runs automatically on push to **`main`** via GitHub Actions.

### One-time GitHub setup

1. Open repo **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. (Optional) Add repo secret **`ADMIN_PASSWORD`** for the admin login on the live site

### Update content on the live site

1. Edit in **Admin** → click **Download content.json**
2. Replace `household-hub/data/content.json` in GitHub with the downloaded file
3. Push to `main` — the site redeploys in ~2 minutes

For recipes, edit `household-hub/data/dinner-recipes.json` the same way.

## Project structure

- `data/content.json` — rules, schedule, settings (source of truth)
- `data/dinner-recipes.json` — 127 dinner recipes for randomizer
- `public/data/` — synced copy served to the browser (auto-synced on build)
