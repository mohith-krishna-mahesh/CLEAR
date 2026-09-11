import { GraphQLClient } from "graphql-request";

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || "http://localhost:8000/subgraphs/name/clear/subgraph";

export const graphqlClient = new GraphQLClient(SUBGRAPH_URL, {
  headers: {},
});
