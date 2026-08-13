#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4173}"
export PORTABLE_ROOT="$ROOT"
export PORT

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
if [[ "$OS" == "darwin" ]]; then
  PLATFORM_KEY="$([[ "$ARCH" == "arm64" ]] && echo macos-arm64 || echo macos-x64)"
else
  PLATFORM_KEY="$([[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]] && echo linux-arm64 || echo linux-x64)"
fi

BUNDLED_NODE="$ROOT/portable-runtime/$PLATFORM_KEY/node"
if [[ -x "$BUNDLED_NODE" ]]; then
  NODE_BIN="$BUNDLED_NODE"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  echo "No compatible Node.js runtime found. Add portable-runtime/$PLATFORM_KEY/node or install Node.js 22+." >&2
  exit 2
fi

"$NODE_BIN" "$ROOT/portable/start-runtime.mjs" &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
wait "$PID"
