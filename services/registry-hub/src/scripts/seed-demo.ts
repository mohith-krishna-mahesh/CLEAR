import { randomUUID } from "crypto";
import { controlPlane, ensureControlPlane } from "../db/control-plane/client";
import { getTenantClient } from "../db/tenant/client-factory";
import { hashPassword } from "../lib/password";

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

const DEMO_PASSWORD = "password123";

const demoRegistries = [
  {
    id: "1",
    onChainId: 1n,
    name: "Registry Alpha (National Carbon Registry)",
    jurisdiction: "Costa Rica",
    email: "admin@registry-alpha.org",
    signerAddress: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
    tier: "VERIFIED",
    credits: [
      {
        id: "CR-101",
        projectName: "Kerala Wind Power Clean Project",
        vintage: 2024,
        amount: 500,
        ownerCompany: "Acme Renewables Corp",
        status: "ACTIVE",
      },
      {
        id: "CR-102",
        projectName: "Costa Rica Forest Restoration",
        vintage: 2025,
        amount: 1000,
        ownerCompany: "Sovereign Climate Fund",
        status: "ACTIVE",
      },
    ],
  },
  {
    id: "2",
    onChainId: 2n,
    name: "Registry Beta (Kenya Sovereign Ledger)",
    jurisdiction: "Kenya",
    email: "admin@registry-beta.org",
    signerAddress: "0x12b3886d85Ec62049AB918FC447364304047B9bD",
    tier: "VERIFIED",
    credits: [
      {
        id: "CR-201",
        projectName: "Kenya Geothermal Expansion",
        vintage: 2024,
        amount: 750,
        ownerCompany: "Great Rift Renewables",
        status: "ACTIVE",
      },
    ],
  },
] as const;

async function executeSqlBatch(
  run: (sql: string) => Promise<unknown>,
  sqlText: string,
): Promise<void> {
  for (const statement of sqlText.split(";")) {
    const sql = statement.trim();
    if (sql) {
      await run(sql);
    }
  }
}

async function seedTenant(registry: (typeof demoRegistries)[number]) {
  await controlPlane.$executeRawUnsafe(
    `CREATE SCHEMA IF NOT EXISTS "registry_${registry.id}"`,
  );

  const tenant = getTenantClient(registry.id);
  await executeSqlBatch(
    (sql) => tenant.$executeRawUnsafe(sql),
    TENANT_MIGRATION_SQL,
  );

  await tenant.$executeRawUnsafe(`DELETE FROM "TransferCache"`);
  await tenant.$executeRawUnsafe(`DELETE FROM "Credit"`);

  for (const credit of registry.credits) {
    await tenant.$executeRawUnsafe(
      `INSERT INTO "Credit" ("id", "projectName", "vintage", "amount", "ownerCompany", "status", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      credit.id,
      credit.projectName,
      credit.vintage,
      credit.amount,
      credit.ownerCompany,
      credit.status,
    );
  }
}

async function main() {
  await ensureControlPlane();

  const emails = demoRegistries.map((r) => r.email);
  const ids = demoRegistries.map((r) => r.id);
  const signers = demoRegistries.map((r) => r.signerAddress);

  await controlPlane.user.deleteMany({
    where: { OR: [{ email: { in: emails } }, { registryId: { in: ids } }] },
  });
  await controlPlane.registry.deleteMany({
    where: { OR: [{ id: { in: ids } }, { signerAddress: { in: signers } }] },
  });

  for (const registry of demoRegistries) {
    await seedTenant(registry);

    await controlPlane.registry.create({
      data: {
        id: registry.id,
        onChainId: registry.onChainId,
        name: registry.name,
        jurisdiction: registry.jurisdiction,
        signerAddress: registry.signerAddress,
        tier: registry.tier,
      },
    });

    await controlPlane.user.create({
      data: {
        id: randomUUID(),
        registryId: registry.id,
        email: registry.email,
        passwordHash: hashPassword(DEMO_PASSWORD),
        role: "registry",
      },
    });

    console.log(
      `[seed:demo] ${registry.name} #${registry.id} => ${registry.signerAddress}`,
    );
  }
}

main()
  .then(async () => {
    await controlPlane.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await controlPlane.$disconnect();
    process.exitCode = 1;
  });
