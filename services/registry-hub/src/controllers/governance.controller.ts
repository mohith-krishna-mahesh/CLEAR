import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";

export class GovernanceController {
  async listPending(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO(P1): retrieve all PENDING applications from control_plane database
    res.status(501).json({ error: "GovernanceController.listPending: Not implemented" });
  }

  async approve(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO(P1): council approvals, execute Directory contract approveRegistry
    res.status(501).json({ error: "GovernanceController.approve: Not implemented" });
  }

  async reject(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO(P1): council rejection, execute Directory contract rejectApplication
    res.status(501).json({ error: "GovernanceController.reject: Not implemented" });
  }
}
