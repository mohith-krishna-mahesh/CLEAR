import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env";

const tenantClients = new Map<string, PrismaClient>();

/**
 * Returns a PrismaClient connected to the tenant-specific schema (registry_<id>).
 * Unqualified table names in the tenant schema.prisma mean this routes correctly
 * via Postgres search_path, preserving strict schema isolation without codegen locking.
 */
export function getTenantClient(registryId: string): PrismaClient {
  // TODO(P1): implement schema-per-tenant connection caching — unqualified table names in tenant schema.prisma mean this actually routes correctly via search_path, unlike a multiSchema-tagged client would
  const existing = tenantClients.get(registryId);
  if (existing) {
    return existing;
  }

  const schemaName = `registry_${registryId}`;
  const baseUrl = env.TENANT_DATABASE_URL_BASE;
  const separator = baseUrl.includes("?") ? "&" : "?";
  const tenantUrl = `${baseUrl}${separator}schema=${schemaName}`;

  const client = new PrismaClient({
    datasources: {
      db: {
        url: tenantUrl,
      },
    },
  });

  tenantClients.set(registryId, client);
  return client;
}
