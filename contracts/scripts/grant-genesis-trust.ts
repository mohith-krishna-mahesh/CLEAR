import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * TEST FIXTURE SCRIPT:
 * Bypasses the HTTP onboarding flow to directly admit N test registries
 * for local dev and CI integration speed. This is NOT the production flow.
 *
 * Signers default to the Hyperledger Besu genesis alloc accounts so this
 * works against besu-local. On a Hardhat node they are funded from the
 * council/deployer if their balance is zero.
 */
async function main() {
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
  const directoryAddress = deployment.RegistryDirectory.address;

  const [council] = await ethers.getSigners();
  const directory = await ethers.getContractAt(
    "RegistryDirectory",
    directoryAddress,
    council,
  );

  console.log(
    `[Genesis Trust] Granting genesis trust via council: ${council.address}`,
  );

  const testRegistries = [
    {
      name: "Registry Alpha",
      jurisdiction: "Country-Alpha",
      metadataURI: "ipfs://QmAlphaMetadataFixture",
      privateKey:
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
    },
    {
      name: "Registry Beta",
      jurisdiction: "Country-Beta",
      metadataURI: "ipfs://QmBetaMetadataFixture",
      privateKey:
        "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
    },
  ];

  for (const reg of testRegistries) {
    const regSigner = new ethers.Wallet(reg.privateKey, ethers.provider);
    const existingId = await directory.signerToRegistry(regSigner.address);
    if (existingId !== 0n) {
      const info = await directory.getRegistry(existingId);
      const verified = await directory.isVerified(regSigner.address);
      console.log(
        `[Genesis Trust] Signer ${regSigner.address} already registered with ID: ${existingId} (verified=${verified}, tier=${info.tier})`,
      );
      continue;
    }

    const balance = await ethers.provider.getBalance(regSigner.address);
    if (balance === 0n) {
      console.log(
        `[Genesis Trust] Funding ${regSigner.address} from council...`,
      );
      const fundTx = await council.sendTransaction({
        to: regSigner.address,
        value: ethers.parseEther("10"),
      });
      await fundTx.wait();
    }

    console.log(
      `[Genesis Trust] Applying for ${reg.name} from signer ${regSigner.address}...`,
    );
    const applyTx = await directory
      .connect(regSigner)
      .applyAsRegistry(reg.name, reg.jurisdiction, reg.metadataURI);
    await applyTx.wait();

    const regId = await directory.signerToRegistry(regSigner.address);
    console.log(
      `[Genesis Trust] Approving registry ID ${regId} via council...`,
    );
    const approveTx = await directory.connect(council).approveRegistry(regId);
    await approveTx.wait();

    const verified = await directory.isVerified(regSigner.address);
    if (!verified) {
      throw new Error(
        `[Genesis Trust] ${reg.name} was approved but isVerified returned false`,
      );
    }
    console.log(
      `[Genesis Trust] Successfully verified ${reg.name} (ID: ${regId}, signer: ${regSigner.address})`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
