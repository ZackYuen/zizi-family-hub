# Zizi Family WhatsApp bot (Baileys — always-on)

Unofficial WhatsApp Web client. Uses a **normal WhatsApp account** (scan QR), listens in your family group, and answers via the live family hub Ask API (`/api/ask` → schedule / meals / rules + optional OpenRouter free LLM).

> **Risks:** Unofficial. Can break when WhatsApp changes; account may be restricted. Prefer a **spare phone number**, not Charlene’s or Sir’s main line. Keep the process running 24/7.

## Requirements

- Node 20+
- Always-on host: home PC / Raspberry Pi / cheap VPS (not Vercel)
- Live site Ask API deployed (`https://zizi-family-hub.vercel.app/api/ask/`)
- Optional on Vercel: `OPENROUTER_API_KEY` for smarter answers

## Quick start (PC / VPS)

```bash
cd household-hub/whatsapp-bot
cp .env.example .env
npm install
npm start
```

1. Terminal shows a **QR code**.
2. On the spare phone: WhatsApp → **Linked Devices** → Link a device → scan.
3. Add that WhatsApp number to the family group.
4. Set `GROUP_JIDS` in `.env` to your **family group only** (see Env below).
5. In the family group try:
   - `? Tonight dinner?`
   - `@CharleneBot What time pick up Zizi?`

Leave the terminal / process running. Closing it = bot offline.

## Keep it always on

### pm2 (simple)

**Always use `npm run pm2:up`** (start *or* restart). Do not use bare `pm2 restart` — that errors with `Process … not found` when the app was never registered.

```bash
npm install -g pm2
cd household-hub/whatsapp-bot
npm run pm2:up          # start or restart safely
pm2 startup             # follow the printed command (once)
```

Logs: `pm2 logs zizi-whatsapp-bot`  

Session lives in **`~/.zizi-whatsapp-auth`** (never project `./auth_info`).  
QR again after logout / EACCES / MessageCounterError: wipe home session + remove project auth, then rescan (see Troubleshooting).

### Docker

```bash
cd household-hub/whatsapp-bot
cp .env.example .env
docker compose up --build
# scan QR from logs, then Ctrl+C and:
docker compose up -d
```

### Power settings (if using a notebook)

- Plugged in: **never sleep**
- Lid close: do nothing / display off only  
Screen lock is usually OK; **sleep is not**.

## Triggers

Bot replies only when:

- Message starts with `?` / fullwidth `？` (or `TRIGGER_PREFIX`), or
- Starts with `bot:` / `ask:`, or
- Mentions `@CharleneBot` / contains `CharleneBot`, or
- WhatsApp @-mention of the bot number

**Groups:** only chats listed in `GROUP_JIDS` (required). Other groups are ignored — so a random `?` elsewhere will not get a reply.

### Save into Admin (knowledge / meals)

| Command | Effect |
|---------|--------|
| `?today` / `?tonight eat what?` / `?tonight dinner` | **No today menu** — leftover fridge check-in (does not list dishes) |
| `?leftover eggs tomato pork` | Suggest Meals dishes from leftover fridge ingredients; then `?1` to save tonight. No match → ask us |
| `?today honey wings` | Lists **similar Meals with numbers**. Then `?today 1` or `?1`. Same category as a dish already on that day → `?overwrite` (replace that cat only) or `?also` (keep old + new). Other cats stay |
| `?tomorrow …` / `?bukas …` | Same for **tomorrow** |
| `?menu` | Show tonight + tomorrow |
| `?menu today: …` `tomorrow: …` | Set both days in one message |
| `?today clear` | Tonight: no saved menu (not random) |
| `?add https://youtube.com/…` or `?add https://instagram.com/reel/…` | LLM-digests the video/caption → **Meals library**. Duplicate YouTube ids / Instagram reels are skipped |
| `?save …` or `?save "…"` | Digested → Admin → WA Inbox (tip / recipe / note) |
| `?save tip …` / `?save recipe …` / `?note …` | Same (legacy forms; still digested) |
| Normal `? …` asks | Logged in inbox (Q&A) for review |

**`?today` / `?tomorrow` / `?menu`:** Bot → `POST /api/meals/menu` (`INBOX_SECRET`). Fallback: Ask detects the command and writes the dinner override.

**`?add`:** Bot → `POST /api/meals/add` (`INBOX_SECRET`). Fallback: Ask detects `add …` and writes Meals itself.

