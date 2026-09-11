export interface InitiateTransferDto {
  destRegistryAddress: string;
  creditId: string;
  amount: number;
}

export class TransferService {
  async initiate(registryId: string, dto: InitiateTransferDto): Promise<{ transferId: string }> {
    // TODO(P1): orchestrate strategy calls + contract calls per SPEC.md §6
    throw new Error("TransferService.initiate: Not implemented");
  }

  async complete(registryId: string, transferId: string): Promise<void> {
    // TODO(P1): orchestrate strategy calls + contract calls per SPEC.md §6
    throw new Error("TransferService.complete: Not implemented");
  }

  async cancel(registryId: string, transferId: string): Promise<void> {
    // TODO(P1): orchestrate strategy calls + contract calls per SPEC.md §6
    throw new Error("TransferService.cancel: Not implemented");
  }
}
