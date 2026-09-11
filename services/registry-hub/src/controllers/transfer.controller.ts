import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";

export class TransferController {
  async initiate(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO(P1): validate transfer payload and invoke TransferService.initiate
    res.status(501).json({ error: "TransferController.initiate: Not implemented" });
  }

  async complete(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO(P1): invoke TransferService.complete for destination registry
    res.status(501).json({ error: "TransferController.complete: Not implemented" });
  }

  async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO(P1): invoke TransferService.cancel for source registry
    res.status(501).json({ error: "TransferController.cancel: Not implemented" });
  }

  async listTransfers(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO(P1): query tenant TransferCache for historical and active transfers
    res.status(501).json({ error: "TransferController.listTransfers: Not implemented" });
  }
}
