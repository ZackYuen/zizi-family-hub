#!/usr/bin/env bash
# Safe start/restart — never fails with "Process … not found"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NAME="zizi-whatsapp-bot"

# Drop forbidden project auth (root-owned trap) from .env if present
if [[ -f .env ]] && grep -qE '^AUTH_DIR=(\./)?auth_info' .env 2>/dev/null; then
  echo "[pm2-up] Removing AUTH_DIR=./auth_info from .env (use ~/.zizi-whatsapp-auth)"
  sed -i -E '/^AUTH_DIR=(\.\/)?auth_info/d' .env
fi

mkdir -p "${HOME}/.zizi-whatsapp-auth"
chmod 700 "${HOME}/.zizi-whatsapp-auth" 2>/dev/null || true

# Prefer deleting leftover project auth_info if we own it (ignore if root-owned)
if [[ -d auth_info ]]; then
  echo "[pm2-up] Warning: project ./auth_info exists — do not use it. Prefer: sudo rm -rf auth_info"
fi

if pm2 describe "$NAME" >/dev/null 2>&1; then
  echo "[pm2-up] Restarting $NAME (with --update-env)"
  pm2 restart "$NAME" --update-env
else
  echo "[pm2-up] Starting $NAME (first time / was deleted)"
  pm2 start ecosystem.config.cjs
fi

pm2 save
pm2 status "$NAME"
echo "[pm2-up] Logs: pm2 logs $NAME"
echo "[pm2-up] Confirm ONE process: pgrep -af 'whatsapp-bot/src/index'"
