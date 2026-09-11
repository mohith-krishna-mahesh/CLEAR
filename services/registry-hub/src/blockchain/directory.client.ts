import { ethers } from "ethers";
import { provider } from "./provider";
import { env } from "../config/env";
import * as fs from "fs";
import * as path from "path";

function loadDirectoryAbi(): ethers.InterfaceAbi {
  try {
    const abiPath = path.join(__dirname, "../../../../shared/abi/RegistryDirectory.json");
    if (fs.existsSync(abiPath)) {
      return JSON.parse(fs.readFileSync(abiPath, "utf8"));
    }
  } catch {}
  return [
    "function applyAsRegistry(string name, string jurisdiction, string metadataURI) external returns (uint256)",
    "function isVerified(address signer) external view returns (bool)",
    "function getRegistry(uint256 registryId) external view returns (tuple(uint256 registryId, address signer, string name, string jurisdiction, string metadataURI, uint8 tier, uint256 appliedAt, uint256 decidedAt))",
    "function signerToRegistry(address signer) external view returns (uint256)"
  ];
}

export class DirectoryClient {
  private contract: ethers.Contract;

  constructor(address: string = env.DIRECTORY_CONTRACT_ADDRESS) {
    this.contract = new ethers.Contract(address, loadDirectoryAbi(), provider);
  }

  async isVerified(signer: string): Promise<boolean> {
    // TODO(P1): call contract.isVerified(signer)
    return this.contract.isVerified(signer);
  }

  async applyAsRegistry(name: string, jurisdiction: string, metadataURI: string, signer: ethers.Signer): Promise<bigint> {
    // TODO(P1): connect signer and send applyAsRegistry transaction
    throw new Error("DirectoryClient.applyAsRegistry: Not implemented");
  }
}
