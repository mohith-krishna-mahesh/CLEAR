export interface CreditRecord {
  id: string;
  projectName: string;
  vintage: number;
  amount: number;
  ownerCompany: string;
}

export interface CreditReferenceStrategy {
  /** Deterministically derives the on-chain bytes32 reference for a credit. */
  computeReference(credit: CreditRecord): Promise<string>; // 0x-prefixed 32-byte hex
}
