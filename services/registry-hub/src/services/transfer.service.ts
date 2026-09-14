import { randomUUID } from "crypto";
import { controlPlane, ensureControlPlane } from "../db/control-plane/client";
import { getTenantClient } from "../db/tenant/client-factory";
import { SettlementClient } from "../blockchain/settlement.client";
import { CreditRecord } from "./credit-reference/credit-reference-strategy.interface";
import {
  getCreditInventory,
  getCreditReference,
  getRegistrySigner,
} from "./strategies";

export interface InitiateTransferDto {
  destRegistryAddress: string;
  creditId: string;
  amount: number;
}

interface CreditRow {
  id: string;
  projectName: string;
  vintage: number;
  amount: number;
  ownerCompany: string;
  status: string;
}

interface TransferCacheRow {
  id: string;
  onChainId: bigint;
  direction: string;
  counterparty: string;
  amount: number;
  status: string;
  updatedAt: Date;
}

export class TransferService {
  constructor(
    private readonly settlement = new SettlementClient(),
    private readonly inventory = getCreditInventory(),
    private readonly references = getCreditReference(),
  ) {}

  async initiate(
    registryId: string,
    dto: InitiateTransferDto,
  ): Promise<{
    success: boolean;
    transferId: string;
    transfer: Record<string, string | null>;
  }> {
    await ensureControlPlane();
    const source = await this.requireRegistry(registryId);
    const dest = await controlPlane.registry.findUnique({
      where: { signerAddress: dto.destRegistryAddress },
    });

    const credit = await this.loadCredit(registryId, dto.creditId);
    await this.inventory.reserve(registryId, dto.creditId, dto.amount);

    const creditRef = await this.references.computeReference(
      this.toCreditRecord(credit, dto.amount),
    );
    const signer = await getRegistrySigner(registryId, source.signerAddress);
    const transferId = await this.settlement.initiateTransfer(
      dto.destRegistryAddress,
      creditRef,
      BigInt(Math.floor(dto.amount)),
      signer,
    );

    await this.upsertTransferCache(registryId, {
      onChainId: transferId,
      direction: "OUTGOING",
      counterparty: dto.destRegistryAddress,
      amount: dto.amount,
      status: "INITIATED",
    });

    if (dest) {
      await this.upsertTransferCache(dest.id, {
        onChainId: transferId,
        direction: "INCOMING",
        counterparty: source.signerAddress,
        amount: dto.amount,
        status: "INITIATED",
      });
    }

    return {
      success: true,
      transferId: transferId.toString(),
      transfer: {
        id: transferId.toString(),
        sourceRegistry: source.signerAddress,
        destRegistry: dto.destRegistryAddress,
        creditReference: creditRef,
        amount: String(dto.amount),
        status: "INITIATED",
        initiatedAt: Math.floor(Date.now() / 1000).toString(),
        completedAt: null,
      },
    };
  }

  async complete(registryId: string, transferId: string): Promise<void> {
    await ensureControlPlane();
    const dest = await this.requireRegistry(registryId);
    const onChainId = BigInt(transferId);
    const transfer = await this.settlement.getTransfer(onChainId);

    if (
      transfer.destRegistry.toLowerCase() !== dest.signerAddress.toLowerCase()
    ) {
      throw new Error(
        "Only the destination registry can complete this transfer",
      );
    }

    const signer = await getRegistrySigner(registryId, dest.signerAddress);
    await this.settlement.completeTransfer(onChainId, signer);

    const source = await controlPlane.registry.findUnique({
      where: { signerAddress: transfer.sourceRegistry },
    });
    const creditId = await this.findReservedCreditId(
      source?.id,
      Number(transfer.amount),
    );

    if (source && creditId) {
      await this.inventory.commitOutgoing(source.id, creditId);
      const outgoing = await this.loadCredit(source.id, creditId).catch(
        () => null,
      );
      await this.inventory.creditIncoming(
        registryId,
        this.toCreditRecord(
          outgoing ?? {
            id: creditId,
            projectName: "Incoming settlement",
            vintage: new Date().getFullYear(),
            amount: Number(transfer.amount),
            ownerCompany: dest.name,
            status: "ACTIVE",
          },
          Number(transfer.amount),
        ),
      );
    } else {
      await this.inventory.creditIncoming(registryId, {
        id: `in-${transferId}`,
        projectName: "Incoming settlement",
        vintage: new Date().getFullYear(),
        amount: Number(transfer.amount),
        ownerCompany: dest.name,
      });
    }

    await this.markCache(registryId, onChainId, "COMPLETED");
    if (source) {
      await this.markCache(source.id, onChainId, "COMPLETED");
    }
  }

