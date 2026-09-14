import { Router } from "express";
import { OnboardingController } from "../controllers/onboarding.controller";

export const onboardingRouter = Router();
const controller = new OnboardingController();

onboardingRouter.post("/apply", (req, res) => controller.apply(req, res));
onboardingRouter.get("/status/:registryId", (req, res) =>
  controller.getStatus(req, res),
);
