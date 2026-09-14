import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    `[Deploy] Deploying contracts with deployer: ${deployer.address}`,
  );

  // Council defaults to deployer in local development
  const councilAddress = process.env.COUNCIL_ADDRESS || deployer.address;
  const expiryWindow = process.env.EXPIRY_WINDOW
    ? parseInt(process.env.EXPIRY_WINDOW, 10)
    : 3600;

  // 1. Deploy RegistryDirectory
  console.log(
    `[Deploy] Deploying RegistryDirectory (owner: ${deployer.address}, council: ${councilAddress})...`,
  );
  const DirectoryFactory = await ethers.getContractFactory("RegistryDirectory");
  const directory = await DirectoryFactory.deploy(
    deployer.address,
    councilAddress,
  );
  await directory.waitForDeployment();
  const directoryAddress = await directory.getAddress();
  console.log(`[Deploy] RegistryDirectory deployed at: ${directoryAddress}`);

  // 2. Deploy CLEARSettlement
  console.log(
    `[Deploy] Deploying CLEARSettlement (directory: ${directoryAddress}, expiryWindow: ${expiryWindow}s)...`,
  );
  const SettlementFactory = await ethers.getContractFactory("CLEARSettlement");
  const settlement = await SettlementFactory.deploy(
    deployer.address,
    directoryAddress,
    expiryWindow,
  );
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log(`[Deploy] CLEARSettlement deployed at: ${settlementAddress}`);

  // 3. Write deployment artifact to contracts/deployments/besu-local.json
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId || 1337,
    deployedAt: new Date().toISOString(),
    RegistryDirectory: {
      address: directoryAddress,
      owner: deployer.address,
      council: councilAddress,
    },
    CLEARSettlement: {
      address: settlementAddress,
      owner: deployer.address,
      directory: directoryAddress,
      expiryWindow,
    },
  };

  const deploymentPath = path.join(deploymentsDir, "besu-local.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`[Deploy] Wrote deployment record to: ${deploymentPath}`);

  // 4. Mirror ABIs to shared/abi/
  const sharedAbiDir = path.join(__dirname, "..", "..", "shared", "abi");
  if (!fs.existsSync(sharedAbiDir)) {
    fs.mkdirSync(sharedAbiDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(sharedAbiDir, "RegistryDirectory.json"),
    JSON.stringify(JSON.parse(directory.interface.formatJson()), null, 2),
  );
  fs.writeFileSync(
    path.join(sharedAbiDir, "CLEARSettlement.json"),
    JSON.stringify(JSON.parse(settlement.interface.formatJson()), null, 2),
  );
  console.log(`[Deploy] Mirrored ABIs to: ${sharedAbiDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
