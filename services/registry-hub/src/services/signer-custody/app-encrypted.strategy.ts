import {
  SignerCustodyStrategy,
  UnsignedTx,
} from "./signer-custody-strategy.interface";

export class AppEncryptedCustodyStrategy implements SignerCustodyStrategy {
  async provisionSigner(registryId: string): Promise<{ address: string }> {
    // TODO(P3): ethers.Wallet.createRandom(), AES-256-GCM encrypt via Node crypto (master key from ENCRYPTION_KEY env var, never hardcoded), store ciphertext/iv/authTag in this tenant's SignerSecret row, never log or return plaintext
    return { address: "0x0000000000000000000000000000000000000000" };
  }

  async signTransaction(
    registryId: string,
    unsignedTx: UnsignedTx
  ): Promise<{ signedTx: string }> {
    // TODO(P3): fetch SignerSecret row for registryId, decrypt with ENCRYPTION_KEY, instantiate Wallet, signTransaction, return signedTx
    return { signedTx: "0x" };
  }

  async rotateSigner(registryId: string): Promise<{ address: string }> {
    // TODO(P3): generate new Wallet, encrypt with AES-256-GCM, update SignerSecret, return new address
    return { address: "0x0000000000000000000000000000000000000000" };
  }
}
