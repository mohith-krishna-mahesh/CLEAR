import React, { useEffect, useState } from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { useAuth } from "../../lib/auth-context";
import {
  graphqlClient,
  GET_REGISTRY_TRANSFERS,
  SubgraphTransfer,
  DEFAULT_DEMO_TRANSFERS,
} from "../../lib/graphql-client";

const BLOCKSCOUT_URL =
  import.meta.env.VITE_BLOCKSCOUT_URL || "http://localhost:4000";

interface MergedTransferRecord extends SubgraphTransfer {
  direction: "OUTGOING" | "INCOMING";
  counterparty: string;
}

export const TransferHistory: React.FC = () => {
  const { session } = useAuth();
  const [records, setRecords] = useState<MergedTransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const currentSigner = (
    session?.signerAddress || "0x627306090abaB3A6e1400e9345bC60c78a8BEf57"
  ).toLowerCase();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await graphqlClient.request<{
        outgoing: SubgraphTransfer[];
        incoming: SubgraphTransfer[];
      }>(GET_REGISTRY_TRANSFERS, { signer: currentSigner });

      const outgoingMapped: MergedTransferRecord[] = data.outgoing.map((t) => ({
        ...t,
        direction: "OUTGOING",
        counterparty: t.destRegistry,
      }));

      const incomingMapped: MergedTransferRecord[] = data.incoming.map((t) => ({
        ...t,
        direction: "INCOMING",
        counterparty: t.sourceRegistry,
      }));

      const all = [...outgoingMapped, ...incomingMapped].sort(
        (a, b) => parseInt(b.initiatedAt, 10) - parseInt(a.initiatedAt, 10),
      );
      setRecords(all);
    } catch (err) {
      console.warn(
        "Could not query live Subgraph for registry transfers, using fallback:",
        err,
      );
      const fallbackRecords: MergedTransferRecord[] =
        DEFAULT_DEMO_TRANSFERS.map((t) => {
          const isOutgoing = t.sourceRegistry.toLowerCase() === currentSigner;
          return {
            ...t,
            direction: isOutgoing ? "OUTGOING" : "INCOMING",
            counterparty: isOutgoing ? t.destRegistry : t.sourceRegistry,
          };
        });
      setRecords(fallbackRecords);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentSigner]);

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
            Transfer Settlement History
          </h1>
          <p className="text-sm text-gray-500">
            Audit trail of cross-border transfers and bilateral settlement
            commitments anchored on Hyperledger Besu.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadHistory}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Records"}
        </Button>
      </div>

      <Table
        headers={[
          "Transfer ID",
          "Direction",
          "Counterparty",
          "Credit Reference",
          "Amount (tCO2e)",
          "Status",
          "Date Initiated",
          "Public Proof",
        ]}
      >
        {records.length === 0 ? (
          <tr>
            <td
              colSpan={8}
              className="px-6 py-8 text-center text-sm text-gray-500"
            >
              {loading
                ? "Loading historical records from Subgraph..."
                : "No settlement history recorded yet."}
            </td>
          </tr>
        ) : (
          records.map((r) => (
            <tr
              key={`${r.id}-${r.direction}`}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                #{r.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    r.direction === "OUTGOING"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {r.direction}
                </span>
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600"
                title={r.counterparty}
              >
                {formatAddress(r.counterparty)}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500"
                title={r.creditReference}
              >
                {r.creditReference
                  ? `${r.creditReference.substring(0, 10)}...`
                  : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {parseInt(r.amount, 10).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                {formatDate(r.initiatedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs">
                <a
                  href={`${BLOCKSCOUT_URL}/address/${r.destRegistry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 font-semibold inline-flex items-center space-x-1"
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
