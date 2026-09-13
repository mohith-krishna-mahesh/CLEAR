import {
  RegistryApplied,
  RegistryObserved,
  RegistryApproved,
  RegistryRejected,
  RegistryRevoked,
  SignerRotated,
  RegistryDirectory,
} from "../generated/RegistryDirectory/RegistryDirectory";
import { Registry } from "../generated/schema";

export function handleRegistryApplied(event: RegistryApplied): void {
  let id = event.params.registryId.toString();
  let registry = new Registry(id);
  registry.signer = event.params.signer;
  registry.name = event.params.name;
  registry.jurisdiction = event.params.jurisdiction;

  // Query metadataURI directly from contract state
  let contract = RegistryDirectory.bind(event.address);
  let tryReg = contract.try_getRegistry(event.params.registryId);
  if (!tryReg.reverted) {
    registry.metadataURI = tryReg.value.metadataURI;
  } else {
    registry.metadataURI = "";
  }

  registry.tier = "PENDING";
  registry.appliedAt = event.block.timestamp;
  registry.save();
}

export function handleRegistryObserved(event: RegistryObserved): void {
  let registry = Registry.load(event.params.registryId.toString());
  if (registry != null) {
    registry.tier = "OBSERVER";
    registry.save();
  }
}

export function handleRegistryApproved(event: RegistryApproved): void {
  let registry = Registry.load(event.params.registryId.toString());
  if (registry != null) {
    registry.tier = "VERIFIED";
    registry.decidedAt = event.block.timestamp;
    registry.save();
  }
}

export function handleRegistryRejected(event: RegistryRejected): void {
  let registry = Registry.load(event.params.registryId.toString());
  if (registry != null) {
    registry.tier = "REVOKED";
    registry.decidedAt = event.block.timestamp;
    registry.save();
  }
}

export function handleRegistryRevoked(event: RegistryRevoked): void {
  let registry = Registry.load(event.params.registryId.toString());
  if (registry != null) {
    registry.tier = "REVOKED";
    registry.decidedAt = event.block.timestamp;
    registry.save();
  }
}

export function handleSignerRotated(event: SignerRotated): void {
  let registry = Registry.load(event.params.registryId.toString());
  if (registry != null) {
    registry.signer = event.params.newSigner;
    registry.save();
  }
}
