import { ethers } from "ethers";
import {
  CreditReferenceStrategy,
  CreditRecord,
} from "./credit-reference-strategy.interface";
import { env } from "../../config/env";

/**
 * Prefers a CAD Trust observatory metadata hash when CAD_TRUST_API_URL is set.
 * Falls back to a deterministic CAD-namespaced keccak256 of local credit fields.
 */
export class CADTrustMetadataStrategy implements CreditReferenceStrategy {
  async computeReference(credit: CreditRecord): Promise<string> {
    const api = (env.CAD_TRUST_API_URL || "").replace(/\/$/, "");
    if (api) {
      try {
        const res = await fetch(
          `${api}/credits/${encodeURIComponent(credit.id)}`,
        );
        if (res.ok) {
          const meta = await res.json();
          return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(meta)));
        }
      } catch {
        // fall through to local CAD-namespaced hash
      }
    }

    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "string", "uint256", "uint256"],
        [
          "cad-trust",
          credit.id,
          credit.projectName,
          credit.vintage,
          Math.floor(credit.amount),
        ],
      ),
    );
  }
}
