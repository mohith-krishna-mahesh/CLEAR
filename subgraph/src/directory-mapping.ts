import { ethereum, BigInt, Bytes } from "@graphprotocol/graph-ts";

export class RegistryAppliedEvent extends ethereum.Event {}
export class RegistryObservedEvent extends ethereum.Event {}
export class RegistryApprovedEvent extends ethereum.Event {}
export class RegistryRejectedEvent extends ethereum.Event {}
export class RegistryRevokedEvent extends ethereum.Event {}
export class SignerRotatedEvent extends ethereum.Event {}

export function handleRegistryApplied(event: RegistryAppliedEvent): void {
  // TODO(P2): upsert Registry entity with id = event.params.registryId.toString(), tier = "PENDING", appliedAt = event.block.timestamp
}

export function handleRegistryObserved(event: RegistryObservedEvent): void {
  // TODO(P2): upsert Registry entity updating tier = "OBSERVER"
}

export function handleRegistryApproved(event: RegistryApprovedEvent): void {
  // TODO(P2): upsert Registry entity updating tier = "VERIFIED", decidedAt = event.block.timestamp
}

export function handleRegistryRejected(event: RegistryRejectedEvent): void {
  // TODO(P2): upsert Registry entity updating tier = "REVOKED", decidedAt = event.block.timestamp
}

export function handleRegistryRevoked(event: RegistryRevokedEvent): void {
  // TODO(P2): upsert Registry entity updating tier = "REVOKED", decidedAt = event.block.timestamp
}

export function handleSignerRotated(event: SignerRotatedEvent): void {
  // TODO(P2): upsert Registry entity updating signer = event.params.newSigner
}
