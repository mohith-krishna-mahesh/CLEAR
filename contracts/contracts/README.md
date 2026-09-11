<!-- 
NOTE ON FOLDER STRUCTURE:
The nested `contracts/contracts/` path is Hardhat's default and expected layout
(the outer `contracts/` is the monorepo workspace directory, and the inner `contracts/`
is Hardhat's contract source directory `contracts/contracts/*.sol`).
This is by design, not a mistake.
-->
# CLEAR Smart Contracts

Solidity smart contracts for the CLEAR protocol:
- `RegistryDirectory.sol`: Registry admission, trust tiers, and signer management governed by council.
- `CLEARSettlement.sol`: Minimal settlement protocol executing bilateral cross-border transfers.
- `interfaces/IRegistryDirectory.sol`: Interface for trust verification.
