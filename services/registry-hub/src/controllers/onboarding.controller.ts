import { Request, Response } from "express";
import { OnboardingService } from "../services/onboarding.service";

const onboardingService = new OnboardingService();

export class OnboardingController {
  async apply(req: Request, res: Response): Promise<void> {
    const { name, jurisdiction, metadataURI } = req.body ?? {};
    if (!name || !jurisdiction || !metadataURI) {
      res.status(400).json({ error: "name, jurisdiction, and metadataURI are required" });
      return;
    }
    try {
      const result = await onboardingService.onboardRegistry({
        name: String(name),
        jurisdiction: String(jurisdiction),
        metadataURI: String(metadataURI),
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Onboarding failed" });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    const registryId = req.params.registryId;
    if (!registryId) {
      res.status(400).json({ error: "registryId is required" });
      return;
    }
    try {
      const status = await onboardingService.getStatus(registryId);
      if (!status) {
        res.status(404).json({ error: "Registry not found" });
        return;
      }
      res.status(200).json(status);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load status" });
    }
  }
}
