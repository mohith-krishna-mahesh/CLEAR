import {
  CreditReferenceStrategy,
  CreditRecord,
} from "./credit-reference-strategy.interface";

/**
 * Climate Action Data Trust (CAD Trust) metadata derivation strategy.
 * Resolves credit references against CAD Trust global metadata observatory.
 */
export class CADTrustMetadataStrategy implements CreditReferenceStrategy {
  async computeReference(_credit: CreditRecord): Promise<string> {
    // TODO(P3): connect to CAD Trust API to retrieve canonical metadata hash
    throw new Error("Not implemented — production only");
  }
}
