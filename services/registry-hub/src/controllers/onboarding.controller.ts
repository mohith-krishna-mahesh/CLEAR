import { Request, Response } from "express";

export class OnboardingController {
  async apply(req: Request, res: Response): Promise<void> {
    // TODO(P1): parse body, validate fields, invoke OnboardingService.onboardRegistry
    res.status(501).json({ error: "OnboardingController.apply: Not implemented" });
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    // TODO(P1): retrieve onboarding status from control_plane database
    res.status(501).json({ error: "OnboardingController.getStatus: Not implemented" });
  }
}
