import { randomUUID } from "crypto";
import { CreditInventoryStrategy } from "./credit-inventory-strategy.interface";
import { CreditRecord } from "../credit-reference/credit-reference-strategy.interface";
import { getTenantClient } from "../../db/tenant/client-factory";

interface CreditRow {
  id: string;
  projectName: string;
  vintage: number;
  amount: number;
  ownerCompany: string;
  status: string;
}

export class SimulatorInventoryAdapter implements CreditInventoryStrategy {
  async reserve(
    registryId: string,
    creditId: string,
    amount: number,
  ): Promise<void> {
    const client = getTenantClient(registryId);
    const rows = (await client.$queryRawUnsafe(
      `SELECT * FROM "Credit" WHERE "id" = $1 LIMIT 1`,
      creditId,
    )) as CreditRow[];
    const credit = rows[0];
    if (!credit) {
      throw new Error(`Credit ${creditId} not found`);
    }
    if (credit.status !== "ACTIVE") {
      throw new Error(
        `Credit ${creditId} is ${credit.status}, expected ACTIVE`,
      );
    }
    if (amount > Number(credit.amount)) {
      throw new Error(
        `Insufficient inventory: ${credit.amount} available, ${amount} requested`,
      );
    }

    if (amount === Number(credit.amount)) {
      await client.$executeRawUnsafe(
        `UPDATE "Credit" SET "status" = 'RESERVED' WHERE "id" = $1`,
        creditId,
      );
      return;
    }

    await client.$executeRawUnsafe(
      `UPDATE "Credit" SET "amount" = $1 WHERE "id" = $2`,
      Number(credit.amount) - amount,
      creditId,
    );
    await client.$executeRawUnsafe(
      `INSERT INTO "Credit" ("id", "projectName", "vintage", "amount", "ownerCompany", "status", "createdAt")
       VALUES ($1, $2, $3, $4, $5, 'RESERVED', CURRENT_TIMESTAMP)`,
      `${creditId}-rsv-${Date.now()}`,
      credit.projectName,
      credit.vintage,
      amount,
      credit.ownerCompany,
    );
  }

  async commitOutgoing(registryId: string, creditId: string): Promise<void> {
    const client = getTenantClient(registryId);
    const updated = await client.$executeRawUnsafe(
      `UPDATE "Credit" SET "status" = 'TRANSFERRED' WHERE "id" = $1 AND "status" = 'RESERVED'`,
      creditId,
    );
    if (updated === 0) {
      await client.$executeRawUnsafe(
        `UPDATE "Credit" SET "status" = 'TRANSFERRED' WHERE "status" = 'RESERVED'`,
      );
    }
  }

  async creditIncoming(
    registryId: string,
    credit: CreditRecord,
  ): Promise<void> {
    const client = getTenantClient(registryId);
    await client.$executeRawUnsafe(
      `INSERT INTO "Credit" ("id", "projectName", "vintage", "amount", "ownerCompany", "status", "createdAt")
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', CURRENT_TIMESTAMP)`,
      credit.id || randomUUID(),
      credit.projectName,
      credit.vintage,
      credit.amount,
      credit.ownerCompany,
    );
  }

  async release(registryId: string, creditId: string): Promise<void> {
    const client = getTenantClient(registryId);
    await client.$executeRawUnsafe(
      `UPDATE "Credit" SET "status" = 'ACTIVE' WHERE "id" = $1 AND "status" = 'RESERVED'`,
      creditId,
    );
  }
}
