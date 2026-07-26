# Live data & agents

## Source of truth

| Environment | Truth |
|-------------|--------|
| Production (Vercel + Supabase) | **Admin Save → Supabase** |
| Local without Supabase | `data/content.json` |

Committed `content.json` is a **seed/backup**. Cloud agents must **not** assume the repo file matches what Charlene sees, and must **not** overwrite Admin data with seed dumps.

After you edit in Admin and click Save, the live site updates immediately. Repo files may stay old until someone exports or intentionally mirrors seed.

## How agents should read & write

### Read (always first)

```bash
cd household-hub && npm run fetch-live
# or
curl -s https://zizi-family-hub.vercel.app/api/live | jq .
```

### Write (default)

Build a **patch** (append / upsert by `id`, or `set` specific fields), then:

```bash
ADMIN_PASSWORD='…' npm run patch-live -- /tmp/patch.json
```

Example patch (add one appliance without wiping others):

```json
{
  "appendAppliances": [
    { "id": "app-example", "kind": "other", "priority": 99, "title": { "en": "…" }, "tips": { "en": "…" } }
  ]
}
```

Dry run (no Save):

```json
{ "dryRun": true, "appendAppliances": [ … ] }
```

### Rare full reset

Set `FORCE_SEED_FROM_LOCAL=1` on the server once, or run `npm run seed`. This **overwrites** Admin data — only when the user explicitly asks.

## Endpoints

- `GET /api/live` — content + recipes + tonight + knowledge text + `source`
- `GET /api/content` — content (+ `_meta.source`)
- `GET /api/dinner/tonight` — tonight's menu
- `POST /api/ask` — `{ "question": "What time pick up Zizi?" }`
- `PUT /api/admin/content` — Admin Save (cookie session) → Supabase

## Server auto-merge policy

On read, the server may **append missing ids** from seed (new guides/appliances). It must **not** replace whole Admin arrays (`appliances`, `groundRules`, etc.) with repo JSON.

## WhatsApp options

### A) Official Meta Cloud API (no always-on host)

1. Create a Meta WhatsApp Cloud API app + phone number.
2. Set Vercel env: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
3. Webhook URL: `https://zizi-family-hub.vercel.app/api/whatsapp`
4. In the group, ask with `?` prefix, e.g. `? Tonight dinner?`

### B) Baileys bot (QR + spare number, always-on host)

See `whatsapp-bot/README.md`. Runs on a PC/Pi/VPS with `pm2` or Docker, calls `POST /api/ask`.

## Schedule seasons

- Summer (through `schoolCalendar.summerEndsOn`): `weeklyScheduleSummer` + `ziziSchoolSummer`
- Term (from `schoolCalendar.termStartsOn`): `weeklySchedule` + `ziziSchool` (K3 PM)
- Rebuild: `node scripts/build-summer-k3-schedule.mjs path/to/live.json` then `npm run patch-live -- scripts/_patch-summer-k3.json`

## LLM (optional)

`OPENROUTER_API_KEY` + `OPENROUTER_MODEL=openrouter/free` (\$0), or `OPENAI_API_KEY`. Without either, built-in FAQ still answers schedule / meals / rules / pickup.
