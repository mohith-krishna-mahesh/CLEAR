import { expect } from "chai";
import { ethers } from "hardhat";
import { RegistryDirectory, CLEARSettlement } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CLEARSettlement", () => {
  let directory: RegistryDirectory;
  let settlement: CLEARSettlement;
  let owner: SignerWithAddress;
  let council: SignerWithAddress;
  let registryA: SignerWithAddress;
  let registryB: SignerWithAddress;
  let unverified: SignerWithAddress;

  const EXPIRY_WINDOW = 3600; // 1 hour in seconds
  const creditRef = ethers.encodeBytes32String("CREDIT-2026-VINTAGE-01");
  const transferAmount = 1000n;

  beforeEach(async () => {
    [owner, council, registryA, registryB, unverified] = await ethers.getSigners();

    const DirectoryFactory = await ethers.getContractFactory("RegistryDirectory");
    directory = (await DirectoryFactory.deploy(owner.address, council.address)) as RegistryDirectory;
    await directory.waitForDeployment();

    const SettlementFactory = await ethers.getContractFactory("CLEARSettlement");
    settlement = (await SettlementFactory.deploy(
      owner.address,
      await directory.getAddress(),
      EXPIRY_WINDOW
    )) as CLEARSettlement;
    await settlement.waitForDeployment();

    // Onboard and approve registryA
    await directory.connect(registryA).applyAsRegistry("Alpha", "Jur-A", "uriA");
    const regAId = await directory.signerToRegistry(registryA.address);
    await directory.connect(council).approveRegistry(regAId);

    // Onboard and approve registryB
    await directory.connect(registryB).applyAsRegistry("Beta", "Jur-B", "uriB");
    const regBId = await directory.signerToRegistry(registryB.address);
    await directory.connect(council).approveRegistry(regBId);
  });

  describe("transfer lifecycle", () => {
    it("should execute initiate -> complete happy path", async () => {
      const tx = await settlement.connect(registryA).initiateTransfer(
        registryB.address,
        creditRef,
        transferAmount
      );
      await tx.wait();

      const transferId = 1n;
      const transfer = await settlement.getTransfer(transferId);
      expect(transfer.sourceRegistry).to.equal(registryA.address);
      expect(transfer.destRegistry).to.equal(registryB.address);
      expect(transfer.amount).to.equal(transferAmount);
      expect(transfer.status).to.equal(0); // INITIATED

      // Destination completes transfer
      await expect(settlement.connect(registryB).completeTransfer(transferId))
        .to.emit(settlement, "TransferCompleted");

      const completed = await settlement.getTransfer(transferId);
      expect(completed.status).to.equal(1); // COMPLETED
      expect(completed.completedAt).to.be.greaterThan(0n);
    });

    it("reverts when an unverified caller attempts initiateTransfer", async () => {
      await expect(
        settlement.connect(unverified).initiateTransfer(registryB.address, creditRef, transferAmount)
      )
        .to.be.revertedWithCustomError(settlement, "NotVerifiedRegistry")
        .withArgs(unverified.address);
    });

    it("reverts when completeTransfer is called by wrong destination", async () => {
      await settlement.connect(registryA).initiateTransfer(
        registryB.address,
        creditRef,
        transferAmount
      );
      const transferId = 1n;

      // Caller is registryA (source) or unverified rather than registryB
      await expect(settlement.connect(registryA).completeTransfer(transferId))
        .to.be.revertedWithCustomError(settlement, "NotDestinationRegistry")
        .withArgs(transferId, registryA.address);
    });

    it("handles expiry: expire before window reverts, after window succeeds", async () => {
      await settlement.connect(registryA).initiateTransfer(
        registryB.address,
        creditRef,
        transferAmount
      );
      const transferId = 1n;

      // Attempt to expire immediately before window has passed
      await expect(settlement.expireTransfer(transferId))
        .to.be.revertedWithCustomError(settlement, "TransferNotExpirable")
        .withArgs(transferId);

      // Fast forward time past expiry window
      await time.increase(EXPIRY_WINDOW + 10);

      // Now expireTransfer succeeds
      await expect(settlement.expireTransfer(transferId))
        .to.emit(settlement, "TransferExpired")
        .withArgs(transferId);

      const expired = await settlement.getTransfer(transferId);
      expect(expired.status).to.equal(3); // EXPIRED
    });
  });
});
