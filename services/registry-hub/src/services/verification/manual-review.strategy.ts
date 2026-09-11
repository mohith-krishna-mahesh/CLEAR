import {
  VerificationStrategy,
  RegistryApplication,
  VerificationDecision,
} from "./verification-strategy.interface";

export class ManualReviewStrategy implements VerificationStrategy {
  async review(_application: RegistryApplication): Promise<VerificationDecision> {
    // TODO(P3): council checklist workflow
    throw new Error("Manual review strategy not implemented");
  }
}
