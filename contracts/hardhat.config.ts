import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const CHAIN_ID = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : 1337;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    "besu-local": {
      url: RPC_URL,
      chainId: CHAIN_ID,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [
            // Standard dev test private key for local Besu dev node
            "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
          ],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test/unit",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
