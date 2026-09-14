#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

CONTROL_PLANE_DATABASE_URL="${CONTROL_PLANE_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/clear_db?schema=control_plane}"
PSQL_URL="${CONTROL_PLANE_DATABASE_URL%%\?*}"

echo "=========================================="
echo "Resetting CLEAR Demo Environment..."
echo "=========================================="

echo "[1/3] Dropping registry_* tenant schemas and control_plane tables..."
if command -v psql >/dev/null 2>&1; then
  psql "$PSQL_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'registry_%' OR schema_name = 'control_plane'
  ) LOOP
    EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(r.schema_name) || ' CASCADE';
  END LOOP;
END $$;
SQL
  echo "Tenant and control-plane schemas dropped."
else
  echo "psql not found — skip database drop. Install PostgreSQL client or drop schemas manually."
fi

echo "[2/3] Redeploying smart contracts..."
pnpm --filter @clear/contracts run deploy:local

echo "[3/3] Granting genesis trust to fixture registries..."
pnpm --filter @clear/contracts run grant-trust:local

echo "[+] Injecting addresses into subgraph.yaml"
pnpm --filter @clear/subgraph run inject-addresses || true

echo ""
echo "=========================================="
echo "CLEAR demo environment reset complete."
echo "Next steps:"
echo "  1. pnpm --filter @clear/registry-hub run dev"
echo "  2. pnpm --filter @clear/frontend-app run dev"
echo "  3. Follow demo/demo-script.md"
echo "=========================================="
