import {
  VerificationStrategy,
  RegistryApplication,
  VerificationDecision,
} from "./verification-strategy.interface";

/**
 * Production default for live networks: do not auto-admit.
 * The application stays PENDING until council executes approveRegistry.
 */
export class ManualReviewStrategy implements VerificationStrategy {
  async review(
    application: RegistryApplication,
  ): Promise<VerificationDecision> {
    return {
      approve: false,
      reason: `Queued for CLEAR Secretariat checklist review (${application.name} / ${application.jurisdiction})`,
    };
  }
}
