import { ethers } from "ethers";
import { randomUUID } from "crypto";
import {
  SignerCustodyStrategy,
  UnsignedTx,
} from "./signer-custody-strategy.interface";
import { getTenantClient } from "../../db/tenant/client-factory";
import { provider } from "../../blockchain/provider";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto";

interface SecretRow {
  id: string;
  ciphertext: string;
  iv: string;
  authTag: string;
}

export class AppEncryptedCustodyStrategy implements SignerCustodyStrategy {
  async provisionSigner(registryId: string): Promise<{ address: string }> {
    const wallet = ethers.Wallet.createRandom();
    await this.persistKey(registryId, wallet.privateKey, { replace: false });
    return { address: wallet.address };
  }

  async importSigner(
    registryId: string,
    privateKey: string,
  ): Promise<{ address: string }> {
    const wallet = new ethers.Wallet(privateKey);
    await this.persistKey(registryId, wallet.privateKey, { replace: true });
    return { address: wallet.address };
  }

  async signTransaction(
    registryId: string,
    unsignedTx: UnsignedTx,
  ): Promise<{ signedTx: string }> {
    const wallet = await this.loadWallet(registryId);
    const fee = await provider.getFeeData();
    const tx: ethers.TransactionRequest = {
      to: unsignedTx.to,
      data: unsignedTx.data,
      nonce: unsignedTx.nonce,
      chainId: unsignedTx.chainId,
      gasLimit: unsignedTx.gasLimit,
      type: fee.maxFeePerGas ? 2 : 0,
    };
    if (fee.maxFeePerGas && fee.maxPriorityFeePerGas) {
      tx.maxFeePerGas = fee.maxFeePerGas;
      tx.maxPriorityFeePerGas = fee.maxPriorityFeePerGas;
    } else if (fee.gasPrice) {
      tx.gasPrice = fee.gasPrice;
    }
    return { signedTx: await wallet.signTransaction(tx) };
  }

  async rotateSigner(registryId: string): Promise<{ address: string }> {
    const wallet = ethers.Wallet.createRandom();
    await this.persistKey(registryId, wallet.privateKey, { replace: true });
    return { address: wallet.address };
  }

  private async persistKey(
    registryId: string,
    privateKey: string,
    opts: { replace: boolean },
  ): Promise<void> {
    const client = getTenantClient(registryId);
    const enc = encryptPrivateKey(privateKey);
    if (opts.replace) {
      await client.$executeRawUnsafe(`DELETE FROM "SignerSecret"`);
    }
    await client.$executeRawUnsafe(
      `INSERT INTO "SignerSecret" ("id", "ciphertext", "iv", "authTag", "createdAt")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      randomUUID(),
      enc.ciphertext,
      enc.iv,
      enc.authTag,
    );
  }

  private async loadWallet(registryId: string): Promise<ethers.Wallet> {
    const client = getTenantClient(registryId);
    const rows = (await client.$queryRawUnsafe(
      `SELECT * FROM "SignerSecret" ORDER BY "createdAt" DESC LIMIT 1`,
    )) as SecretRow[];
    if (!rows[0]) {
      throw new Error(`No signer secret for registry ${registryId}`);
    }
    const pk = decryptPrivateKey(rows[0]);
    return new ethers.Wallet(pk, provider);
  }
}
