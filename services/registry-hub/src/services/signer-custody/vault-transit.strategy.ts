import { ethers } from "ethers";
import { randomUUID } from "crypto";
import {
  SignerCustodyStrategy,
  UnsignedTx,
} from "./signer-custody-strategy.interface";
import { env } from "../../config/env";
import { getTenantClient } from "../../db/tenant/client-factory";
import { provider } from "../../blockchain/provider";

interface SecretRow {
  id: string;
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * HashiCorp Vault Transit: the master wrapping key never leaves Vault.
 * Registry private keys are generated locally, wrapped via Transit encrypt,
 * and only unwrapped ephemerally at signing time.
 */
export class VaultTransitCustodyStrategy implements SignerCustodyStrategy {
  async provisionSigner(registryId: string): Promise<{ address: string }> {
    await this.ensureTransitKey();
    const wallet = ethers.Wallet.createRandom();
    const wrapped = await this.encrypt(wallet.privateKey);
    await this.persist(registryId, wrapped, { replace: false });
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
    await this.ensureTransitKey();
    const wallet = ethers.Wallet.createRandom();
    const wrapped = await this.encrypt(wallet.privateKey);
    await this.persist(registryId, wrapped, { replace: true });
    return { address: wallet.address };
  }

  private vaultConfig(): { addr: string; token: string; key: string } {
    const addr = (env.VAULT_ADDR || "").replace(/\/$/, "");
    const token = env.VAULT_TOKEN || "";
    if (!addr || !token) {
      throw new Error(
        "VAULT_ADDR and VAULT_TOKEN are required for vault-transit custody",
      );
    }
    return { addr, token, key: env.VAULT_TRANSIT_KEY };
  }

  private async vaultFetch(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const { addr, token } = this.vaultConfig();
    const res = await fetch(`${addr}/v1/${path.replace(/^\//, "")}`, {
      ...init,
      headers: {
        "X-Vault-Token": token,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vault ${path} failed (${res.status}): ${body}`);
    }
    return res;
  }

  private async ensureTransitKey(): Promise<void> {
    const { key } = this.vaultConfig();
    try {
      await this.vaultFetch(`transit/keys/${key}`, { method: "GET" });
    } catch {
      await this.vaultFetch(`transit/keys/${key}`, {
        method: "POST",
        body: JSON.stringify({ type: "aes256-gcm96" }),
      });
    }
  }

  private async encrypt(plaintext: string): Promise<string> {
    const { key } = this.vaultConfig();
    const res = await this.vaultFetch(`transit/encrypt/${key}`, {
      method: "POST",
      body: JSON.stringify({
        plaintext: Buffer.from(plaintext, "utf8").toString("base64"),
      }),
    });
    const json = (await res.json()) as { data: { ciphertext: string } };
    return json.data.ciphertext;
  }

  private async decrypt(ciphertext: string): Promise<string> {
    const { key } = this.vaultConfig();
    const res = await this.vaultFetch(`transit/decrypt/${key}`, {
      method: "POST",
      body: JSON.stringify({ ciphertext }),
    });
    const json = (await res.json()) as { data: { plaintext: string } };
    return Buffer.from(json.data.plaintext, "base64").toString("utf8");
  }

  private async persist(
    registryId: string,
    vaultCiphertext: string,
    opts: { replace: boolean },
  ): Promise<void> {
    const client = getTenantClient(registryId);
    if (opts.replace) {
      await client.$executeRawUnsafe(`DELETE FROM "SignerSecret"`);
    }
    await client.$executeRawUnsafe(
      `INSERT INTO "SignerSecret" ("id", "ciphertext", "iv", "authTag", "createdAt")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      randomUUID(),
      vaultCiphertext,
      "vault-transit",
      env.VAULT_TRANSIT_KEY,
    );
  }

  private async loadWallet(registryId: string): Promise<ethers.Wallet> {
    const client = getTenantClient(registryId);
    const rows = (await client.$queryRawUnsafe(
      `SELECT * FROM "SignerSecret" ORDER BY "createdAt" DESC LIMIT 1`,
    )) as SecretRow[];
    if (!rows[0]) {
      throw new Error(
        `No Vault-wrapped signer secret for registry ${registryId}`,
      );
    }
    const pk = await this.decrypt(rows[0].ciphertext);
    return new ethers.Wallet(pk, provider);
  }
}
