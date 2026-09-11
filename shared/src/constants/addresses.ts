// SPDX-License-Identifier: Apache-2.0

/**
 * CONTRACT ADDRESSES - SINGLE SOURCE OF TRUTH
 * 
 * This file serves as the single source of truth for deployed contract addresses
 * across services/registry-hub, frontend/app, and subgraph.
 * 
 * In local development, the contracts deploy script (contracts/scripts/deploy.ts) writes
 * deployed addresses to contracts/deployments/besu-local.json and updates this configuration.
 * Environment variables (DIRECTORY_CONTRACT_ADDRESS, SETTLEMENT_CONTRACT_ADDRESS) override these
 * values at runtime if present.
 */

export interface DeploymentAddresses {
  registryDirectory: string;
  clearSettlement: string;
  network: string;
  chainId: number;
}

// Fallback defaults for pre-deployment scaffolding
export const DEFAULT_ADDRESSES: DeploymentAddresses = {
  registryDirectory: process.env.DIRECTORY_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  clearSettlement: process.env.SETTLEMENT_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  network: "besu-local",
  chainId: 1337
};

export function getAddresses(): DeploymentAddresses {
  try {
    // Dynamic load if running in an environment with deployment artifacts available
    const deployment = require("../../../contracts/deployments/besu-local.json");
    return {
      registryDirectory: process.env.DIRECTORY_CONTRACT_ADDRESS || deployment.RegistryDirectory?.address || DEFAULT_ADDRESSES.registryDirectory,
      clearSettlement: process.env.SETTLEMENT_CONTRACT_ADDRESS || deployment.CLEARSettlement?.address || DEFAULT_ADDRESSES.clearSettlement,
      network: deployment.network || DEFAULT_ADDRESSES.network,
      chainId: deployment.chainId || DEFAULT_ADDRESSES.chainId
    };
  } catch {
    return DEFAULT_ADDRESSES;
  }
}
