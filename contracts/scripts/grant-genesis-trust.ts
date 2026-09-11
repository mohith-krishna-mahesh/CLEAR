import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * TEST FIXTURE SCRIPT:
 * Bypasses the HTTP onboarding flow to directly admit N test registries
 * for local dev and CI integration speed. This is NOT the production flow.
 */
async function main() {
  const deploymentPath = path.join(__dirname, "..", "deployments", "besu-local.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found at ${deploymentPath}. Run deploy.ts first.`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const directoryAddress = deployment.RegistryDirectory.address;

  const [council] = await ethers.getSigners();
  const directory = await ethers.getContractAt("RegistryDirectory", directoryAddress, council);

  console.log(`[Genesis Trust] Granting genesis trust via council: ${council.address}`);

  const testRegistries = [
    {
      name: "Registry Alpha",
      jurisdiction: "Country-Alpha",
      metadataURI: "ipfs://QmAlphaMetadataFixture",
      signer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat Account #1
    },
    {
      name: "Registry Beta",
      jurisdiction: "Country-Beta",
      metadataURI: "ipfs://QmBetaMetadataFixture",
      signer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat Account #2
    },
  ];

  for (const reg of testRegistries) {
    const existingId = await directory.signerToRegistry(reg.signer);
    if (existingId !== 0n) {
      console.log(`[Genesis Trust] Signer ${reg.signer} is already registered with ID: ${existingId}`);
      continue;
    }

    const regSigner = await ethers.getSigner(reg.signer);
    console.log(`[Genesis Trust] Applying for ${reg.name} from signer ${reg.signer}...`);
    const applyTx = await directory.connect(regSigner).applyAsRegistry(reg.name, reg.jurisdiction, reg.metadataURI);
    await applyTx.wait();

    const regId = await directory.signerToRegistry(reg.signer);
    console.log(`[Genesis Trust] Approving registry ID ${regId} via council...`);
    const approveTx = await directory.connect(council).approveRegistry(regId);
    await approveTx.wait();

    console.log(`[Genesis Trust] Successfully verified ${reg.name} (ID: ${regId})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
