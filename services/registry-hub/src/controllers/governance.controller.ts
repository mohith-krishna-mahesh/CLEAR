import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { controlPlane, ensureControlPlane } from "../db/control-plane/client";
import { DirectoryClient } from "../blockchain/directory.client";
import { getCouncilSigner } from "../services/strategies";

const directory = new DirectoryClient();

function serializeRegistry(registry: {
  id: string;
  onChainId: bigint;
  name: string;
  jurisdiction: string;
  signerAddress: string;
  tier: string;
  createdAt: Date;
}) {
  return {
    ...registry,
    onChainId: registry.onChainId.toString(),
  };
}

export class GovernanceController {
  async listPending(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await ensureControlPlane();
      const pending = await controlPlane.registry.findMany({
        where: { tier: "PENDING" },
        orderBy: { createdAt: "asc" },
      });
      res.status(200).json({ registries: pending.map(serializeRegistry) });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Failed to list pending registries" });
    }
  }

  async approve(req: AuthenticatedRequest, res: Response): Promise<void> {
    const registryId = req.params.registryId;
    if (!registryId) {
      res.status(400).json({ error: "registryId is required" });
      return;
    }
    try {
      await ensureControlPlane();
      const registry = await controlPlane.registry.findUnique({ where: { id: registryId } });
      if (!registry) {
        res.status(404).json({ error: "Registry not found" });
        return;
      }
      await directory.approveRegistry(registry.onChainId, getCouncilSigner());
      const updated = await controlPlane.registry.update({
        where: { id: registryId },
        data: { tier: "VERIFIED" },
      });
      res.status(200).json(serializeRegistry(updated));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Approval failed" });
    }
  }

  async reject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const registryId = req.params.registryId;
    if (!registryId) {
      res.status(400).json({ error: "registryId is required" });
      return;
    }
    try {
      await ensureControlPlane();
      const registry = await controlPlane.registry.findUnique({ where: { id: registryId } });
      if (!registry) {
        res.status(404).json({ error: "Registry not found" });
        return;
      }
      await directory.rejectApplication(registry.onChainId, getCouncilSigner());
      const updated = await controlPlane.registry.update({
        where: { id: registryId },
        data: { tier: "REVOKED" },
      });
      res.status(200).json(serializeRegistry(updated));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Rejection failed" });
    }
  }
}
