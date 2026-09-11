# CLEAR (Carbon Ledger for Emissions And Registries)

> **A settlement-only blockchain protocol for verifiable cross-border transfers between sovereign carbon registries.**

CLEAR provides an immutable, decentralized settlement fabric enabling sovereign national and voluntary carbon registries to execute verifiable, bilateral Article 6 credit transfers without relinquishing registry custody or governance. Registries remain sovereign systems of record: underlying project credentials, legal ownership, and issuance records remain in local national or voluntary registries. Only cryptographically hashed settlement events and authorization states are anchored on-chain, preventing double-counting while preserving jurisdictional independence.

---

## Architecture

```text
+-------------------------------------------------------------------------------+
|                             CLIENT / APPLICATION LAYER                         |
|  +---------------------------+  +-------------------+  +-------------------+  |
|  |     Audit Explorer        |  |  Council Gov UI   |  |   Registry Portal |  |
|  |     (Public Read)         |  |   (Safe Multisig) |  |   (Auth'd Tenant) |  |
|  +-------------+-------------+  +---------+---------+  +---------+---------+  |
+----------------|--------------------------|----------------------|------------+
                 | (GraphQL)                | (REST API)           | (REST API)
+----------------v--------------------------v----------------------v------------+
|                         INDEXING & INTEGRATION LAYER                           |
|  +---------------------------+              +------------------------------+  |
|  |      Graph Subgraph       |              |        registry-hub          |  |
|  | (Event Indexing & Audit)  |              |    (Multi-Tenant Gateway)    |  |
|  +-------------+-------------+              +--------------+---------------+  |
|                |                                           |                  |
|                |                                    [Tenant Schemas]          |
|                |                              Postgres: control_plane +       |
|                |                              registry_<id> search_path       |
+----------------|-------------------------------------------|------------------+
                 | (RPC Event Sync)                          | (Ethers.js RPC)
+----------------v-------------------------------------------v------------------+
|                            SETTLEMENT PROTOCOL LAYER                          |
|                       (Hyperledger Besu / IBFT2 PoA)                          |
|                                                                               |
|  +-------------------------------------+  +--------------------------------+  |
|  |        RegistryDirectory.sol        |  |       CLEARSettlement.sol      |  |
|  |   - Council Admission & Tiers       |  |   - Transfer State Machine     |  |
|  |   - Key Rotation & Governance       |  |   - Settlement Nonces & Hashes |  |
|  |   - Trust Delegation Authority      |  |   - Expiry & Finality Logic    |  |
|  +-------------------------------------+  +--------------------------------+  |
|                                                                               |
|  [Blockscout Explorer: Port 4000]                                              |
+-------------------------------------------------------------------------------+
```

---

## Quickstart

### Prerequisites
- Node.js v20+
- `pnpm` v9+
- Docker & Docker Compose v2.20+ (required for `include:` support in `docker-compose.yml`)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Spin Up Infrastructure
Start the private Besu 3-validator IBFT2 network, Blockscout explorer, and dev services:
```bash
docker compose up -d
```

> **Note on Docker Compose:** The root `docker-compose.yml` uses the top-level `include:` directive to compose the Besu IBFT2 cluster and Blockscout explorer. This requires Docker Compose v2.20 or newer.

### 4. Deploy Smart Contracts to Besu
Deploy `RegistryDirectory` and `CLEARSettlement` onto the local Besu network:
```bash
pnpm --filter contracts run deploy:local
```

Deployments, addresses, and ABIs will be written to `contracts/deployments/besu-local.json` and mirrored to `shared/abi/`.

---

## Project Structure

- **`contracts/`**: Solidity contracts (`RegistryDirectory.sol`, `CLEARSettlement.sol`), Hardhat unit tests, Foundry fuzz tests, Slither static analysis config, and deployment scripts.
- **`services/registry-hub/`**: The single multi-tenant backend service managing schema-per-tenant Postgres storage, verification strategies, signer custody, and API endpoints.
- **`frontend/app/`**: Vite + React + Tailwind frontend application containing the Audit, Governance, and Registry interfaces.
- **`subgraph/`**: The Graph indexing package defining the entities and event handlers for on-chain CLEAR contracts.
- **`shared/`**: Shared TypeScript types, contract constants, and ABIs consumed across contracts, backend, frontend, and subgraph.
- **`infra/`**: Docker Compose setups and configurations for the Hyperledger Besu IBFT2 cluster (`infra/besu/`) and Blockscout explorer (`infra/blockscout/`).
- **`demo/`**: Live demo walkthrough scripts and database reset automation.
- **`.github/`**: CI/CD workflows for linting, compilation, unit tests, fuzz testing, and static analysis.

---

## License

CLEAR is licensed under the [Apache License, Version 2.0](LICENSE).
