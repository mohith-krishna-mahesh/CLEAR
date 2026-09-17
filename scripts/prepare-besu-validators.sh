#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VALIDATORS_DIR="$ROOT/infra/besu/validators"

mkdir -p \
  "$VALIDATORS_DIR/validator-1/data" \
  "$VALIDATORS_DIR/validator-2/data" \
  "$VALIDATORS_DIR/validator-3/data"

printf '%s\n' "8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63" > "$VALIDATORS_DIR/validator-1/data/key"
printf '%s\n' "c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3" > "$VALIDATORS_DIR/validator-2/data/key"
printf '%s\n' "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b175264574d368dd989fef" > "$VALIDATORS_DIR/validator-3/data/key"

chmod 600 \
  "$VALIDATORS_DIR/validator-1/data/key" \
  "$VALIDATORS_DIR/validator-2/data/key" \
  "$VALIDATORS_DIR/validator-3/data/key"
