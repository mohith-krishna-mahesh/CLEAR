import {
  VerificationStrategy,
  RegistryApplication,
  VerificationDecision,
} from "./verification-strategy.interface";

/**
 * AutoApproveStrategy automatically returns positive verification.
 * Used for demo, test fixture, and rapid iteration flows.
 */
export class AutoApproveStrategy implements VerificationStrategy {
  async review(
    _application: RegistryApplication,
  ): Promise<VerificationDecision> {
    return {
      approve: true,
      reason: "Auto-approved for demo/testing environment",
    };
  }
}
