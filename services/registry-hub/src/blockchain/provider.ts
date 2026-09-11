import { ethers } from "ethers";
import { env } from "../config/env";

/**
 * Singleton JSON-RPC provider connected to the Besu node.
 */
export const provider = new ethers.JsonRpcProvider(env.RPC_URL, {
  chainId: parseInt(env.CHAIN_ID, 10),
  name: "besu-local",
});
