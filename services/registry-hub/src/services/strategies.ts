import { ethers } from "ethers";
import { env } from "../config/env";
import { provider } from "../blockchain/provider";
import { SignerCustodyStrategy } from "./signer-custody/signer-custody-strategy.interface";
import { AppEncryptedCustodyStrategy } from "./signer-custody/app-encrypted.strategy";
import { SelfCustodyStrategy } from "./signer-custody/self-custody.strategy";
import { VaultTransitCustodyStrategy } from "./signer-custody/vault-transit.strategy";
import { CreditInventoryStrategy } from "./credit-inventory/credit-inventory-strategy.interface";
import { SimulatorInventoryAdapter } from "./credit-inventory/simulator.adapter";
import { CreditReferenceStrategy } from "./credit-reference/credit-reference-strategy.interface";
import { LocalHashReferenceStrategy } from "./credit-reference/local-hash.strategy";
import { CADTrustMetadataStrategy } from "./credit-reference/cad-trust-metadata.strategy";
import { VerificationStrategy } from "./verification/verification-strategy.interface";
import { AutoApproveStrategy } from "./verification/auto-approve.strategy";
import { ManualReviewStrategy } from "./verification/manual-review.strategy";

/** Well-known local Besu genesis / Hardhat-funded keys for fixture registries. */
const LOCAL_PRIVATE_KEYS: Record<string, string> = {
  "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73":
    "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
  "0x627306090abab3a6e1400e9345bc60c78a8bef57":
    "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
  "0xf17f52151ebef6c7334fad080c5704d77216b732":
    "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266":
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8":
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc":
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
};

export function getSignerCustody(): SignerCustodyStrategy {
  switch (env.SIGNER_CUSTODY_MODE) {
    case "self-custody":
      return new SelfCustodyStrategy();
    case "vault-transit":
      return new VaultTransitCustodyStrategy();
    case "app-encrypted":
    default:
      return new AppEncryptedCustodyStrategy();
  }
}

export function getCreditInventory(): CreditInventoryStrategy {
  return new SimulatorInventoryAdapter();
}

export function getCreditReference(): CreditReferenceStrategy {
  switch (env.CREDIT_REFERENCE_MODE) {
    case "cad-trust":
      return new CADTrustMetadataStrategy();
    case "local-hash":
    default:
      return new LocalHashReferenceStrategy();
  }
}

export function getVerification(): VerificationStrategy {
  switch (env.VERIFICATION_MODE) {
    case "manual-review":
    case "manual":
      return new ManualReviewStrategy();
    case "auto-approve":
    default:
      return new AutoApproveStrategy();
  }
}

export function getCouncilSigner(): ethers.Wallet {
  const pk =
    process.env.COUNCIL_PRIVATE_KEY ||
    process.env.PRIVATE_KEY ||
    process.env.FAUCET_PRIVATE_KEY ||
    "";
  if (pk) {
    return new ethers.Wallet(pk, provider);
  }
  return new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider,
  );
}

export async function getFunderWallet(): Promise<ethers.Wallet> {
  const candidates = [
    process.env.FAUCET_PRIVATE_KEY,
    process.env.COUNCIL_PRIVATE_KEY,
    process.env.PRIVATE_KEY,
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
  ].filter(Boolean) as string[];

  for (const key of candidates) {
    const wallet = new ethers.Wallet(key, provider);
    try {
      const balance = await provider.getBalance(wallet.address);
      if (balance > ethers.parseEther("0.05")) {
        return wallet;
      }
    } catch {
      // try next
    }
  }
  throw new Error("No funded faucet account found on the connected RPC");
}

export async function fundAddress(
  address: string,
  amountEth = "1",
): Promise<void> {
  const funder = await getFunderWallet();
  const balance = await provider.getBalance(address);
  if (balance >= ethers.parseEther("0.05")) {
    return;
  }
  const tx = await funder.sendTransaction({
    to: address,
    value: ethers.parseEther(amountEth),
  });
  await tx.wait();
}

export function walletForAddress(address: string): ethers.Wallet | null {
  const key = LOCAL_PRIVATE_KEYS[address.toLowerCase()];
  if (!key) {
    return null;
  }
  return new ethers.Wallet(key, provider);
}

export async function getRegistrySigner(
  registryId: string,
  signerAddress: string,
): Promise<ethers.Signer> {
  const local = walletForAddress(signerAddress);
  if (local) {
    return local;
  }

  const custody = getSignerCustody();
  return new CustodyBackedSigner(signerAddress, registryId, custody);
}

class CustodyBackedSigner extends ethers.AbstractSigner {
  constructor(
    private readonly signerAddress: string,
    private readonly registryId: string,
    private readonly custody: SignerCustodyStrategy,
  ) {
    super(provider);
  }

  async getAddress(): Promise<string> {
    return this.signerAddress;
  }

  connect(nextProvider: ethers.Provider | null): ethers.Signer {
    if (!nextProvider) {
      return this;
    }
    return new CustodyBackedSigner(
      this.signerAddress,
      this.registryId,
      this.custody,
    );
  }

  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    const from = await this.getAddress();
    const nonce = tx.nonce ?? (await provider.getTransactionCount(from));
    const network = await provider.getNetwork();
    const { signedTx } = await this.custody.signTransaction(this.registryId, {
      to: (tx.to as string) ?? "",
      data: (tx.data as string) ?? "0x",
      nonce: Number(nonce),
      chainId: Number(tx.chainId ?? network.chainId),
      gasLimit: tx.gasLimit?.toString() ?? "800000",
    });
    return signedTx;
  }

  async signMessage(_message: string | Uint8Array): Promise<string> {
    throw new Error("CustodyBackedSigner.signMessage is not supported");
  }

  async signTypedData(
    _domain: ethers.TypedDataDomain,
    _types: Record<string, ethers.TypedDataField[]>,
    _value: Record<string, unknown>,
  ): Promise<string> {
    throw new Error("CustodyBackedSigner.signTypedData is not supported");
  }
}
