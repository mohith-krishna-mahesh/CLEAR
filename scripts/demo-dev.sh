#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo ".env is missing. Run pnpm run demo:prepare first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

export VITE_API_URL="${VITE_API_URL:-http://localhost:3001/api}"
export VITE_SUBGRAPH_URL="${VITE_SUBGRAPH_URL:-http://localhost:8000/subgraphs/name/clear/subgraph}"
export VITE_BLOCKSCOUT_URL="${VITE_BLOCKSCOUT_URL:-http://localhost:4000}"
export VITE_DEMO_FALLBACK="${VITE_DEMO_FALLBACK:-true}"

echo "Starting CLEAR app services..."
echo "Frontend:   http://localhost:3000"
echo "Backend:    http://localhost:3001/health"
echo "Subgraph:   http://localhost:8000/subgraphs/name/clear/subgraph"
echo "Explorer:   http://localhost:4000"
echo "Blockscout API: http://localhost:4001/api"

explorer_pid=""
if node -e "fetch('http://127.0.0.1:4000', { signal: AbortSignal.timeout(1000) }).then(() => process.exit(0)).catch(() => process.exit(1))"; then
  echo "Explorer already running on http://localhost:4000"
else
  node scripts/local-explorer.mjs &
  explorer_pid=$!
fi

cleanup() {
  if [ -n "$explorer_pid" ]; then
    kill "$explorer_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

pnpm --parallel --stream --filter @clear/registry-hub --filter @clear/frontend-app run dev
