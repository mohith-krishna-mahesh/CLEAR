# CLEAR Live Demo Walkthrough Script

This script walks through an end-to-end Article 6 carbon credit settlement demonstration using the CLEAR protocol, `registry-hub`, the React portal, and Blockscout.

---

## Prerequisites
1. Docker compose is running: `docker compose up -d`
2. Contracts deployed to Besu: `pnpm --filter contracts run deploy:local`
3. Backend service running on `http://localhost:3001`
4. Frontend running on `http://localhost:3000`
5. Blockscout explorer accessible on `http://localhost:4000`

---

## Step 1: Onboard Sovereign Registries
1. **Registry Alpha Application**:
   - Navigate to `http://localhost:3000/registry/signup`.
   - Submit:
     - Name: `Registry Alpha (Costa Rica)`
     - Jurisdiction: `CRI`
     - Metadata URI: `ipfs://QmAlphaMetadataHash`
   - Notice that status is set to `PENDING` on `RegistryDirectory.sol`.

2. **Registry Beta Application**:
   - Submit:
     - Name: `Registry Beta (Switzerland)`
     - Jurisdiction: `CHE`
     - Metadata URI: `ipfs://QmBetaMetadataHash`

---

## Step 2: Council Governance Approval
1. Open `http://localhost:3000/gov/login` and log in as the council multisig representative.
2. Navigate to `http://localhost:3000/gov/pending`.
3. Review and click **Approve** for both Registry Alpha and Registry Beta.
4. Verify on `RegistryDirectory.sol` that both registries now possess `TrustTier.VERIFIED`.

---

## Step 3: Public Audit Verification
1. Navigate to `http://localhost:3000/audit/registries`.
2. Observe both Registry Alpha and Registry Beta listed with green `VERIFIED` badges and their respective public signer addresses.

---

## Step 4: Credit Issuance in Source Registry
1. Sign in to Registry Alpha's portal: `http://localhost:3000/registry/login`.
2. Inspect `http://localhost:3000/registry/credits`:
   - Observe active credit record: `CR-9021` (Vintage 2024, 10,000 tCO2e, status: `ACTIVE`).

---

## Step 5: Initiate Cross-Border Transfer (Alpha -> Beta)
1. In Registry Alpha's portal, navigate to `http://localhost:3000/registry/transfers/new`.
2. Enter:
   - Destination Signer: `<Registry Beta Signer Address>`
   - Credit ID: `CR-9021`
   - Amount: `5000`
3. Click **Initiate On-Chain Settlement**:
   - `registry-hub` invokes the Credit Inventory strategy to mark 5,000 units `RESERVED`.
   - `CLEARSettlement.initiateTransfer` emits `TransferInitiated(transferId, ...)`.

---

## Step 6: Destination Acceptance & Finality (Beta)
1. Sign in to Registry Beta's portal.
2. Navigate to `http://localhost:3000/registry/transfers/incoming`.
3. Click **Accept & Settle**:
   - `CLEARSettlement.completeTransfer(transferId)` is executed on-chain.
   - Event `TransferCompleted` is emitted.
   - In Alpha's inventory, status transitions to `TRANSFERRED`.
   - In Beta's inventory, 5,000 credits appear with status `ACTIVE`.

---

## Step 7: Dual-Audit Verification (Portal vs. Blockscout)
1. View `http://localhost:3000/audit/transfers`:
   - Check the completed transfer status and timestamp.
2. Open Blockscout at `http://localhost:4000`:
   - Inspect the block containing the `TransferCompleted` event.
   - Verify that raw transaction logs match the off-chain inventory state, confirming bilateral Article 6 settlement without double-counting.
