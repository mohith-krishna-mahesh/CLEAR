#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const deploymentPath = path.join(root, "contracts/deployments/besu-local.json");

if (!fs.existsSync(deploymentPath)) {
  console.error(
    `[env:sync] Missing ${deploymentPath}. Run pnpm run contracts:deploy first.`,
  );
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const directoryAddress = deployment.RegistryDirectory?.address;
const settlementAddress = deployment.CLEARSettlement?.address;

if (!directoryAddress || !settlementAddress) {
  console.error("[env:sync] Deployment file is missing contract addresses.");
  process.exit(1);
}

const backendValues = {
  RPC_URL: "http://localhost:8545",
  CHAIN_ID: "1337",
  SETTLEMENT_CONTRACT_ADDRESS: settlementAddress,
  DIRECTORY_CONTRACT_ADDRESS: directoryAddress,
  CONTROL_PLANE_DATABASE_URL:
    "postgresql://postgres:postgres@localhost:5432/clear_db?schema=control_plane",
  TENANT_DATABASE_URL_BASE:
    "postgresql://postgres:postgres@localhost:5432/clear_db",
  JWT_SECRET: "super-secret-jwt-key-change-in-production-min-32-chars",
  ENCRYPTION_KEY:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  VERIFICATION_MODE: "auto-approve",
  AUTO_APPROVE_ON_CHAIN: "false",
  SIGNER_CUSTODY_MODE: "app-encrypted",
  CREDIT_REFERENCE_MODE: "local-hash",
  COUNCIL_EMAIL: "council@clear-ledger.org",
  COUNCIL_PASSWORD: "council-secret-pass",
};

const frontendValues = {
  VITE_API_URL: "http://localhost:3001/api",
  VITE_SUBGRAPH_URL: "http://localhost:8000/subgraphs/name/clear/subgraph",
  VITE_BLOCKSCOUT_URL: "http://localhost:4000",
  VITE_DEMO_FALLBACK: "true",
};

function quoteEnvValue(value) {
  return /[\s#?&=]/.test(value) ? JSON.stringify(value) : value;
}

function upsertEnvFile(filePath, values, seedPath) {
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  } else if (seedPath && fs.existsSync(seedPath)) {
    content = fs.readFileSync(seedPath, "utf8");
  }

  const keys = new Set(Object.keys(values));
  const seen = new Set();
  const lines = content
    .split(/\r?\n/)
    .filter((line, index, arr) => index < arr.length - 1 || line.length > 0)
    .map((line) => {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
      if (!match || !keys.has(match[1])) {
        return line;
      }
      seen.add(match[1]);
      return `${match[1]}=${quoteEnvValue(values[match[1]])}`;
    });

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      lines.push(`${key}=${quoteEnvValue(value)}`);
    }
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
  console.log(`[env:sync] Updated ${path.relative(root, filePath)}`);
}

upsertEnvFile(
  path.join(root, ".env"),
  backendValues,
  path.join(root, ".env.example"),
);
upsertEnvFile(
  path.join(root, "services/registry-hub/.env"),
  backendValues,
  path.join(root, "services/registry-hub/.env.example"),
);
upsertEnvFile(path.join(root, "frontend/app/.env.local"), frontendValues);

console.log(`[env:sync] RegistryDirectory=${directoryAddress}`);
console.log(`[env:sync] CLEARSettlement=${settlementAddress}`);
