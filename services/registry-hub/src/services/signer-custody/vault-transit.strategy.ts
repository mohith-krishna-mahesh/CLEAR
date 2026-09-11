import {
  SignerCustodyStrategy,
  UnsignedTx,
} from "./signer-custody-strategy.interface";

/**
 * Enterprise HashiCorp Vault Transit engine custody strategy.
 * See SPEC.md §5 for threat model and external HSM integration details.
 */
export class VaultTransitCustodyStrategy implements SignerCustodyStrategy {
  async provisionSigner(_registryId: string): Promise<{ address: string }> {
    // TODO(P3): delegate key creation to HashiCorp Vault Transit engine per SPEC.md
    throw new Error("Not implemented — production only");
  }

  async signTransaction(
    _registryId: string,
    _unsignedTx: UnsignedTx
  ): Promise<{ signedTx: string }> {
    // TODO(P3): delegate signing to HashiCorp Vault Transit engine per SPEC.md
    throw new Error("Not implemented — production only");
  }

  async rotateSigner(_registryId: string): Promise<{ address: string }> {
    // TODO(P3): delegate rotation to HashiCorp Vault Transit engine per SPEC.md
    throw new Error("Not implemented — production only");
  }
}
