#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Resetting and starting the full CLEAR demo..."
exec pnpm run demo:fresh