  async cancel(registryId: string, transferId: string): Promise<void> {
    await ensureControlPlane();
    const source = await this.requireRegistry(registryId);
    const onChainId = BigInt(transferId);
    const transfer = await this.settlement.getTransfer(onChainId);

    if (
      transfer.sourceRegistry.toLowerCase() !==
      source.signerAddress.toLowerCase()
    ) {
      throw new Error("Only the source registry can cancel this transfer");
    }

    const signer = await getRegistrySigner(registryId, source.signerAddress);
    await this.settlement.cancelTransfer(onChainId, signer);

    const creditId = await this.findReservedCreditId(
      registryId,
      Number(transfer.amount),
    );
    if (creditId) {
      await this.inventory.release(registryId, creditId);
    }

    await this.markCache(registryId, onChainId, "CANCELLED");
    const dest = await controlPlane.registry.findUnique({
      where: { signerAddress: transfer.destRegistry },
    });
    if (dest) {
      await this.markCache(dest.id, onChainId, "CANCELLED");
    }
  }

  async listTransfers(
    registryId: string,
  ): Promise<Array<Record<string, string | number | null>>> {
    const client = getTenantClient(registryId);
    const source = await this.requireRegistry(registryId);
    const rows = (await client.$queryRawUnsafe(
      `SELECT * FROM "TransferCache" ORDER BY "updatedAt" DESC`,
    )) as TransferCacheRow[];

    const transfers = [];
    for (const row of rows) {
      let sourceRegistry = source.signerAddress;
      let destRegistry = row.counterparty;
      let creditReference = "0x";
      let initiatedAt = Math.floor(
        new Date(row.updatedAt).getTime() / 1000,
      ).toString();
      let completedAt: string | null = null;
      try {
        const onchain = await this.settlement.getTransfer(row.onChainId);
        sourceRegistry = onchain.sourceRegistry;
        destRegistry = onchain.destRegistry;
        creditReference = onchain.creditReference;
        initiatedAt = onchain.initiatedAt.toString();
        completedAt =
          onchain.completedAt > 0n ? onchain.completedAt.toString() : null;
      } catch {
        if (row.direction === "INCOMING") {
          destRegistry = source.signerAddress;
          sourceRegistry = row.counterparty;
        }
      }
      transfers.push({
        id: row.onChainId.toString(),
        onChainId: row.onChainId.toString(),
        direction: row.direction,
        sourceRegistry,
        destRegistry,
        counterparty: row.counterparty,
        creditReference,
        amount: String(row.amount),
        status: row.status,
        initiatedAt,
        completedAt,
      });
    }
    return transfers;
  }

  private async requireRegistry(registryId: string) {
    const registry = await controlPlane.registry.findUnique({
      where: { id: registryId },
    });
    if (!registry) {
      throw new Error(`Registry ${registryId} not found`);
    }
    return registry;
  }

  private async loadCredit(
    registryId: string,
    creditId: string,
  ): Promise<CreditRow> {
    const client = getTenantClient(registryId);
    const rows = (await client.$queryRawUnsafe(
      `SELECT * FROM "Credit" WHERE "id" = $1 LIMIT 1`,
      creditId,
    )) as CreditRow[];
    if (!rows[0]) {
      throw new Error(`Credit ${creditId} not found in registry ${registryId}`);
    }
    return rows[0];
  }

  private async findReservedCreditId(
    registryId: string | undefined,
    amount: number,
  ): Promise<string | null> {
    if (!registryId) return null;
    const client = getTenantClient(registryId);
    const rows = (await client.$queryRawUnsafe(
      `SELECT "id" FROM "Credit" WHERE "status" = 'RESERVED' AND "amount" = $1 LIMIT 1`,
      amount,
    )) as Array<{ id: string }>;
    if (rows[0]) return rows[0].id;
    const anyReserved = (await client.$queryRawUnsafe(
      `SELECT "id" FROM "Credit" WHERE "status" = 'RESERVED' LIMIT 1`,
    )) as Array<{ id: string }>;
    return anyReserved[0]?.id ?? null;
  }

  private toCreditRecord(credit: CreditRow, amount: number): CreditRecord {
    return {
      id: credit.id,
      projectName: credit.projectName,
      vintage: Number(credit.vintage),
      amount,
      ownerCompany: credit.ownerCompany,
    };
  }

  private async upsertTransferCache(
    registryId: string,
    row: {
      onChainId: bigint;
      direction: string;
      counterparty: string;
      amount: number;
      status: string;
    },
  ): Promise<void> {
    const client = getTenantClient(registryId);
    const existing = (await client.$queryRawUnsafe(
      `SELECT "id" FROM "TransferCache" WHERE "onChainId" = $1 LIMIT 1`,
      row.onChainId,
    )) as Array<{ id: string }>;
    if (existing[0]) {
      await client.$executeRawUnsafe(
        `UPDATE "TransferCache" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
        row.status,
        existing[0].id,
      );
      return;
    }
    await client.$executeRawUnsafe(
      `INSERT INTO "TransferCache" ("id", "onChainId", "direction", "counterparty", "amount", "status", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      randomUUID(),
      row.onChainId,
      row.direction,
      row.counterparty,
      row.amount,
      row.status,
    );
  }

  private async markCache(
    registryId: string,
    onChainId: bigint,
    status: string,
  ): Promise<void> {
    const client = getTenantClient(registryId);
    await client.$executeRawUnsafe(
      `UPDATE "TransferCache" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "onChainId" = $2`,
      status,
      onChainId,
    );
  }
}
