import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploys (or attaches to) a Gnosis Safe and transfers RegistryDirectory.council to it.
 *
 * Local / CI: if SAFE_OWNERS is unset, council stays the deployer EOA.
 * Testnet / mainnet: set SAFE_OWNERS (comma-separated) and SAFE_THRESHOLD, optionally
 * SAFE_FACTORY_ADDRESS / SAFE_SINGLETON_ADDRESS / SAFE_FALLBACK_ADDRESS.
 *
 * Canonical Safe v1.4.1 addresses are used when the chain is a known public network.
 */

const SAFE_V141 = {
  factory: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
  singleton: "0x29fcB43b46531BcA003ddC8FCB67FFE91900C762",
  fallback: "0xfd0732Dc9E303f09fCEf3a97b2A018De70C70A99",
};

const FACTORY_ABI = [
  "function createProxyWithNonce(address _singleton, bytes initializer, uint256 saltNonce) returns (address proxy)",
  "event ProxyCreation(address indexed proxy, address singleton)",
];

const SAFE_ABI = [
  "function setup(address[] _owners, uint256 _threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)",
  "function getOwners() view returns (address[])",
  "function getThreshold() view returns (uint256)",
];

function parseOwners(): string[] {
  return (process.env.SAFE_OWNERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const owners = parseOwners();
  const threshold = process.env.SAFE_THRESHOLD
    ? parseInt(process.env.SAFE_THRESHOLD, 10)
    : Math.max(1, Math.ceil((owners.length * 2) / 3));

  const deploymentPath = path.join(
    __dirname,
    "..",
    "deployments",
    "besu-local.json",
  );
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      `Deployment file not found at ${deploymentPath}. Run deploy.ts first.`,
    );
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const directoryAddress = deployment.RegistryDirectory?.address;
  if (!directoryAddress) {
    throw new Error("RegistryDirectory address missing from deployment record");
  }
  const directory = await ethers.getContractAt(
    "RegistryDirectory",
    directoryAddress,
    deployer,
  );

  if (owners.length === 0) {
    console.log(
      `[Council Safe] SAFE_OWNERS unset — council remains deployer EOA ${deployer.address}`,
    );
    deployment.CouncilSafe = {
      mode: "eoa-local",
      address: deployer.address,
      network: network.name,
    };
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    return;
  }

  if (owners.length < threshold) {
    throw new Error(
      `SAFE_THRESHOLD ${threshold} exceeds owner count ${owners.length}`,
    );
  }

  const factoryAddress = process.env.SAFE_FACTORY_ADDRESS || SAFE_V141.factory;
  const singletonAddress =
    process.env.SAFE_SINGLETON_ADDRESS || SAFE_V141.singleton;
  const fallbackAddress =
    process.env.SAFE_FALLBACK_ADDRESS || SAFE_V141.fallback;

  const code = await ethers.provider.getCode(factoryAddress);
  if (!code || code === "0x") {
    throw new Error(
      `Safe factory ${factoryAddress} is not deployed on ${network.name}. ` +
        `Set SAFE_FACTORY_ADDRESS/SAFE_SINGLETON_ADDRESS for this network, or omit SAFE_OWNERS for local EOA council.`,
    );
  }

  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, deployer);
  const safeInterface = new ethers.Interface(SAFE_ABI);
  const initializer = safeInterface.encodeFunctionData("setup", [
    owners,
    threshold,
    ethers.ZeroAddress,
    "0x",
    fallbackAddress,
    ethers.ZeroAddress,
    0,
    ethers.ZeroAddress,
  ]);

  const saltNonce = process.env.SAFE_SALT_NONCE
    ? BigInt(process.env.SAFE_SALT_NONCE)
    : BigInt(Date.now());

  console.log(
    `[Council Safe] Creating ${threshold}-of-${owners.length} Safe via ${factoryAddress}`,
  );
  const tx = await factory.createProxyWithNonce(
    singletonAddress,
    initializer,
    saltNonce,
  );
  const receipt = await tx.wait();

  let safeAddress: string | undefined;
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (parsed?.name === "ProxyCreation") {
        safeAddress = parsed.args.proxy ?? parsed.args[0];
      }
    } catch {
      // not a factory log
    }
  }
  if (!safeAddress) {
    throw new Error("Safe proxy address not found in ProxyCreation logs");
  }

  const safe = new ethers.Contract(safeAddress, SAFE_ABI, ethers.provider);
  const deployedOwners: string[] = await safe.getOwners();
  const deployedThreshold = await safe.getThreshold();
  console.log(
    `[Council Safe] Deployed at ${safeAddress} (threshold ${deployedThreshold}, owners ${deployedOwners.length})`,
  );

  const currentCouncil: string = await directory.council();
  if (currentCouncil.toLowerCase() !== safeAddress.toLowerCase()) {
    if (currentCouncil.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error(
        `Cannot transfer council: current council ${currentCouncil} is not the deployer. Execute transferCouncil(${safeAddress}) from the current council.`,
      );
    }
    const transferTx = await directory.transferCouncil(safeAddress);
    await transferTx.wait();
    console.log(
      `[Council Safe] RegistryDirectory.council transferred to ${safeAddress}`,
    );
  }

  deployment.CouncilSafe = {
    mode: "gnosis-safe",
    address: safeAddress,
    factory: factoryAddress,
    singleton: singletonAddress,
    threshold: Number(deployedThreshold),
    owners: deployedOwners,
    network: network.name,
  };
  deployment.RegistryDirectory.council = safeAddress;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`[Council Safe] Wrote council record to ${deploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
