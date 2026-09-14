import React, { useEffect, useState, useMemo } from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import {
  graphqlClient,
  GET_ALL_TRANSFERS,
  SubgraphTransfer,
  getDemoTransfers,
} from "../../lib/graphql-client";

const BLOCKSCOUT_URL =
  import.meta.env.VITE_BLOCKSCOUT_URL || "http://localhost:4000";

export const TransferExplorer: React.FC = () => {
  const [transfers, setTransfers] = useState<SubgraphTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const data = await graphqlClient.request<{
        transfers: SubgraphTransfer[];
      }>(GET_ALL_TRANSFERS, {
        first: 100,
        skip: 0,
      });
      setTransfers(data.transfers);
    } catch (err) {
      console.warn(
        "Subgraph not reachable, using fallback transfer records:",
        err,
      );
      setTransfers(getDemoTransfers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        t.id.includes(q) ||
        t.sourceRegistry.toLowerCase().includes(q) ||
        t.destRegistry.toLowerCase().includes(q) ||
        t.creditReference.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [transfers, statusFilter, searchQuery]);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatDate = (timestamp?: string | null) => {
    if (!timestamp) return "-";
    const num = parseInt(timestamp, 10);
    if (!num) return "-";
    return new Date(num * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transfer Explorer
          </h1>
          <p className="text-sm text-gray-500">
            Query cross-border Article 6 settlement transactions anchored on
            Hyperledger Besu.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadTransfers}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by ID, address, or credit ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Status:
          </span>
          {["ALL", "INITIATED", "COMPLETED", "CANCELLED", "EXPIRED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === status
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      <Table
        headers={[
          "Transfer ID",
          "Source Registry",
          "Destination",
          "Credit Reference",
          "Amount (tCO2e)",
          "Status",
          "Initiated At",
          "Explorer",
        ]}
      >
        {filteredTransfers.length === 0 ? (
          <tr>
            <td
              colSpan={8}
              className="px-6 py-8 text-center text-sm text-gray-500"
            >
              {loading
                ? "Loading settlements from subgraph..."
                : "No settlements match the search filter."}
            </td>
          </tr>
        ) : (
          filteredTransfers.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                #{t.id}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600"
                title={t.sourceRegistry}
              >
                {formatAddress(t.sourceRegistry)}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600"
                title={t.destRegistry}
              >
                {formatAddress(t.destRegistry)}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500"
                title={t.creditReference}
              >
                {t.creditReference
                  ? `${t.creditReference.substring(0, 10)}...`
                  : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {parseInt(t.amount, 10).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                {formatDate(t.initiatedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs">
                <a
                  href={`${BLOCKSCOUT_URL}/address/${t.destRegistry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 font-medium inline-flex items-center space-x-1"
                >
                  <span>Blockscout</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
};
