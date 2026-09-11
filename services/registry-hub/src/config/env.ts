import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3001"),
  RPC_URL: z.string().default("http://localhost:8545"),
  CHAIN_ID: z.string().default("1337"),
  SETTLEMENT_CONTRACT_ADDRESS: z.string().default("0x0000000000000000000000000000000000000000"),
  DIRECTORY_CONTRACT_ADDRESS: z.string().default("0x0000000000000000000000000000000000000000"),
  CONTROL_PLANE_DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/clear_db?schema=control_plane"),
  TENANT_DATABASE_URL_BASE: z.string().default("postgresql://postgres:postgres@localhost:5432/clear_db"),
  JWT_SECRET: z.string().default("default-jwt-secret-key-for-development-min-32-chars"),
  ENCRYPTION_KEY: z.string().default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  VERIFICATION_MODE: z.string().default("auto-approve"),
  SIGNER_CUSTODY_MODE: z.string().default("app-encrypted"),
  CREDIT_REFERENCE_MODE: z.string().default("local-hash"),
});

export const env = envSchema.parse(process.env);
