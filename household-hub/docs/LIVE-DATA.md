# Live data & agents

## Source of truth

| Environment | Truth |
|-------------|--------|
| Production (Vercel + Supabase) | **Admin Save → Supabase** |
| Local without Supabase | `data/content.json` |

Committed `content.json` is a **seed/backup**. Cloud agents must **not** assume the repo file matches what Charlene sees.

After you edit in Admin and click Save, the live site updates immediately. Repo files may stay old until someone exports or seeds.

## How agents should read current data

```bash
# Preferred
curl -s https://zizi-family-hub.vercel.app/api/live | jq .

# Or
cd household-hub && node scripts/fetch-live-content.mjs
# writes .live-cache/live.json + knowledge.txt
```

Endpoints:
- `GET /api/live` — content + recipes + tonight + knowledge text + `source`
- `GET /api/content` — content (+ `_meta.source`)
- `GET /api/dinner/tonight` — tonight's menu
- `POST /api/ask` — `{ "question": "What time pick up Zizi?" }`

## Force reset Supabase from repo (rare)

Set `FORCE_SEED_FROM_LOCAL=1` on the server once, or run `npm run seed`. This overwrites Admin data — use only intentionally.

## WhatsApp options

### A) Official Meta Cloud API (no always-on host)

1. Create a Meta WhatsApp Cloud API app + phone number.
2. Set Vercel env: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
3. Webhook URL: `https://zizi-family-hub.vercel.app/api/whatsapp`
4. In the group, ask with `?` prefix, e.g. `? Tonight dinner?`

### B) Baileys bot (QR + spare number, always-on host)

See `whatsapp-bot/README.md`. Runs on a PC/Pi/VPS with `pm2` or Docker, calls `POST /api/ask`.

## LLM (optional)

`OPENROUTER_API_KEY` + `OPENROUTER_MODEL=openrouter/free` (\$0), or `OPENAI_API_KEY`. Without either, built-in FAQ still answers schedule / meals / rules / pickup.
