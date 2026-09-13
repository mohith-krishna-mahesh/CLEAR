import { ethers } from "ethers";
import { provider } from "./provider";
import { env } from "../config/env";
import * as fs from "fs";
import * as path from "path";

function loadDirectoryAbi(): ethers.InterfaceAbi {
  const candidates = [
    path.join(__dirname, "../../../../shared/abi/RegistryDirectory.json"),
    path.join(process.cwd(), "shared/abi/RegistryDirectory.json"),
    path.join(process.cwd(), "../../shared/abi/RegistryDirectory.json"),
  ];
  for (const abiPath of candidates) {
    try {
      if (!fs.existsSync(abiPath)) continue;
      const parsed = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.abi)) return parsed.abi;
      if (typeof parsed === "string") return JSON.parse(parsed);
    } catch {
      // try next path
    }
  }
  return [
    "function applyAsRegistry(string name, string jurisdiction, string metadataURI) external returns (uint256)",
    "function isVerified(address signer) external view returns (bool)",
    "function getRegistry(uint256 registryId) external view returns (tuple(uint256 registryId, address signer, string name, string jurisdiction, string metadataURI, uint8 tier, uint256 appliedAt, uint256 decidedAt))",
    "function signerToRegistry(address signer) external view returns (uint256)",
    "function approveRegistry(uint256 registryId) external",
    "function rejectApplication(uint256 registryId) external",
  ];
}

export class DirectoryClient {
  private contract: ethers.Contract;

  constructor(address: string = env.DIRECTORY_CONTRACT_ADDRESS) {
    this.contract = new ethers.Contract(address, loadDirectoryAbi(), provider);
  }

  async isVerified(signer: string): Promise<boolean> {
    return Boolean(await this.contract.isVerified(signer));
  }

  async signerToRegistry(signer: string): Promise<bigint> {
    return BigInt(await this.contract.signerToRegistry(signer));
  }

  async getRegistry(registryId: bigint) {
    return this.contract.getRegistry(registryId);
  }

  async applyAsRegistry(
    name: string,
    jurisdiction: string,
    metadataURI: string,
    signer: ethers.Signer
  ): Promise<bigint> {
    const connected = this.contract.connect(signer) as ethers.Contract;
    const tx = await connected.applyAsRegistry(name, jurisdiction, metadataURI);
    await tx.wait();
    return this.signerToRegistry(await signer.getAddress());
  }

  async approveRegistry(registryId: bigint, signer: ethers.Signer): Promise<void> {
    const connected = this.contract.connect(signer) as ethers.Contract;
    const tx = await connected.approveRegistry(registryId);
    await tx.wait();
  }

  async rejectApplication(registryId: bigint, signer: ethers.Signer): Promise<void> {
    const connected = this.contract.connect(signer) as ethers.Contract;
    const tx = await connected.rejectApplication(registryId);
    await tx.wait();
  }
}
