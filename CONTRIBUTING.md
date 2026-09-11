# Contributing to CLEAR

Thank you for contributing to CLEAR (Carbon Ledger for Emissions And Registries).

## Branching Model

- The `main` branch is strictly protected. Direct pushes to `main` are disabled.
- Create feature branches named according to convention:
  - `feature/<short-description>`
  - `fix/<short-description>`
  - `docs/<short-description>`
- All changes must be submitted via a Pull Request against `main`.
- All PRs must pass the CI checks (Hardhat tests, Foundry fuzzing, Slither static analysis, backend tests, and frontend build) before merging.

## Commit Message Convention

We follow Conventional Commits:

```text
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

Examples:
- `feat(contracts): add expiry window setter to CLEARSettlement`
- `fix(registry-hub): correct tenant search_path in Prisma factory`
- `test(contracts): add fuzz tests for transfer amount overflows`
- `docs(spec): clarify Article 6 settlement lifecycle`

## Running Tests Locally

### All Workspaces
To run tests across all workspaces:
```bash
pnpm test
```

### Contracts
To run Hardhat unit tests:
```bash
pnpm --filter contracts test
```

To run Foundry invariant/fuzz tests:
```bash
cd contracts && forge test
```

To run Slither static analysis:
```bash
cd contracts && slither . --config-file slither.config.json
```

### Backend (`services/registry-hub`)
```bash
pnpm --filter services/registry-hub test
```

### Frontend (`frontend/app`)
```bash
pnpm --filter frontend/app build
```

## Three-Stream Ownership & Collaboration

To enable seamless parallel development across three team members without file conflicts:
- **Stream P1 (Contracts & Backend Core)**: Smart contracts, `registry-hub` onboarding/transfer orchestration, schema provisioning, blockchain clients, and auth.
- **Stream P2 (Frontend & Subgraph)**: React frontend modes (Audit, Gov, Registry) and The Graph subgraph mappings.
- **Stream P3 (Infra & Strategy Implementations)**: Besu/Blockscout infrastructure, the four strategy implementations (custody, reference, inventory, verification), and demo scripts.

Please respect code ownership tags (`TODO(P1)`, `TODO(P2)`, `TODO(P3)`) and avoid modifying files outside your designated workstream without coordinating.