**`?save`:**
1. **Bot → `/api/inbox`** when `INBOX_SECRET` matches Vercel
2. **Bot → `/api/ask`** — Ask detects `save …` and stores to inbox (so even an outdated bot that only calls Ask still works after Vercel deploy)

Then open Admin → **WA Inbox** and promote `?save` items to HK Life or Meals.

## Env

| Variable | Meaning |
|----------|---------|
| `LIVE_ASK_URL` | Ask API URL (must end with `/`, e.g. `.../api/ask/`) |
| `INBOX_SECRET` | Same secret as Vercel — inbox + `?add` + `?today`/`?tomorrow` + **outbound queue** |
| `LIVE_INBOX_URL` | Optional override (default: Ask host `/api/inbox`) |
| `LIVE_OUTBOUND_URL` | Optional override (default: Ask host `/api/whatsapp/outbound/`) |
| `OUTBOUND_QUEUE` | `0` = do not poll/send the user-approved 1:1 queue (on by default) |
| `LIVE_MEALS_ADD_URL` | Optional override (default: Ask host `/api/meals/add`) |
| `LIVE_MEALS_MENU_URL` | Optional override (default: Ask host `/api/meals/menu`) |
| `BOT_NAME` | Name people type in group |
| `TRIGGER_PREFIX` | Default `?` |
| `GROUP_JIDS` | Fallback group(s) for **? replies** if Admin reply group is blank |
| `GROUP_ALLOW_ALL` | `1` = reply in every group (unsafe). Prefer Admin reply group / `GROUP_JIDS` |
| `REPLY_DM` | `1` to also answer private chats |
| `WHATSAPP_BOT_PAUSED` | `1` = local force-mute of **replies**. Outing + leftover reminders + outbound queue still send |
| `LIVE_BOT_STATUS_URL` | Optional; default = Ask host `/api/bot-status/` |
| `OUTING_REMINDERS` | `0` = do not send 1-hour Zizi outing pings (on by default) |
| `LEFTOVER_REMINDERS` | `0` = do not send the 10:00 leftover-fridge ask (on by default) |
| `AUTH_DIR` | Session folder (default `~/.zizi-whatsapp-auth`; project `./auth_info` is ignored) |

### Pause replies (no logout)

1. **Admin (preferred):** Settings → **Pause WhatsApp bot replies** → Save. Live Ask returns silence; bot checks `/api/bot-status` before replying.
2. **Local only:** set `WHATSAPP_BOT_PAUSED=1` in bot `.env`, then `npm run pm2:up`.
3. In-app Ask is **not** muted — only WhatsApp replies.

After deploying hub changes: on the VPS `git pull && npm run pm2:up` so the bot has the pause check.

## Outing reminders (1 hour before class)

When Zizi must **leave home for class**, the bot posts in the family group **1 hour before** that task’s start time — **only if the task has Admin → Schedule → Remind 1h on WhatsApp checked**. Skips Charlene’s day off. Usual school-day leave-home is 12:30 (WhatsApp 11:30). Interest-class dates leave at 11:30 (WhatsApp 10:30). Message includes the **Zizi school prep** checklist (temperature, form, towels, masks, water, empty food container for school tea time, hair, pickup card; Tuesday sportswear). FIL + EN only.

## Leftover dinner ask (10:00 HKT)

On work days the bot posts once from **10:00–16:00 HKT** a friendly reminder: please check the fridge leftovers and suggest dishes (Zizi: meat + veg, no spicy). No today menu and no bot reply needed. If she has no idea, ask us. Skips day off and when Admin → Settings → **Leftover dinner WhatsApp reminder** is off. Same reminder group as outing pings. `GET /api/reminders/leftover`.

**Which groups (two separate Admin fields)**

1. **Bot replies (? / @bot)** — Admin → Settings → **WhatsApp group for bot replies**. Blank = `GROUP_JIDS` in `.env`.
2. **Outing reminders** — Admin → Settings → **WhatsApp group for outing reminders**. Blank = **no reminder is sent** (does not use the reply group).

After Save, wait ~1 minute. After this code change: deploy hub, then on the VPS `git pull && npm run pm2:up`.

## User-approved outbound 1:1 (Grok Bot queue)

Sends **only** messages that were enqueued with the shared `INBOX_SECRET`. Nothing unsolicited. Delivery is from the existing **spare / linked WhatsApp number** (this Baileys bot), not a personal phone.

This is **unofficial WhatsApp** (Baileys). Use it only for messages the user has explicitly approved (landlord, hotel, booking, etc.). Do not blast, market, or auto-message strangers.

