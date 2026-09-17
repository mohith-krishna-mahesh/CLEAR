import { Router } from "express";
import { controlPlane, ensureControlPlane } from "../db/control-plane/client";
import { getTenantClient } from "../db/tenant/client-factory";
import { SettlementClient } from "../blockchain/settlement.client";

export const auditRouter = Router();
const settlement = new SettlementClient();

interface RegistryAuditRow {
  id: string;
  onChainId: bigint;
  name: string;
  jurisdiction: string;
  signerAddress: string;
  tier: string;
  createdAt: Date;
}

auditRouter.get("/registries", async (_req, res) => {
  try {
    await ensureControlPlane();
    const registries = (await controlPlane.registry.findMany({
      orderBy: { createdAt: "desc" },
    })) as RegistryAuditRow[];
    res.status(200).json({
      registries: registries.map((r) => ({
        id: r.onChainId.toString(),
        signer: r.signerAddress,
        name: r.name,
        jurisdiction: r.jurisdiction,
        metadataURI: "",
        tier: r.tier,
        appliedAt: Math.floor(r.createdAt.getTime() / 1000).toString(),
        decidedAt:
          r.tier === "VERIFIED" || r.tier === "REVOKED"
            ? Math.floor(r.createdAt.getTime() / 1000).toString()
            : null,
      })),
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to list registries",
    });
  }
});

auditRouter.get("/transfers", async (_req, res) => {
  try {
    await ensureControlPlane();
    const registries = await controlPlane.registry.findMany();
    const seen = new Set<string>();
    const transfers: Array<Record<string, string | null>> = [];

    for (const registry of registries) {
      try {
        const client = getTenantClient(registry.id);
        const rows = (await client.$queryRawUnsafe(
          `SELECT * FROM "TransferCache" ORDER BY "updatedAt" DESC`,
        )) as Array<{
          onChainId: bigint;
          status: string;
          amount: number;
          counterparty: string;
          direction: string;
        }>;
        for (const row of rows) {
          const id = row.onChainId.toString();
          if (seen.has(id)) continue;
          seen.add(id);
          let source = registry.signerAddress;
          let dest = row.counterparty;
          let creditReference = "0x";
          let initiatedAt = "0";
          let completedAt: string | null = null;
          try {
            const onchain = await settlement.getTransfer(row.onChainId);
            source = onchain.sourceRegistry;
            dest = onchain.destRegistry;
            creditReference = onchain.creditReference;
            initiatedAt = onchain.initiatedAt.toString();
            completedAt =
              onchain.completedAt > 0n ? onchain.completedAt.toString() : null;
          } catch {
            if (row.direction === "INCOMING") {
              dest = registry.signerAddress;
              source = row.counterparty;
            }
          }
          transfers.push({
            id,
            sourceRegistry: source,
            destRegistry: dest,
            creditReference,
            amount: String(row.amount),
            status: row.status,
            initiatedAt,
            completedAt,
          });
        }
      } catch {
        // tenant schema may not exist yet
      }
    }

    res.status(200).json({ transfers });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to list transfers",
    });
  }
});
