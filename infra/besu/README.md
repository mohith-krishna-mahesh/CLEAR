# Hyperledger Besu IBFT2 Cluster

This directory manages the local 3-validator Hyperledger Besu IBFT2 private network for CLEAR.

## Architecture

- **Consensus**: IBFT2 (Istanbul Byzantine Fault Tolerant 2.0) with a 2-second block time and immediate finality.
- **Validators**: 3 nodes run simultaneously. Quorum is achieved with `floor((3 * 2) / 3) + 1 = 3` validators.
- **Port Mapping**: Node 1 exposes JSON-RPC on `http://localhost:8545`.

## Standalone Quickstart

To run the Besu cluster independently:

```bash
docker compose -f infra/besu/docker-compose.besu.yml up -d
```

To stop and remove containers:
```bash
docker compose -f infra/besu/docker-compose.besu.yml down -v
```

## Regenerating Validator Keys (IBFT2)

In production or testnet setup, validator keys are created using Besu's operator CLI:

```bash
# Generate private/public key pairs for 3 validators
besu --data-path=/tmp/besu-keygen operator generate-blockchain-config \
  --config-file=ibftConfigFile.json \
  --to=networkFiles \
  --private-key-file-name=key.priv

# Move the generated keys into validators/validator-{1,2,3}/data/key
# and update the extraData / validator address array in genesis.json
```
