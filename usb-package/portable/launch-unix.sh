#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4173}"
export PORTABLE_ROOT="$ROOT"
export PORT

if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  echo "Node.js is required for this portable launcher. Bundle a Node runtime in portable/runtime/node for a no-install USB package." >&2
  exit 2
fi

"$NODE_BIN" "$ROOT/portable/start-runtime.mjs" &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
sleep 2
URL="http://127.0.0.1:${PORT}"
if command -v open >/dev/null 2>&1; then open "$URL" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 || true
fi
wait "$PID"
