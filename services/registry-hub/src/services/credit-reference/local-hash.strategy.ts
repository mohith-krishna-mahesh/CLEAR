import {
  CreditReferenceStrategy,
  CreditRecord,
} from "./credit-reference-strategy.interface";
import { ethers } from "ethers";

export class LocalHashReferenceStrategy implements CreditReferenceStrategy {
  async computeReference(credit: CreditRecord): Promise<string> {
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "uint256", "uint256"],
        [
          credit.id,
          credit.projectName,
          credit.vintage,
          Math.floor(credit.amount),
        ],
      ),
    );
  }
}
