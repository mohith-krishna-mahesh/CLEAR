# Blockscout Explorer for CLEAR

Blockscout provides open-source EVM block exploration for the CLEAR Besu network.

## Standalone Quickstart

To run Blockscout and its dedicated PostgreSQL database:

```bash
docker compose -f infra/blockscout/docker-compose.blockscout.yml up -d
```

Once running, navigate to `http://localhost:4000` to view blocks, transactions, contract deployments, and token/credit settlement events in real time.

To stop and remove containers:
```bash
docker compose -f infra/blockscout/docker-compose.blockscout.yml down -v
```
