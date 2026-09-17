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
echo "Blockscout: http://localhost:4000"

pnpm --parallel --stream --filter @clear/registry-hub --filter @clear/frontend-app run dev
