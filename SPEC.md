# CLEAR Protocol Specification

## 1. Overview & Architecture

The **CLEAR** (Carbon Ledger for Emissions And Registries) protocol defines a minimal, chain-agnostic settlement protocol for verifiable cross-border carbon credit transfers between sovereign jurisdictions under Article 6 of the Paris Agreement.

CLEAR intentionally decouples **settlement verification** from **credit custody and issuance**:
- **Sovereign System of Record**: Each national or independent registry (e.g. Verra, Gold Standard, national NDC registries) maintains full custody and database records over its projects, issuances, and serial numbers.
- **Settlement Fabric**: The CLEAR blockchain anchors only atomic settlement lifecycle transitions, public audit references, and cryptographic proofs of bilateral consent.

---

## 2. Core Protocol Guarantees

### 2.1 RegistryDirectory Guarantees
1. **Uniqueness of Signer**: An Ethereum address can be bound to at most one registry ID at any point in time.
2. **Deterministic Trust State**: A registry exists in exactly one trust tier: `NONE`, `PENDING`, `OBSERVER`, `VERIFIED`, or `REVOKED`.
3. **Strict Authorization Delegation**: Only `council` can promote to `OBSERVER`, approve to `VERIFIED`, reject, revoke, or force-rotate keys.
4. **Autonomous Signer Rotation**: A verified registry signer may rotate its authorized signing address to an unclaimed address at any time without council intervention.

### 2.2 CLEARSettlement Guarantees
1. **Admission Enforcement**: Only signers possessing `TrustTier.VERIFIED` in `RegistryDirectory` can initiate, complete, or cancel transfers.
2. **Bilateral Consent**:
   - `sourceRegistry` initiates a transfer, binding `destRegistry`, `creditReference`, and `amount`.
   - Only `destRegistry` can call `completeTransfer`.
   - Only `sourceRegistry` can call `cancelTransfer`.
3. **Deterministic State Transitions**: A transfer starts at `INITIATED` and can only reach a terminal state once (`COMPLETED`, `CANCELLED`, or `EXPIRED`).
4. **Time-Bounded Expiry**: Any actor may trigger `expireTransfer(transferId)` strictly if `block.timestamp > initiatedAt + expiryWindow` and the transfer is still `INITIATED`.

---

## 3. Transfer State Machine

```text
               +---------------+
               |   [Pending]   |
               +-------+-------+
                       |
              initiateTransfer()
                       |
                       v
               +---------------+
         +---->|   INITIATED   |<----+
         |     +-------+-------+     |
         |             |             |
 cancelTransfer()      |       completeTransfer()
         |             |             |
         v             v             v
   +-----------+  +---------+  +-----------+
   | CANCELLED |  | EXPIRED |  | COMPLETED |
   +-----------+  +---------+  +-----------+
    (Terminal)    (Terminal)    (Terminal)
                       ^
                       |
               expireTransfer()
             [now > init + window]
```

- **`INITIATED`**: Source registry has reserved the credit in its local inventory and committed the settlement record on-chain.
- **`COMPLETED`**: Destination registry has validated the counterparty, acknowledged receipt, and completed the settlement. Both registries finalize inventory updates.
- **`CANCELLED`**: Source registry aborted the transfer before destination acceptance. Reserved credits in source inventory are unreserved (`ACTIVE`).
- **`EXPIRED`**: The timeout window elapsed without destination completion. Anyone can mark the transfer expired, allowing the source registry to unlock reserved inventory.

---

## 4. Local Credit Inventory Lifecycle (§6)

Within each registry's local database (`registry-hub` schema `registry_<id>`), credit units follow this state transition model:

1. **`ACTIVE`**: Credit is available for trading, holding, or retirement in the originating registry.
2. **`RESERVED`**: Once `initiateTransfer` is called, the specified credit quantity is marked `RESERVED` locally to prevent double-spending or concurrent transfer.
3. **`TRANSFERRED`**: Once `completeTransfer` is confirmed on-chain, the status transitions to `TRANSFERRED` in the source registry. Simultaneously, the destination registry creates a corresponding incoming credit record in its own schema.
4. **`ACTIVE` (Unreserved)**: If the transfer is `CANCELLED` or `EXPIRED`, the reserved quantity is returned to `ACTIVE`.

---

## 5. Threat Model & Known Limitations

> [!IMPORTANT]
> **CLEAR verifies settlement and authorization, not credit provenance.**

1. **Provenance Boundary**: CLEAR does not inspect or validate whether an underlying reforestation project, direct air capture facility, or renewable energy credit actually resulted in 1 metric ton of CO2 sequestration. That guarantee sits entirely with:
   - The accreditation process enforced by the `RegistryDirectory` council.
   - External audit networks and metadata bridges (e.g. Climate Action Data Trust / CAD Trust).
2. **Off-Chain Sovereign Desynchronization**: If a sovereign nation modifies its domestic database without calling CLEAR, on-chain state remains consistent with cryptographic proofs submitted up to that block. Jurisdictional audits detect desynchronization by comparing `TransferCache` with on-chain events.
3. **Cryptographic Signer Custody**: Key compromise of a `VERIFIED` registry signer allows unauthorized settlement initiation. The protocol mitigates this via `council` emergency key revocation (`forceRotateSigner` / `revokeRegistry`) and configurable signer custody strategies (such as HashiCorp Vault Transit or enterprise KMS).