Family-group `?` / `@CharleneBot` Q&A and outing/leftover reminders are unchanged. Replies in those 1:1 property/hotel chats are **captured into the hub** and **not** answered as CharleneBot.

After merge: **deploy the Vercel hub first**, then on the always-on host:

```bash
cd ~/zizi-family-hub/household-hub/whatsapp-bot   # or your clone path
git pull
npm run pm2:up
```

Queue rows live in Supabase `app_data` key `whatsapp_outbound` (not git seed / Admin content). No new SQL migration. `INBOX_SECRET` must already be set on Vercel and in the bot `.env`.

### API contract (copy-paste)

Base: `https://zizi-family-hub.vercel.app`  
Auth (every call below): header `x-inbox-secret: <INBOX_SECRET>`  
(same secret as `POST /api/inbox`). Trailing slashes are fine.

One destination per enqueue. Text is trimmed; empty text is rejected; body is capped at 4000 characters. HK 8-digit numbers become `852…@s.whatsapp.net`. Group JIDs (`…@g.us`) only when you pass that JID explicitly.

#### 1. Enqueue after the user approves a draft

`POST /api/whatsapp/outbound`

```http
POST /api/whatsapp/outbound
Content-Type: application/json
x-inbox-secret: <INBOX_SECRET>

{
  "to": "85291234567",
  "text": "Hello, this is about the lease renewal.",
  "purpose": "landlord",
  "conversationId": "lease-2026",
  "requestedBy": "grok-bot",
  "clientMessageId": "optional-idempotency-key"
}
```

`to` may be:

- HK local 8-digit (`91234567`)
- `852…` / `+852 9123 4567`
- international with country code (`+1 415 555 2671`)
- `https://wa.me/85291234567`
- WhatsApp JID `85291234567@s.whatsapp.net`
- group JID `120363…@g.us` (only if you really mean a group)

Optional: `purpose`, `conversationId` (defaults to the normalized JID), `requestedBy`, `clientMessageId` (idempotent enqueue — retries return the same `id`).

Success `201` (or `200` when `duplicate: true`):

```json
{
  "ok": true,
  "duplicate": false,
  "message": {
    "id": "out-1730000000000-abc123",
    "to": "85291234567",
    "jid": "85291234567@s.whatsapp.net",
    "kind": "dm",
    "text": "Hello, this is about the lease renewal.",
    "purpose": "landlord",
    "conversationId": "lease-2026",
    "requestedBy": "grok-bot",
    "clientMessageId": "optional-idempotency-key",
    "status": "pending",
    "createdAt": "2026-11-11T04:00:00.000Z"
  }
}
```

Statuses: `pending` → `sending` (bot claimed) → `sent` | `failed`.

Errors: `401` bad/missing secret · `400` validation (empty text, broadcast/multi-recipient, bad destination) · `503` Supabase not configured.

```bash
curl -sS -X POST 'https://zizi-family-hub.vercel.app/api/whatsapp/outbound/' \
  -H 'Content-Type: application/json' \
  -H "x-inbox-secret: $INBOX_SECRET" \
  -d '{"to":"85291234567","text":"Hello — user-approved test.","purpose":"landlord","conversationId":"lease-2026","requestedBy":"grok-bot","clientMessageId":"draft-1"}'
```

#### 2. Inspect or claim pending (bot)

`GET /api/whatsapp/outbound?status=pending` — list, do not claim.  
`GET /api/whatsapp/outbound?status=pending&claim=1&limit=5` — bot: mark `sending`, then send.  
`GET /api/whatsapp/outbound?id=out-…` · `?conversationId=lease-2026` · `?jid=85291234567`

```json
{ "ok": true, "claimed": true, "messages": [ { "id": "out-…", "jid": "852…@s.whatsapp.net", "text": "…", "status": "sending" } ] }
```

#### 3. Ack sent / failed (bot; idempotent)

`POST /api/whatsapp/outbound/ack`

```json
{ "id": "out-1730000000000-abc123", "status": "sent", "waMessageId": "BAE5…", "jid": "85291234567@s.whatsapp.net" }
```

or `{ "id": "out-…", "status": "failed", "error": "not registered on WhatsApp" }`.

Repeating `sent` returns `duplicate: true` and does not change a message already `sent`. The bot also keeps a local sent log so a retry does not double-send.

#### 4. Fetch inbound replies (Grok Bot)

`GET /api/whatsapp/outbound/replies?conversationId=lease-2026`  
also `?jid=85291234567` · `?since=2026-11-11T00:00:00.000Z` · `?limit=50`

