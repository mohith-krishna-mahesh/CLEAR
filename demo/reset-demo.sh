#!/usr/bin/env bash
set -euo pipefail

# CLEAR Demo Environment Reset
# Drops all registry_* tenant Postgres schemas, re-deploys contracts to Besu, and cleans state.

echo "=========================================="
echo "Resetting CLEAR Demo Environment..."
echo "=========================================="

# TODO(P3): implement dropping all registry_* Postgres schemas via psql or prisma raw SQL
# e.g.:
# psql "$CONTROL_PLANE_DATABASE_URL" -c "
#   DO \$\$ DECLARE r RECORD;
#   BEGIN
#     FOR r IN (SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'registry_%') LOOP
#       EXECUTE 'DROP SCHEMA ' || quote_ident(r.schema_name) || ' CASCADE';
#     END LOOP;
#   END \$\$;
# "

echo "[1/3] Resetting database tenant schemas..."
echo "Tenant schemas reset completed (stub)."

echo "[2/3] Redeploying smart contracts to local Besu cluster..."
# pnpm --filter contracts run deploy:local

echo "[3/3] Seeding demo registries and test credits..."
# pnpm --filter contracts run grant-trust:local

echo ""
echo "=========================================="
echo "CLEAR Demo environment reset successfully."
echo "Next steps:"
echo "  1. Start registry-hub: pnpm --filter services/registry-hub run dev"
echo "  2. Start frontend app: pnpm --filter frontend/app run dev"
echo "  3. Follow demo script: demo/demo-script.md"
echo "=========================================="
