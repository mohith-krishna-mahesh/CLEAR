export interface RegistryApplication {
  registryId: bigint;
  name: string;
  jurisdiction: string;
  metadataURI: string;
  signerAddress: string;
}

export interface VerificationDecision {
  approve: boolean;
  reason?: string;
}

export interface VerificationStrategy {
  /** Called right after a registry's on-chain application succeeds. */
  review(application: RegistryApplication): Promise<VerificationDecision>;
}
