import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env";

export const controlPlane = new PrismaClient({
  datasources: {
    db: {
      url: env.CONTROL_PLANE_DATABASE_URL,
    },
  },
});

const CONTROL_PLANE_DDL = `
CREATE SCHEMA IF NOT EXISTS control_plane;
CREATE TABLE IF NOT EXISTS control_plane."Registry" (
  "id" TEXT PRIMARY KEY,
  "onChainId" BIGINT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "jurisdiction" TEXT NOT NULL,
  "signerAddress" TEXT NOT NULL UNIQUE,
  "tier" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS control_plane."User" (
  "id" TEXT PRIMARY KEY,
  "registryId" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

let controlPlaneReady: Promise<void> | null = null;

export function ensureControlPlane(): Promise<void> {
  if (!controlPlaneReady) {
    controlPlaneReady = (async () => {
      for (const statement of CONTROL_PLANE_DDL.split(";")) {
        const sql = statement.trim();
        if (sql) {
          await controlPlane.$executeRawUnsafe(sql);
        }
      }
    })().catch((err) => {
      controlPlaneReady = null;
      throw err;
    });
  }
  return controlPlaneReady;
}
