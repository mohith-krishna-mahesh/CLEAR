import { ethers } from "ethers";
import { provider } from "./provider";
import { env } from "../config/env";
import * as fs from "fs";
import * as path from "path";

function loadSettlementAbi(): ethers.InterfaceAbi {
  const candidates = [
    path.join(__dirname, "../../../../shared/abi/CLEARSettlement.json"),
    path.join(process.cwd(), "shared/abi/CLEARSettlement.json"),
    path.join(process.cwd(), "../../shared/abi/CLEARSettlement.json"),
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
    "function initiateTransfer(address destRegistry, bytes32 creditReference, uint256 amount) external returns (uint256)",
    "function completeTransfer(uint256 transferId) external",
    "function cancelTransfer(uint256 transferId) external",
    "function expireTransfer(uint256 transferId) external",
    "function getTransfer(uint256 transferId) external view returns (tuple(uint256 transferId, address sourceRegistry, address destRegistry, bytes32 creditReference, uint256 amount, uint8 status, uint256 initiatedAt, uint256 completedAt))",
    "event TransferInitiated(uint256 indexed transferId, address indexed sourceRegistry, address indexed destRegistry, bytes32 creditReference, uint256 amount)",
  ];
}

export class SettlementClient {
  private contract: ethers.Contract;

  constructor(address: string = env.SETTLEMENT_CONTRACT_ADDRESS) {
    this.contract = new ethers.Contract(address, loadSettlementAbi(), provider);
  }

  async getTransfer(transferId: bigint): Promise<{
    transferId: bigint;
    sourceRegistry: string;
    destRegistry: string;
    creditReference: string;
    amount: bigint;
    status: number;
    initiatedAt: bigint;
    completedAt: bigint;
  }> {
    const t = await this.contract.getTransfer(transferId);
    return {
      transferId: BigInt(t.transferId ?? t[0]),
      sourceRegistry: t.sourceRegistry ?? t[1],
      destRegistry: t.destRegistry ?? t[2],
      creditReference: t.creditReference ?? t[3],
      amount: BigInt(t.amount ?? t[4]),
      status: Number(t.status ?? t[5]),
      initiatedAt: BigInt(t.initiatedAt ?? t[6]),
      completedAt: BigInt(t.completedAt ?? t[7]),
    };
  }

  async initiateTransfer(
    destRegistry: string,
    creditReference: string,
    amount: bigint,
    signer: ethers.Signer,
  ): Promise<bigint> {
    const connected = this.contract.connect(signer) as ethers.Contract;
    const tx = await connected.initiateTransfer(
      destRegistry,
      creditReference,
      amount,
    );
    const receipt = await tx.wait();
    const parsedId = this.parseTransferId(receipt);
    if (parsedId !== null) {
      return parsedId;
    }
    throw new Error(
      "SettlementClient.initiateTransfer: TransferInitiated event not found",
    );
  }

  async completeTransfer(
    transferId: bigint,
    signer: ethers.Signer,
  ): Promise<void> {
    const connected = this.contract.connect(signer) as ethers.Contract;
    const tx = await connected.completeTransfer(transferId);
    await tx.wait();
  }

  async cancelTransfer(
    transferId: bigint,
    signer: ethers.Signer,
  ): Promise<void> {
    const connected = this.contract.connect(signer) as ethers.Contract;
    const tx = await connected.cancelTransfer(transferId);
    await tx.wait();
  }

  private parseTransferId(
    receipt: ethers.TransactionReceipt | null,
  ): bigint | null {
    if (!receipt) return null;
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
        if (parsed?.name === "TransferInitiated") {
          return BigInt(parsed.args.transferId ?? parsed.args[0]);
        }
      } catch {
        // not a settlement log
      }
    }
    return null;
  }
}
