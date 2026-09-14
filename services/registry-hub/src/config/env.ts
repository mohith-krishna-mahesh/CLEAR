import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3001"),
  RPC_URL: z.string().default("http://localhost:8545"),
  CHAIN_ID: z.string().default("1337"),
  SETTLEMENT_CONTRACT_ADDRESS: z
    .string()
    .default("0x0000000000000000000000000000000000000000"),
  DIRECTORY_CONTRACT_ADDRESS: z
    .string()
    .default("0x0000000000000000000000000000000000000000"),
  CONTROL_PLANE_DATABASE_URL: z
    .string()
    .default(
      "postgresql://postgres:postgres@localhost:5432/clear_db?schema=control_plane",
    ),
  TENANT_DATABASE_URL_BASE: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/clear_db"),
  JWT_SECRET: z
    .string()
    .default("super-secret-jwt-key-change-in-production-min-32-chars"),
  ENCRYPTION_KEY: z
    .string()
    .default(
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    ),
  VERIFICATION_MODE: z.string().default("auto-approve"),
  SIGNER_CUSTODY_MODE: z.string().default("app-encrypted"),
  CREDIT_REFERENCE_MODE: z.string().default("local-hash"),
  AUTO_APPROVE_ON_CHAIN: z.string().default("false"),
  COUNCIL_EMAIL: z.string().default("council@clear-ledger.org"),
  COUNCIL_PASSWORD: z.string().default("council-secret-pass"),
  VAULT_ADDR: z.string().optional().default(""),
  VAULT_TOKEN: z.string().optional().default(""),
  VAULT_TRANSIT_KEY: z.string().default("clear-signer"),
  SELF_CUSTODY_WEBHOOK_URL: z.string().optional().default(""),
  SELF_CUSTODY_ADDRESS: z.string().optional().default(""),
  SELF_CUSTODY_CONFIG: z.string().optional().default(""),
  CAD_TRUST_API_URL: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