```json
{
  "ok": true,
  "replies": [
    {
      "id": "in-1730000001000-xyz",
      "jid": "85291234567@s.whatsapp.net",
      "conversationId": "lease-2026",
      "outboundMessageId": "out-1730000000000-abc123",
      "text": "Yes, please send the contract.",
      "fromName": "Landlord",
      "createdAt": "2026-11-11T04:05:00.000Z"
    }
  ]
}
```

```bash
curl -sS 'https://zizi-family-hub.vercel.app/api/whatsapp/outbound/replies/?conversationId=lease-2026' \
  -H "x-inbox-secret: $INBOX_SECRET"
```

The bot `POST`s replies to `/api/whatsapp/outbound/replies` for 1:1 chats that already have an outbound item. Unknown 1:1 chats are not stored and are not auto-answered unless `REPLY_DM=1` (existing behaviour).

## vs official Cloud API

| | This bot (Baileys) | Official `/api/whatsapp` |
|--|-------------------|---------------------------|
| Cost | Host only (\$0–few \$/mo) | Meta conversation fees |
| Always-on machine | **Required** | Not required (Vercel) |
| Account | Normal WhatsApp + QR | Business Cloud number |
| Ban / break risk | Higher | Lower |

You can run **both**; group members can use either path.

## Troubleshooting

- **`EACCES … auth_info/creds.json` + `MessageCounterError`:** project `./auth_info` is root-owned and/or **two bot processes**. Bot now refuses project `./auth_info` and uses `~/.zizi-whatsapp-auth`. Fix once:
  ```bash
  cd ~/zizi-family-hub/household-hub/whatsapp-bot
  git pull origin main
  pm2 delete zizi-whatsapp-bot 2>/dev/null || true
  pkill -f 'whatsapp-bot/src/index.js' || true
  sudo rm -rf auth_info ~/.zizi-whatsapp-auth
  sed -i -E '/^AUTH_DIR=(\.\/)?auth_info/d' .env 2>/dev/null || true
  mkdir -p ~/.zizi-whatsapp-auth && chmod 700 ~/.zizi-whatsapp-auth
  node src/index.js   # must print: Session folder writable: /home/ocuser/.zizi-whatsapp-auth
  # scan QR — never sudo — then Ctrl+C
  npm run pm2:up
  pgrep -af 'whatsapp-bot/src/index'   # must be ONE line
  ```
- **`pm2 restart` → Process not found:** use `npm run pm2:up` instead (starts if missing).
- **No QR:** wait a few seconds; check firewall. Run foreground: `node src/index.js` (not only `pm2 logs`).
- **Logged out / MessageCounterError / Connection Closed:** usually same as EACCES or two instances — wipe session, unlink old Linked Devices, start **one** process via `npm run pm2:up`, scan once.
- **`mmg.whatsapp.net` 403 / “transaction failed”:** history/media sync noise — ignore for text asks. Current bot skips history sync (`shouldSyncHistoryMessage: false`).
- **Logs quiet when you send a message:** bot only answered `[ask]` before; now it also prints `[msg] ignore/skip …`. If you still see **nothing** after a send:
  1. Confirm `[ok] Connected as …` in `pm2 logs`.
  2. Test in the **family group** listed in `GROUP_JIDS` (not another group; not a 1:1 chat unless `REPLY_DM=1`).
  3. Bot WhatsApp number must be **in that group**.
  4. Message must start with `?` (e.g. `? Tonight dinner?`) from a **different** phone than the linked device.
  5. If logs say `groups off` / `set GROUP_JIDS`, add the family `…@g.us` id from a `[msg] skip …@g.us` line, then `npm run pm2:up`.
- **Bot connected but silent:** check Admin → Settings pause, or `WHATSAPP_BOT_PAUSED=1`, or logs `[msg] paused`. Unpause + Save (or unset env) then `npm run pm2:up`.
- **No reply / Ask API error:** ensure `LIVE_ASK_URL` ends with `/` (`.../api/ask/`). Check `pm2 logs` for `[ask]`; confirm message used `?` or @bot from a **different** phone than the linked device.
- **Ask API 404:** merge/deploy PR with `/api/ask` first.
- **`?save` says “could not find that”:** Azure bot is outdated *and* Vercel not yet deployed with Ask-side save. Deploy this app, then on Azure: `git pull && pm2 restart zizi-whatsapp-bot`. Footer `_(live · date)_` also means the bot binary is old.
- **Footer still `_(live · …)_`:** pull latest bot and restart pm2 — should become `_(Zizi Family Hub)_`.

