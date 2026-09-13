import * as fs from "fs";
import * as path from "path";
import { randomBytes } from "crypto";
import { controlPlane, ensureControlPlane } from "../db/control-plane/client";
import { getTenantClient } from "../db/tenant/client-factory";
import { DirectoryClient } from "../blockchain/directory.client";
import { getRegistrySigner, getSignerCustody } from "./strategies";

export interface OnboardingParams {
  name: string;
  jurisdiction: string;
  metadataURI: string;
}

const TENANT_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS "Credit" (
  "id" TEXT PRIMARY KEY,
  "projectName" TEXT NOT NULL,
  "vintage" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "ownerCompany" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "SignerSecret" (
  "id" TEXT PRIMARY KEY,
  "ciphertext" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "authTag" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "TransferCache" (
  "id" TEXT PRIMARY KEY,
  "onChainId" BIGINT NOT NULL UNIQUE,
  "direction" TEXT NOT NULL,
  "counterparty" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

function newRegistryId(): string {
  return `c${randomBytes(12).toString("hex")}`;
}

function assertSafeRegistryId(registryId: string): void {
  if (!/^[A-Za-z0-9_]+$/.test(registryId)) {
    throw new Error(`Invalid registry id: ${registryId}`);
  }
}

function loadTenantMigrationSql(): string {
  const candidates = [
    path.join(__dirname, "../db/tenant/migrations"),
    path.join(process.cwd(), "src/db/tenant/migrations"),
    path.join(process.cwd(), "services/registry-hub/src/db/tenant/migrations"),
  ];
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    if (files.length === 0) continue;
    return files.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  }
  return TENANT_MIGRATION_SQL;
}

async function executeSqlBatch(run: (sql: string) => Promise<unknown>, sqlText: string): Promise<void> {
  for (const statement of sqlText.split(";")) {
    const sql = statement.trim();
    if (sql) {
      await run(sql);
    }
  }
}

export class OnboardingService {
  constructor(
    private readonly directory = new DirectoryClient(),
    private readonly custody = getSignerCustody()
  ) {}

  async onboardRegistry(
    params: OnboardingParams
  ): Promise<{ registryId: string; signerAddress: string; onChainId: string }> {
    await ensureControlPlane();

    const registryId = newRegistryId();
    assertSafeRegistryId(registryId);
    const schemaName = `registry_${registryId}`;

    // 1. Schema must exist before any tenant writes (signer secret, credits, cache).
    await controlPlane.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // 2. Apply tenant migration SQL against the new schema.
    const tenant = getTenantClient(registryId);
    await executeSqlBatch((sql) => tenant.$executeRawUnsafe(sql), loadTenantMigrationSql());

    // 3. Provision the registry signer (writes into the tenant schema).
    const { address: signerAddress } = await this.custody.provisionSigner(registryId);
    const signer = await getRegistrySigner(registryId, signerAddress);

    // 4. Submit the on-chain application as that signer.
    const onChainId = await this.directory.applyAsRegistry(
      params.name,
      params.jurisdiction,
      params.metadataURI,
      signer
    );

    // 5. Persist the control-plane Registry row last, now that chain + schema exist.
    await controlPlane.registry.create({
      data: {
        id: registryId,
        onChainId,
        name: params.name,
        jurisdiction: params.jurisdiction,
        signerAddress,
        tier: "PENDING",
      },
    });

    return { registryId, signerAddress, onChainId: onChainId.toString() };
  }

  async getStatus(registryId: string) {
    await ensureControlPlane();
    const registry = await controlPlane.registry.findUnique({ where: { id: registryId } });
    if (!registry) {
      return null;
    }
    return {
      ...registry,
      onChainId: registry.onChainId.toString(),
    };
  }
}
