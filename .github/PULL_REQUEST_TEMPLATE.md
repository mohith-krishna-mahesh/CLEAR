## Description
Briefly explain the changes in this pull request and link any relevant issues.

## Workstream
Select the primary workstream(s) touched:
- [ ] **P1**: Contracts / Backend Core (`contracts/`, `services/registry-hub/src/{routes,controllers,blockchain,services,db}`)
- [ ] **P2**: Frontend / Subgraph (`frontend/app/`, `subgraph/`)
- [ ] **P3**: Infra / Strategies (`infra/`, `services/registry-hub/src/services/*strategy*`, `demo/`)

## PR Checklist
- [ ] All tests pass locally (`pnpm test` at root).
- [ ] No naming deviations from protocol specification (`registry-hub`, `credit-inventory`, etc.).
- [ ] No schema qualification tags in tenant Prisma models (dynamic schema-per-tenant routing preserved).
- [ ] No secrets or unencrypted private keys committed.
- [ ] Apache-2.0 headers maintained on relevant files.
- [ ] Branch conforms to `feature/*`, `fix/*`, or `docs/*`.
