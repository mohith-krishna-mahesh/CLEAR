// SPDX-License-Identifier: Apache-2.0

export enum TrustTier {
  NONE = 0,
  PENDING = 1,
  OBSERVER = 2,
  VERIFIED = 3,
  REVOKED = 4
}

export type TrustTierString = "NONE" | "PENDING" | "OBSERVER" | "VERIFIED" | "REVOKED";

export interface RegistryInfo {
  registryId: bigint;
  signer: string;
  name: string;
  jurisdiction: string;
  metadataURI: string;
  tier: TrustTier;
  appliedAt: bigint;
  decidedAt: bigint;
}
