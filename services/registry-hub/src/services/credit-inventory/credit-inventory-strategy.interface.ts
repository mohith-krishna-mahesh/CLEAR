import { CreditRecord } from "../credit-reference/credit-reference-strategy.interface";

export type CreditStatus = "ACTIVE" | "RESERVED" | "TRANSFERRED";

export interface CreditInventoryStrategy {
  reserve(registryId: string, creditId: string, amount: number): Promise<void>;
  commitOutgoing(registryId: string, creditId: string): Promise<void>;
  creditIncoming(registryId: string, credit: CreditRecord): Promise<void>;
  release(registryId: string, creditId: string): Promise<void>;
}
