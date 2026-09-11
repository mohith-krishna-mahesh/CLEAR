import { ethereum, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class TransferInitiatedEvent extends ethereum.Event {}
export class TransferCompletedEvent extends ethereum.Event {}
export class TransferCancelledEvent extends ethereum.Event {}
export class TransferExpiredEvent extends ethereum.Event {}

export function handleTransferInitiated(event: TransferInitiatedEvent): void {
  // TODO(P2): upsert Transfer entity with status = "INITIATED", initiatedAt = event.block.timestamp
}

export function handleTransferCompleted(event: TransferCompletedEvent): void {
  // TODO(P2): upsert Transfer entity updating status = "COMPLETED", completedAt = event.block.timestamp
}

export function handleTransferCancelled(event: TransferCancelledEvent): void {
  // TODO(P2): upsert Transfer entity updating status = "CANCELLED"
}

export function handleTransferExpired(event: TransferExpiredEvent): void {
  // TODO(P2): upsert Transfer entity updating status = "EXPIRED"
}
