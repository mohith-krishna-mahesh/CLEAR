import {
  SignerCustodyStrategy,
  UnsignedTx,
} from "./signer-custody-strategy.interface";

/**
 * Sovereign Self-Custody strategy for registries holding their own private keys.
 * See SPEC.md §5 for threat model and sovereign signing details.
 */
export class SelfCustodyStrategy implements SignerCustodyStrategy {
  async provisionSigner(_registryId: string): Promise<{ address: string }> {
    // TODO(P3): allow external registry to supply pre-generated public key per SPEC.md
    throw new Error("Not implemented — production only");
  }

  async signTransaction(
    _registryId: string,
    _unsignedTx: UnsignedTx
  ): Promise<{ signedTx: string }> {
    // TODO(P3): dispatch transaction to sovereign external callback or webhook per SPEC.md
    throw new Error("Not implemented — production only");
  }

  async rotateSigner(_registryId: string): Promise<{ address: string }> {
    // TODO(P3): dispatch rotation request to sovereign registry per SPEC.md
    throw new Error("Not implemented — production only");
  }
}
