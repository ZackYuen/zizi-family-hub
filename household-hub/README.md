# Zizi Family Household Hub

A mobile-friendly web app for household helper **Charlene**, with English and Filipino (Tagalog) support.

## Features

- **Ground Rules** — house rules including no borrowing money, Zizi-first priority, kitchen safety (separate raw/cooked meat tools)
- **Task Schedule** — daily weekly task schedule with today highlighted
- **Meals** — weekly meal plan
- **Admin Panel** — update all content at `/admin`
- **Bilingual** — toggle between English and Filipino
- **Mobile-first** — works on iPhone and Android; add to home screen as PWA

## Quick Start

```bash
cd household-hub
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD
npm run dev
```

- App: http://localhost:3000
- Admin: http://localhost:3000/admin (default password: `charlene2026`)

## Updating Content

1. Go to `/admin` and sign in
2. Edit ground rules, schedule, or meals in the UI
3. Or use the **JSON** tab to paste bulk updates (e.g. from your Apple Numbers export)

## Deploy

Works on Vercel, Railway, or any Node.js host. Set `ADMIN_PASSWORD` environment variable in production.

## Note on Apple Numbers Reference

Initial content is seeded from typical HK household helper schedules. Update via admin to match your [Apple Numbers schedule](https://www.icloud.com/numbers/010j5qAil0uLECLDCtnNnOyeg#Household_Task_Schedule).
