export interface OnboardingParams {
  name: string;
  jurisdiction: string;
  metadataURI: string;
}

export class OnboardingService {
  async onboardRegistry(params: OnboardingParams): Promise<{ registryId: string; signerAddress: string }> {
    // TODO(P1): on registry creation — run CREATE SCHEMA registry_<id>; against CONTROL_PLANE_DATABASE_URL's connection, apply the tenant migration SQL (from src/db/tenant/migrations) against that new schema via prisma db execute or an equivalent raw-SQL runner, THEN orchestrate provisionSigner → applyAsRegistry on-chain call → write the control-plane Registry row. Order matters: the schema must exist and be migrated before any tenant data is written to it.
    throw new Error("OnboardingService: Not implemented");
  }
}
