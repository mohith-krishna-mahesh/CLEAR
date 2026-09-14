import { expect } from "chai";
import { ethers } from "hardhat";
import { RegistryDirectory } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RegistryDirectory", () => {
  let directory: RegistryDirectory;
  let owner: SignerWithAddress;
  let council: SignerWithAddress;
  let registryA: SignerWithAddress;
  let registryB: SignerWithAddress;
  let stranger: SignerWithAddress;

  beforeEach(async () => {
    [owner, council, registryA, registryB, stranger] =
      await ethers.getSigners();
    const Factory = await ethers.getContractFactory("RegistryDirectory");
    directory = (await Factory.deploy(
      owner.address,
      council.address,
    )) as RegistryDirectory;
    await directory.waitForDeployment();
  });

  describe("apply and approval flow", () => {
    it("should allow a registry to apply and council to approve (apply -> approve -> isVerified true)", async () => {
      // Apply as registry
      const tx = await directory
        .connect(registryA)
        .applyAsRegistry(
          "Registry Alpha",
          "Jurisdiction-A",
          "https://registry-a.org/metadata.json",
        );
      await tx.wait();

      const regId = await directory.signerToRegistry(registryA.address);
      expect(regId).to.equal(1n);

      // Before council approval, isVerified should be false (it's PENDING)
      expect(await directory.isVerified(registryA.address)).to.be.false;

      // Council approves
      await expect(directory.connect(council).approveRegistry(regId))
        .to.emit(directory, "RegistryApproved")
        .withArgs(regId);

      // Now isVerified must be true
      expect(await directory.isVerified(registryA.address)).to.be.true;
    });

    it("should allow council to reject an application (apply -> reject -> isVerified false)", async () => {
      await directory
        .connect(registryB)
        .applyAsRegistry(
          "Registry Beta",
          "Jurisdiction-B",
          "https://registry-b.org/metadata.json",
        );
      const regId = await directory.signerToRegistry(registryB.address);

      // Council rejects
      await expect(directory.connect(council).rejectApplication(regId))
        .to.emit(directory, "RegistryRejected")
        .withArgs(regId);

      expect(await directory.isVerified(registryB.address)).to.be.false;
    });

    it("reverts if non-council tries to approve", async () => {
      await directory
        .connect(registryA)
        .applyAsRegistry("Reg A", "Jur A", "uri");
      const regId = await directory.signerToRegistry(registryA.address);

      await expect(directory.connect(stranger).approveRegistry(regId))
        .to.be.revertedWithCustomError(directory, "NotCouncil")
        .withArgs(stranger.address);
    });

    it("reverts if signer applies twice", async () => {
      await directory
        .connect(registryA)
        .applyAsRegistry("Reg A", "Jur A", "uri");
      await expect(
        directory
          .connect(registryA)
          .applyAsRegistry("Reg A2", "Jur A2", "uri2"),
      )
        .to.be.revertedWithCustomError(directory, "SignerAlreadyRegistered")
        .withArgs(registryA.address);
    });
  });

  describe("signer rotation", () => {
    it("allows registry signer to rotate to an unallocated signer address", async () => {
      await directory
        .connect(registryA)
        .applyAsRegistry("Reg A", "Jur A", "uri");
      const regId = await directory.signerToRegistry(registryA.address);
      await directory.connect(council).approveRegistry(regId);

      const newSigner = stranger;
      await expect(
        directory.connect(registryA).rotateSigner(regId, newSigner.address),
      )
        .to.emit(directory, "SignerRotated")
        .withArgs(regId, registryA.address, newSigner.address);

      expect(await directory.signerToRegistry(registryA.address)).to.equal(0n);
      expect(await directory.signerToRegistry(newSigner.address)).to.equal(
        regId,
      );
      expect(await directory.isVerified(newSigner.address)).to.be.true;
      expect(await directory.isVerified(registryA.address)).to.be.false;
    });
  });
});
