# CLEAR Governance Model

This document outlines the governance architecture of the CLEAR (Carbon Ledger for Emissions And Registries) network.

## On-Chain Council Architecture

At the heart of CLEAR authorization is the `RegistryDirectory.sol` smart contract. The contract establishes:
- **Trust Tiers**: `NONE`, `PENDING`, `OBSERVER`, `VERIFIED`, `REVOKED`.
- **Council Role**: A dedicated `council` address endowed with sole authority to transition registries between trust tiers (`promoteToObserver`, `approveRegistry`, `rejectApplication`, `revokeRegistry`, `forceRotateSigner`, and `transferCouncil`).
- **Settlement Delegation**: `CLEARSettlement.sol` maintains zero authorization state of its own; it queries `RegistryDirectory.isVerified(msg.sender)` before allowing any cross-border settlement actions.

## Demo / Hackathon Phase: Gnosis Safe

For development, testing, and initial demonstration:
1. The `council` address is configured as a Gnosis Safe multisig (or local developer EOA address in automated test fixtures).
2. The initial deployment script assigns the deployer/team multi-signature threshold as the governing council.
3. Motions to admit new national or voluntary registries (e.g. "Registry Alpha", "Registry Beta") are submitted by calling `applyAsRegistry` from the applicant's designated signer, placing the applicant in `PENDING` status.
4. The council approves the application on-chain via `approveRegistry(registryId)`, promoting the registry to `VERIFIED`.

## Production Evolution: CLEAR Secretariat

In a live production deployment spanning sovereign nations:
1. **Accreditation Body (CLEAR Secretariat)**: Governance transitions from developer-held keys to a formal council representing accredited jurisdictional authorities (e.g., representatives from UNFCCC Article 6 supervisory bodies, national environmental ministries, and independent registry standards).
2. **Admission Criteria**: Prior to `approveRegistry`, candidates must submit cryptographically attested proof of sovereignty, ISO 14064 verification, and compliance with Article 6.2/6.4 reporting guidelines.
3. **Threshold Multisig / Timelocks**: Council decisions will execute through a production Gnosis Safe instance backed by hardware security modules (HSMs) and mandatory timelocks to prevent unilateral governance capture.
4. **Decentralized Revocation**: In the event of registry insolvency, double-issuance fraud, or regulatory revocation, the council executes `revokeRegistry(registryId)`, immediately severing the rogue registry's ability to initiate or complete settlements on `CLEARSettlement.sol`.
