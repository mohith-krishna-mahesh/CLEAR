import {
  CreditInventoryStrategy,
} from "./credit-inventory-strategy.interface";
import { CreditRecord } from "../credit-reference/credit-reference-strategy.interface";
import { getTenantClient } from "../../db/tenant/client-factory";

/**
 * Simulator inventory adapter backed by the tenant's Credit model.
 */
export class SimulatorInventoryAdapter implements CreditInventoryStrategy {
  async reserve(registryId: string, creditId: string, amount: number): Promise<void> {
    // TODO(P3): implement reserve/commitOutgoing/creditIncoming/release exactly per CLEAR SPEC.md §6 status transitions (ACTIVE→RESERVED→TRANSFERRED)
    const client = getTenantClient(registryId);
    // In stub, verify the client can be acquired
    if (!client) {
      throw new Error(`Cannot acquire tenant client for registry ${registryId}`);
    }
  }

  async commitOutgoing(registryId: string, creditId: string): Promise<void> {
    // TODO(P3): transition Credit status from RESERVED to TRANSFERRED per SPEC.md §6
    const client = getTenantClient(registryId);
    if (!client) {
      throw new Error(`Cannot acquire tenant client for registry ${registryId}`);
    }
  }

  async creditIncoming(registryId: string, credit: CreditRecord): Promise<void> {
    // TODO(P3): insert or update Credit with status ACTIVE in destination tenant schema per SPEC.md §6
    const client = getTenantClient(registryId);
    if (!client) {
      throw new Error(`Cannot acquire tenant client for registry ${registryId}`);
    }
  }

  async release(registryId: string, creditId: string): Promise<void> {
    // TODO(P3): release RESERVED credit back to ACTIVE upon cancel or expiry per SPEC.md §6
    const client = getTenantClient(registryId);
    if (!client) {
      throw new Error(`Cannot acquire tenant client for registry ${registryId}`);
    }
  }
}
