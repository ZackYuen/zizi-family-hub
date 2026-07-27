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
4. In the group try:
   - `? Tonight dinner?`
   - `@CharleneBot What time pick up Zizi?`

Leave the terminal / process running. Closing it = bot offline.

## Keep it always on

### pm2 (simple)

```bash
npm install -g pm2
cd household-hub/whatsapp-bot
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command
```

Logs: `pm2 logs zizi-whatsapp-bot`  
QR again after logout: delete `auth_info/` and `pm2 restart zizi-whatsapp-bot`.

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

- Message starts with `?` (or `TRIGGER_PREFIX`), or
- Starts with `bot:` / `ask:`, or
- Mentions `@CharleneBot` / contains `CharleneBot`, or
- WhatsApp @-mention of the bot number

### Save into Admin (knowledge / meals)

| Command | Effect |
|---------|--------|
| `?save …` or `?save "…"` | Digested → Admin → WA Inbox (tip / recipe / note) |
| `?save tip …` / `?save recipe …` / `?note …` | Same (legacy forms; still digested) |
| Normal `? …` asks | Logged in inbox (Q&A) for review |

Works two ways:
1. **Bot → `/api/inbox`** when `INBOX_SECRET` matches Vercel
2. **Bot → `/api/ask`** — Ask detects `save …` and stores to inbox (so even an outdated bot that only calls Ask still works after Vercel deploy)

Then open Admin → **WA Inbox** and promote to HK Life or Meals.

## Env

| Variable | Meaning |
|----------|---------|
| `LIVE_ASK_URL` | Ask API URL (must end with `/`, e.g. `.../api/ask/`) |
| `INBOX_SECRET` | Same secret as Vercel — preferred inbox path |
| `LIVE_INBOX_URL` | Optional override (default: Ask host `/api/inbox`) |
| `BOT_NAME` | Name people type in group |
| `TRIGGER_PREFIX` | Default `?` |
| `GROUP_JIDS` | Optional allowlist of group IDs |
| `REPLY_DM` | `1` to also answer private chats |
| `AUTH_DIR` | Session folder (default `./auth_info`) |

## vs official Cloud API

| | This bot (Baileys) | Official `/api/whatsapp` |
|--|-------------------|---------------------------|
| Cost | Host only (\$0–few \$/mo) | Meta conversation fees |
| Always-on machine | **Required** | Not required (Vercel) |
| Account | Normal WhatsApp + QR | Business Cloud number |
| Ban / break risk | Higher | Lower |

You can run **both**; group members can use either path.

## Troubleshooting

- **`EACCES … auth_info/creds.json`:** usually root-owned `./auth_info` or **two bot processes**. Prefer home session dir (`~/.zizi-whatsapp-auth`). Fix:
  ```bash
  pm2 delete zizi-whatsapp-bot
  pkill -f 'whatsapp-bot/src/index.js' || true
  # stop using project ./auth_info
  sudo rm -rf auth_info
  # remove AUTH_DIR=./auth_info from .env if present
  sed -i '/^AUTH_DIR=/d' .env 2>/dev/null || true
  git pull
  mkdir -p ~/.zizi-whatsapp-auth && chmod 700 ~/.zizi-whatsapp-auth
  node src/index.js   # must print Session folder writable: /home/…/.zizi-whatsapp-auth
  # scan QR — never sudo — then Ctrl+C
  pm2 start ecosystem.config.cjs && pm2 save
  # confirm only ONE process:
  pm2 status
  pgrep -af 'whatsapp-bot/src/index'
  ```
- **No QR:** wait a few seconds; check firewall. Run foreground: `node src/index.js` (not only `pm2 logs`).
- **Logged out / MessageCounterError / Connection Closed:** usually same as EACCES or two instances — wipe session, unlink old devices, start **one** process, scan once.
- **`mmg.whatsapp.net` 403 / “transaction failed”:** history/media sync noise — ignore for text asks. Current bot skips history sync (`shouldSyncHistoryMessage: false`).
- **Logs quiet when you send a message:** bot only answered `[ask]` before; now it also prints `[msg] ignore/skip …`. If you still see **nothing** after a send:
  1. Confirm `[ok] Connected as …` in `pm2 logs`.
  2. Test in the **family group**, not a 1:1 chat (`REPLY_DM=0` by default).
  3. Bot WhatsApp number must be **in that group**.
  4. Message must start with `?` (e.g. `? Tonight dinner?`) from a **different** phone than the linked device.
  5. `grep GROUP_JIDS .env` — if set, it must match the group id from logs.
- **No reply / Ask API error:** ensure `LIVE_ASK_URL` ends with `/` (`.../api/ask/`). Check `pm2 logs` for `[ask]`; confirm message used `?` or @bot from a **different** phone than the linked device.
- **Ask API 404:** merge/deploy PR with `/api/ask` first.
- **`?save` says “could not find that”:** Azure bot is outdated *and* Vercel not yet deployed with Ask-side save. Deploy this app, then on Azure: `git pull && pm2 restart zizi-whatsapp-bot`. Footer `_(live · date)_` also means the bot binary is old.
- **Footer still `_(live · …)_`:** pull latest bot and restart pm2 — should become `_(Zizi Family Hub)_`.

