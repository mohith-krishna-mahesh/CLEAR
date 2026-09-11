import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { getTenantClient } from "../db/tenant/client-factory";

export const registryRouter = Router();

// Retrieve credits owned by the authenticated registry
registryRouter.get("/credits", authMiddleware, async (req: AuthenticatedRequest, res) => {
  // TODO(P1): fetch credits from tenant schema
  res.status(501).json({ error: "Registry credits: Not implemented" });
});

// Profile / metadata for current registry
registryRouter.get("/profile", authMiddleware, async (req: AuthenticatedRequest, res) => {
  // TODO(P1): return registry metadata
  res.status(501).json({ error: "Registry profile: Not implemented" });
});
