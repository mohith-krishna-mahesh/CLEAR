#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "up" ]; then
  desired_subnet="172.28.0.0/16"
  current_subnet="$(docker network inspect clear-network --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null || true)"
  if [ "$current_subnet" != "$desired_subnet" ]; then
    if [ -n "$current_subnet" ]; then
      docker network rm clear-network >/dev/null
    fi
    docker network create --subnet "$desired_subnet" clear-network >/dev/null
  fi
fi

if docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
fi

if command -v docker-compose >/dev/null 2>&1; then
  exec docker-compose "$@"
fi

cat >&2 <<'EOF'
Docker Compose is required for the CLEAR demo.

Install Docker Desktop with the Compose plugin, or install docker-compose,
then rerun the same pnpm command.
EOF
exit 1
