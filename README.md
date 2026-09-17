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

### One-command local demo

For a clean end-to-end demo from the repository root, run:

```bash
pnpm run demo:fresh
```

This command resets Docker volumes and Besu validator data, installs dependencies, generates Prisma client code, builds every package, starts Postgres/Besu/Blockscout/IPFS/Graph Node, deploys the contracts, syncs `.env` files with the deployed addresses, grants fixture registry trust, deploys the subgraph, and finally runs the backend and frontend together.

When it is running, open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:3001/health`
- Subgraph: `http://localhost:8000/subgraphs/name/clear/subgraph`
- Blockscout: `http://localhost:4000`

### Demo login credentials

Use these accounts in the local frontend demo:

| Role | URL | Registry ID | Email | Password |
| --- | --- | --- | --- | --- |
| Council | `http://localhost:3000/governance/pending` | n/a | `council@clear-ledger.org` | `council-secret-pass` |
| Registry Alpha | `http://localhost:3000/registry/login` | `1` | `admin@registry-alpha.org` | `password123` |
| Registry Beta | `http://localhost:3000/registry/login` | `2` | `admin@registry-beta.org` | `password123` |
| Registry Gamma | `http://localhost:3000/registry/login` | `3` | `admin@registry-gamma.org` | `password123` |

The council credentials are backed by the `COUNCIL_EMAIL` and `COUNCIL_PASSWORD` values in `.env`. Registry Alpha and Registry Beta are seeded into the backend by `pnpm run seed:demo` and are the live transfer demo accounts. Registry Gamma is available in frontend fallback/demo mode for pending-registry UI flows. Registries created through onboarding can also sign in with the email/password submitted in the application form.

For a non-destructive re-run that keeps existing Docker volumes and chain data:

```bash
pnpm run demo
```

To prepare infrastructure and deployment artifacts without starting the dev servers:

```bash
pnpm run demo:prepare
pnpm run app:dev
```

### Manual steps

### 1. Install Dependencies
```bash
pnpm run bootstrap
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
pnpm run contracts:deploy
pnpm run env:sync
```

Deployments, addresses, and ABIs will be written to `contracts/deployments/besu-local.json` and mirrored to `shared/abi/`.

### 5. Run Services

```bash
pnpm run app:dev
```

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
