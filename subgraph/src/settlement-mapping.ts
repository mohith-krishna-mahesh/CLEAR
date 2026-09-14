import {
  TransferInitiated,
  TransferCompleted,
  TransferCancelled,
  TransferExpired,
} from "../generated/CLEARSettlement/CLEARSettlement";
import { Transfer } from "../generated/schema";

export function handleTransferInitiated(event: TransferInitiated): void {
  let transfer = new Transfer(event.params.transferId.toString());
  transfer.sourceRegistry = event.params.sourceRegistry;
  transfer.destRegistry = event.params.destRegistry;
  transfer.creditReference = event.params.creditReference;
  transfer.amount = event.params.amount;
  transfer.status = "INITIATED";
  transfer.initiatedAt = event.block.timestamp;
  transfer.save();
}

export function handleTransferCompleted(event: TransferCompleted): void {
  let transfer = Transfer.load(event.params.transferId.toString());
  if (transfer != null) {
    transfer.status = "COMPLETED";
    transfer.completedAt = event.params.completedAt;
    transfer.save();
  }
}

export function handleTransferCancelled(event: TransferCancelled): void {
  let transfer = Transfer.load(event.params.transferId.toString());
  if (transfer != null) {
    transfer.status = "CANCELLED";
    transfer.save();
  }
}

export function handleTransferExpired(event: TransferExpired): void {
  let transfer = Transfer.load(event.params.transferId.toString());
  if (transfer != null) {
    transfer.status = "EXPIRED";
    transfer.save();
  }
}
