import { randomUUID } from "crypto";
import {
  SignerCustodyStrategy,
  UnsignedTx,
} from "./signer-custody-strategy.interface";
import { env } from "../../config/env";
import { getTenantClient } from "../../db/tenant/client-factory";

interface SecretRow {
  id: string;
  ciphertext: string;
  iv: string;
  authTag: string;
}

interface SelfCustodyConfig {
  address: string;
  webhook: string;
}

/**
 * Sovereign self-custody: CLEAR stores only the public address and a signing webhook.
 * The registry holds the private key and returns a signed raw transaction.
 */
export class SelfCustodyStrategy implements SignerCustodyStrategy {
  async provisionSigner(registryId: string): Promise<{ address: string }> {
    const cfg = this.configFor(registryId);
    const client = getTenantClient(registryId);
    await client.$executeRawUnsafe(`DELETE FROM "SignerSecret"`);
    await client.$executeRawUnsafe(
      `INSERT INTO "SignerSecret" ("id", "ciphertext", "iv", "authTag", "createdAt")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      randomUUID(),
      "self-custody",
      cfg.address,
      cfg.webhook,
    );
    return { address: cfg.address };
  }

  async signTransaction(
    registryId: string,
    unsignedTx: UnsignedTx,
  ): Promise<{ signedTx: string }> {
    const cfg = await this.loadConfig(registryId);
    const res = await fetch(cfg.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sign",
        registryId,
        unsignedTx,
      }),
    });
    if (!res.ok) {
      throw new Error(
        `Self-custody webhook sign failed (${res.status}): ${await res.text()}`,
      );
    }
    const body = (await res.json()) as { signedTx?: string };
    if (!body.signedTx) {
      throw new Error("Self-custody webhook did not return signedTx");
    }
    return { signedTx: body.signedTx };
  }

  async rotateSigner(registryId: string): Promise<{ address: string }> {
    const cfg = await this.loadConfig(registryId);
    const res = await fetch(cfg.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rotate", registryId }),
    });
    if (!res.ok) {
      throw new Error(
        `Self-custody webhook rotate failed (${res.status}): ${await res.text()}`,
      );
    }
    const body = (await res.json()) as { address?: string };
    if (!body.address) {
      throw new Error(
        "Self-custody webhook did not return the new signer address",
      );
    }
    const client = getTenantClient(registryId);
    await client.$executeRawUnsafe(`DELETE FROM "SignerSecret"`);
    await client.$executeRawUnsafe(
      `INSERT INTO "SignerSecret" ("id", "ciphertext", "iv", "authTag", "createdAt")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      randomUUID(),
      "self-custody",
      body.address,
      cfg.webhook,
    );
    return { address: body.address };
  }

  private configFor(registryId: string): SelfCustodyConfig {
    if (env.SELF_CUSTODY_CONFIG) {
      const parsed = JSON.parse(env.SELF_CUSTODY_CONFIG) as Record<
        string,
        SelfCustodyConfig
      >;
      const entry = parsed[registryId];
      if (entry?.address && entry?.webhook) {
        return entry;
      }
    }
    if (!env.SELF_CUSTODY_ADDRESS || !env.SELF_CUSTODY_WEBHOOK_URL) {
      throw new Error(
        "Self-custody requires SELF_CUSTODY_ADDRESS + SELF_CUSTODY_WEBHOOK_URL, or SELF_CUSTODY_CONFIG JSON keyed by registryId",
      );
    }
    return {
      address: env.SELF_CUSTODY_ADDRESS,
      webhook: env.SELF_CUSTODY_WEBHOOK_URL,
    };
  }

  private async loadConfig(registryId: string): Promise<SelfCustodyConfig> {
    const client = getTenantClient(registryId);
    const rows = (await client.$queryRawUnsafe(
      `SELECT * FROM "SignerSecret" ORDER BY "createdAt" DESC LIMIT 1`,
    )) as SecretRow[];
    if (rows[0]?.iv && rows[0]?.authTag) {
      return { address: rows[0].iv, webhook: rows[0].authTag };
    }
    return this.configFor(registryId);
  }
}
