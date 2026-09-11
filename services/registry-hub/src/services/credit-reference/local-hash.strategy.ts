import {
  CreditReferenceStrategy,
  CreditRecord,
} from "./credit-reference-strategy.interface";
import { ethers } from "ethers";

export class LocalHashReferenceStrategy implements CreditReferenceStrategy {
  async computeReference(credit: CreditRecord): Promise<string> {
    // TODO(P3): keccak256(abi.encode-equivalent hash) of credit.id + projectName + vintage + amount, via ethers.utils
    const packed = ethers.solidityPackedKeccak256(
      ["string", "string", "uint256", "uint256"],
      [credit.id, credit.projectName, credit.vintage, Math.floor(credit.amount)]
    );
    return packed;
  }
}
