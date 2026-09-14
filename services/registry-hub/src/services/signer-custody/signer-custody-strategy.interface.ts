export interface UnsignedTx {
  to: string;
  data: string;
  nonce: number;
  chainId: number;
  gasLimit: string;
}

export interface SignerCustodyStrategy {
  /** Called once at onboarding. Returns the newly generated signer's public address. */
  provisionSigner(registryId: string): Promise<{ address: string }>;

  /** Optional: import a known private key (local fixtures / genesis registries). */
  importSigner?(
    registryId: string,
    privateKey: string,
  ): Promise<{ address: string }>;

  /** Signs a contract call on this registry's behalf. */
  signTransaction(
    registryId: string,
    unsignedTx: UnsignedTx,
  ): Promise<{ signedTx: string }>;

  /** Rotates this registry's signer key. */
  rotateSigner(registryId: string): Promise<{ address: string }>;
}
