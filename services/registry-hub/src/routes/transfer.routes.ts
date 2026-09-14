import { Router } from "express";
import { TransferController } from "../controllers/transfer.controller";
import { authMiddleware } from "../middleware/auth";

export const transferRouter = Router();
const controller = new TransferController();

transferRouter.use(authMiddleware);

transferRouter.get("/", (req, res) => controller.listTransfers(req, res));
transferRouter.post("/initiate", (req, res) => controller.initiate(req, res));
transferRouter.post("/:transferId/complete", (req, res) =>
  controller.complete(req, res),
);
transferRouter.post("/:transferId/cancel", (req, res) =>
  controller.cancel(req, res),
);
