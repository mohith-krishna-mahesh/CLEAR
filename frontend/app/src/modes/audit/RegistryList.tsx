import React, { useEffect, useState, useMemo } from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import {
  graphqlClient,
  GET_ALL_REGISTRIES,
  SubgraphRegistry,
  DEFAULT_DEMO_REGISTRIES,
} from "../../lib/graphql-client";

export const RegistryList: React.FC = () => {
  const [registries, setRegistries] = useState<SubgraphRegistry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const loadRegistries = async () => {
    setLoading(true);
    try {
      const data = await graphqlClient.request<{
        registries: SubgraphRegistry[];
      }>(GET_ALL_REGISTRIES);
      setRegistries(data.registries);
    } catch (err) {
      console.warn(
        "Subgraph unreachable, falling back to default registries:",
        err,
      );
      setRegistries(DEFAULT_DEMO_REGISTRIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistries();
  }, []);

  const filteredRegistries = useMemo(() => {
    return registries.filter((r) => {
      const matchesTier = tierFilter === "ALL" || r.tier === tierFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(q) ||
        r.jurisdiction.toLowerCase().includes(q) ||
        r.signer.toLowerCase().includes(q);
      return matchesTier && matchesSearch;
    });
  }, [registries, tierFilter, search]);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatDate = (timestamp?: string | null) => {
    if (!timestamp) return "-";
    const num = parseInt(timestamp, 10);
    if (!num) return "-";
    return new Date(num * 1000).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Accredited Registries
          </h1>
          <p className="text-sm text-gray-500">
            Public directory of sovereign and voluntary carbon registries
            admitted to the CLEAR network.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadRegistries}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, jurisdiction, or signer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Trust Tier:
          </span>
          {["ALL", "VERIFIED", "OBSERVER", "PENDING", "REVOKED"].map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                tierFilter === tier
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <Table
        headers={[
          "ID",
          "Registry Name",
          "Jurisdiction",
          "Signer Address",
          "Trust Tier",
          "Applied At",
          "Decided At",
        ]}
      >
        {filteredRegistries.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              className="px-6 py-8 text-center text-sm text-gray-500"
            >
              {loading
                ? "Loading registries from subgraph..."
                : "No registries match the criteria."}
            </td>
          </tr>
        ) : (
          filteredRegistries.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                #{r.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {r.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {r.jurisdiction}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600"
                title={r.signer}
              >
                {formatAddress(r.signer)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={r.tier} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                {formatDate(r.appliedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                {formatDate(r.decidedAt)}
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
};
