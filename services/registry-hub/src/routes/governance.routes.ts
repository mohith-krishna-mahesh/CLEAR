import { Router } from "express";
import { GovernanceController } from "../controllers/governance.controller";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

export const governanceRouter = Router();
const controller = new GovernanceController();

// Council-only endpoints
governanceRouter.use(authMiddleware);
governanceRouter.use(requireRole(["council"]));

governanceRouter.get("/pending", (req, res) =>
  controller.listPending(req, res),
);
governanceRouter.post("/:registryId/approve", (req, res) =>
  controller.approve(req, res),
);
governanceRouter.post("/:registryId/reject", (req, res) =>
  controller.reject(req, res),
);
governanceRouter.post("/:registryId/promote", (req, res) =>
  controller.promote(req, res),
);
