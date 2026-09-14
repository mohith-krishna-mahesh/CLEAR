import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { TransferService } from "../services/transfer.service";

const transferService = new TransferService();

function requireRegistry(
  req: AuthenticatedRequest,
  res: Response,
): string | null {
  if (!req.registryId) {
    res.status(401).json({ error: "Authenticated registry context missing" });
    return null;
  }
  return req.registryId;
}

export class TransferController {
  async initiate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const registryId = requireRegistry(req, res);
    if (!registryId) return;

    const { destRegistryAddress, creditId, amount } = req.body ?? {};
    if (!destRegistryAddress || !creditId || amount === undefined) {
      res
        .status(400)
        .json({
          error: "destRegistryAddress, creditId, and amount are required",
        });
      return;
    }
    try {
      const result = await transferService.initiate(registryId, {
        destRegistryAddress: String(destRegistryAddress),
        creditId: String(creditId),
        amount: Number(amount),
      });
      res.status(201).json(result);
    } catch (err) {
      res
        .status(500)
        .json({
          error:
            err instanceof Error ? err.message : "Transfer initiate failed",
        });
    }
  }

  async complete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const registryId = requireRegistry(req, res);
    if (!registryId) return;
    const transferId = req.params.transferId;
    if (!transferId) {
      res.status(400).json({ error: "transferId is required" });
      return;
    }
    try {
      await transferService.complete(registryId, transferId);
      res.status(200).json({ ok: true, transferId });
    } catch (err) {
      res
        .status(500)
        .json({
          error:
            err instanceof Error ? err.message : "Transfer complete failed",
        });
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    const registryId = requireRegistry(req, res);
    if (!registryId) return;
    const transferId = req.params.transferId;
    if (!transferId) {
      res.status(400).json({ error: "transferId is required" });
      return;
    }
    try {
      await transferService.cancel(registryId, transferId);
      res.status(200).json({ ok: true, transferId });
    } catch (err) {
      res
        .status(500)
        .json({
          error: err instanceof Error ? err.message : "Transfer cancel failed",
        });
    }
  }

  async listTransfers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const registryId = requireRegistry(req, res);
    if (!registryId) return;
    try {
      const transfers = await transferService.listTransfers(registryId);
      res.status(200).json({ transfers });
    } catch (err) {
      res
        .status(500)
        .json({
          error:
            err instanceof Error ? err.message : "Failed to list transfers",
        });
    }
  }
}
