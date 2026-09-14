import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { getTenantClient } from "../db/tenant/client-factory";
import { controlPlane, ensureControlPlane } from "../db/control-plane/client";

export const registryRouter = Router();

registryRouter.use(authMiddleware);

registryRouter.get("/credits", async (req: AuthenticatedRequest, res) => {
  if (!req.registryId) {
    res.status(401).json({ error: "Authenticated registry context missing" });
    return;
  }
  try {
    const client = getTenantClient(req.registryId);
    const credits = await client.$queryRawUnsafe(
      `SELECT * FROM "Credit" ORDER BY "createdAt" DESC`,
    );
    res.status(200).json({ credits });
  } catch (err) {
    res
      .status(500)
      .json({
        error: err instanceof Error ? err.message : "Failed to load credits",
      });
  }
});

registryRouter.post(
  "/credits/issue",
  async (req: AuthenticatedRequest, res) => {
    if (!req.registryId) {
      res.status(401).json({ error: "Authenticated registry context missing" });
      return;
    }
    const { projectName, vintage, amount, ownerCompany } = req.body ?? {};
    if (
      !projectName ||
      vintage === undefined ||
      amount === undefined ||
      !ownerCompany
    ) {
      res
        .status(400)
        .json({
          error: "projectName, vintage, amount, and ownerCompany are required",
        });
      return;
    }
    try {
      const credit = {
        id: `CR-${Date.now().toString().slice(-6)}`,
        projectName: String(projectName),
        vintage: Number(vintage),
        amount: Number(amount),
        ownerCompany: String(ownerCompany),
        status: "ACTIVE",
      };
      const client = getTenantClient(req.registryId);
      await client.$executeRawUnsafe(
        `INSERT INTO "Credit" ("id", "projectName", "vintage", "amount", "ownerCompany", "status", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        credit.id,
        credit.projectName,
        credit.vintage,
        credit.amount,
        credit.ownerCompany,
        credit.status,
      );
      res.status(201).json(credit);
    } catch (err) {
      res
        .status(500)
        .json({
          error: err instanceof Error ? err.message : "Failed to issue credit",
        });
    }
  },
);

registryRouter.get("/profile", async (req: AuthenticatedRequest, res) => {
  if (!req.registryId) {
    res.status(401).json({ error: "Authenticated registry context missing" });
    return;
  }
  try {
    await ensureControlPlane();
    const registry = await controlPlane.registry.findUnique({
      where: { id: req.registryId },
    });
    if (!registry) {
      res.status(404).json({ error: "Registry not found" });
      return;
    }
    res.status(200).json({
      registry: {
        ...registry,
        onChainId: registry.onChainId.toString(),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        error: err instanceof Error ? err.message : "Failed to load profile",
      });
  }
});
