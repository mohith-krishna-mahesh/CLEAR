# CLEAR Local Explorer and Blockscout API

Blockscout provides the EVM indexing API for the CLEAR Besu network. The demo serves a lightweight local explorer UI on port `4000` and keeps the Blockscout backend API available on port `4001`.

## Standalone Quickstart

To run Blockscout and its dedicated PostgreSQL database:

```bash
docker compose -f infra/blockscout/docker-compose.blockscout.yml up -d
```

Once the demo app is running, navigate to `http://localhost:4000` to view local blocks and transactions in real time. The Blockscout API backend is available at `http://localhost:4001/api`.

To stop and remove containers:
```bash
docker compose -f infra/blockscout/docker-compose.blockscout.yml down -v
```
