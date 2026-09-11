import { ethers } from "ethers";
import { provider } from "./provider";
import { env } from "../config/env";
import * as fs from "fs";
import * as path from "path";

function loadSettlementAbi(): ethers.InterfaceAbi {
  try {
    const abiPath = path.join(__dirname, "../../../../shared/abi/CLEARSettlement.json");
    if (fs.existsSync(abiPath)) {
      return JSON.parse(fs.readFileSync(abiPath, "utf8"));
    }
  } catch {}
  return [
    "function initiateTransfer(address destRegistry, bytes32 creditReference, uint256 amount) external returns (uint256)",
    "function completeTransfer(uint256 transferId) external",
    "function cancelTransfer(uint256 transferId) external",
    "function expireTransfer(uint256 transferId) external",
    "function getTransfer(uint256 transferId) external view returns (tuple(uint256 transferId, address sourceRegistry, address destRegistry, bytes32 creditReference, uint256 amount, uint8 status, uint256 initiatedAt, uint256 completedAt))"
  ];
}

export class SettlementClient {
  private contract: ethers.Contract;

  constructor(address: string = env.SETTLEMENT_CONTRACT_ADDRESS) {
    this.contract = new ethers.Contract(address, loadSettlementAbi(), provider);
  }

  async getTransfer(transferId: bigint): Promise<any> {
    // TODO(P1): wrap contract.getTransfer(transferId)
    return this.contract.getTransfer(transferId);
  }

  async initiateTransfer(
    destRegistry: string,
    creditReference: string,
    amount: bigint,
    signer: ethers.Signer
  ): Promise<bigint> {
    // TODO(P1): connect signer and call initiateTransfer
    throw new Error("SettlementClient.initiateTransfer: Not implemented");
  }

  async completeTransfer(transferId: bigint, signer: ethers.Signer): Promise<void> {
    // TODO(P1): connect signer and call completeTransfer
    throw new Error("SettlementClient.completeTransfer: Not implemented");
  }

  async cancelTransfer(transferId: bigint, signer: ethers.Signer): Promise<void> {
    // TODO(P1): connect signer and call cancelTransfer
    throw new Error("SettlementClient.cancelTransfer: Not implemented");
  }
}
