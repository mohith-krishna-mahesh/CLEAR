#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for CLEAR demo infrastructure." >&2
  exit 1
fi

bash scripts/compose.sh version >/dev/null
if ! docker info >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Docker is installed, but the Docker daemon is not running.

Start your Docker engine, then rerun:
  pnpm run demo:fresh

On macOS this usually means opening Docker Desktop, OrbStack, Colima,
or whichever Docker daemon provider you installed.
EOF
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install pnpm, then rerun this command." >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[demo:prepare] Created .env from .env.example"
fi

echo "[demo:prepare] Installing dependencies..."
CI=true pnpm install

echo "[demo:prepare] Generating Prisma client..."
pnpm run prisma:generate

echo "[demo:prepare] Building packages..."
pnpm run build

echo "[demo:prepare] Starting Docker infrastructure..."
pnpm run infra:up

echo "[demo:prepare] Waiting for Postgres..."
for _ in $(seq 1 60); do
  if bash scripts/compose.sh exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
bash scripts/compose.sh exec -T postgres pg_isready -U postgres >/dev/null

echo "[demo:prepare] Waiting for Besu RPC..."
node scripts/wait-for-demo.mjs rpc http://localhost:8545 180000

echo "[demo:prepare] Waiting for Graph Node..."
node scripts/wait-for-demo.mjs http http://localhost:8020 180000

echo "[demo:prepare] Deploying contracts..."
pnpm run contracts:deploy

echo "[demo:prepare] Syncing environment files..."
pnpm run env:sync

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "[demo:prepare] Granting genesis registry trust fixtures..."
pnpm run contracts:grant-trust

echo "[demo:prepare] Preparing and deploying subgraph..."
pnpm run subgraph:inject
pnpm run subgraph:codegen
pnpm run subgraph:build
pnpm run subgraph:deploy

echo ""
echo "CLEAR demo is prepared."
echo "Run: pnpm run app:dev"
echo "Frontend:   http://localhost:3000"
echo "Backend:    http://localhost:3001/health"
echo "Subgraph:   http://localhost:8000/subgraphs/name/clear/subgraph"
echo "Blockscout: http://localhost:4000"
