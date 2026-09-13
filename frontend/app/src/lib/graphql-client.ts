import { GraphQLClient, gql } from "graphql-request";

const SUBGRAPH_URL =
  import.meta.env.VITE_SUBGRAPH_URL ||
  "http://localhost:8000/subgraphs/name/clear/subgraph";

export const graphqlClient = new GraphQLClient(SUBGRAPH_URL, {
  headers: {},
});

export interface SubgraphRegistry {
  id: string;
  signer: string;
  name: string;
  jurisdiction: string;
  metadataURI: string;
  tier: "NONE" | "PENDING" | "OBSERVER" | "VERIFIED" | "REVOKED";
  appliedAt: string;
  decidedAt?: string | null;
}

export interface SubgraphTransfer {
  id: string;
  sourceRegistry: string;
  destRegistry: string;
  creditReference: string;
  amount: string;
  status: "INITIATED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  initiatedAt: string;
  completedAt?: string | null;
}

// --- GraphQL Query Documents ---

export const GET_AUDIT_METRICS = gql`
  query GetAuditMetrics {
    registries(where: { tier: "VERIFIED" }) {
      id
      name
      jurisdiction
      signer
      tier
    }
    completedTransfers: transfers(where: { status: "COMPLETED" }) {
      id
      amount
    }
    recentTransfers: transfers(
      orderBy: initiatedAt
      orderDirection: desc
      first: 10
    ) {
      id
      sourceRegistry
      destRegistry
      creditReference
      amount
      status
      initiatedAt
      completedAt
    }
  }
`;

export const GET_ALL_TRANSFERS = gql`
  query GetAllTransfers($first: Int = 100, $skip: Int = 0) {
    transfers(
      first: $first
      skip: $skip
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      sourceRegistry
      destRegistry
      creditReference
      amount
      status
      initiatedAt
      completedAt
    }
  }
`;

export const GET_ALL_REGISTRIES = gql`
  query GetAllRegistries {
    registries(orderBy: appliedAt, orderDirection: desc) {
      id
      signer
      name
      jurisdiction
      metadataURI
      tier
      appliedAt
      decidedAt
    }
  }
`;

export const GET_VERIFIED_REGISTRIES = gql`
  query GetVerifiedRegistries {
    registries(
      where: { tier: "VERIFIED" }
      orderBy: name
      orderDirection: asc
    ) {
      id
      signer
      name
      jurisdiction
      tier
    }
  }
`;

export const GET_PENDING_REGISTRIES = gql`
  query GetPendingRegistries {
    registries(
      where: { tier_in: ["PENDING", "OBSERVER"] }
      orderBy: appliedAt
      orderDirection: asc
    ) {
      id
      signer
      name
      jurisdiction
      metadataURI
      tier
      appliedAt
    }
  }
`;

export const GET_INCOMING_TRANSFERS = gql`
  query GetIncomingTransfers($destSigner: Bytes!) {
    transfers(
      where: { destRegistry: $destSigner, status: "INITIATED" }
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      sourceRegistry
      destRegistry
      creditReference
      amount
      status
      initiatedAt
    }
  }
`;

export const GET_REGISTRY_TRANSFERS = gql`
  query GetRegistryTransfers($signer: Bytes!) {
    outgoing: transfers(
      where: { sourceRegistry: $signer }
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      sourceRegistry
      destRegistry
      creditReference
      amount
      status
      initiatedAt
      completedAt
    }
    incoming: transfers(
      where: { destRegistry: $signer }
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      sourceRegistry
      destRegistry
      creditReference
      amount
      status
      initiatedAt
      completedAt
    }
  }
`;

// Helper fallbacks for demo/local testing when graph-node isn't running yet
export const DEFAULT_DEMO_REGISTRIES: SubgraphRegistry[] = [
  {
    id: "1",
    signer: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
    name: "Registry Alpha (National Carbon Registry)",
    jurisdiction: "Costa Rica",
    metadataURI: "ipfs://bafybeiclaroalpha2026",
    tier: "VERIFIED",
    appliedAt: "1726099200",
    decidedAt: "1726099800",
  },
  {
    id: "2",
    signer: "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
    name: "Registry Beta (Kenya Sovereign Ledger)",
    jurisdiction: "Kenya",
    metadataURI: "ipfs://bafybeiclarobeta2026",
    tier: "VERIFIED",
    appliedAt: "1726100000",
    decidedAt: "1726100400",
  },
  {
    id: "3",
    signer: "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef",
    name: "Registry Gamma (Voluntary Registry)",
    jurisdiction: "Indonesia",
    metadataURI: "ipfs://bafybeiclarogamma2026",
    tier: "PENDING",
    appliedAt: "1726101000",
    decidedAt: null,
  },
];

export const DEFAULT_DEMO_TRANSFERS: SubgraphTransfer[] = [
  {
    id: "1",
    sourceRegistry: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
    destRegistry: "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
    creditReference:
      "0x43522d3130312d4b6572616c6157696e64323032340000000000000000000000",
    amount: "5000",
    status: "COMPLETED",
    initiatedAt: "1726101200",
    completedAt: "1726101500",
  },
  {
    id: "2",
    sourceRegistry: "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
    destRegistry: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
    creditReference:
      "0x4b452d3530322d416672696361536f6c61723234000000000000000000000000",
    amount: "2500",
    status: "INITIATED",
    initiatedAt: "1726102000",
    completedAt: null,
  },
];
