import React, { useEffect, useState } from "react";
import { Table } from "../../components/Table";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../lib/auth-context";
import { apiClient } from "../../lib/api-client";
import {
  graphqlClient,
  GET_INCOMING_TRANSFERS,
  SubgraphTransfer,
  getDemoTransfers,
} from "../../lib/graphql-client";

export const IncomingTransfers: React.FC = () => {
  const { session } = useAuth();
  const [transfers, setTransfers] = useState<SubgraphTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadIncoming = async () => {
    setLoading(true);
    try {
      const destSigner =
        session?.signerAddress || "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
      try {
        const data = await graphqlClient.request<{
          transfers: SubgraphTransfer[];
        }>(GET_INCOMING_TRANSFERS, { destSigner: destSigner.toLowerCase() });
        setTransfers(data.transfers);
      } catch {
        const demoTransfers = getDemoTransfers();
        const incoming = demoTransfers.filter(
          (t: SubgraphTransfer) =>
            t.status === "INITIATED" &&
            (t.destRegistry.toLowerCase() === destSigner.toLowerCase() ||
              destSigner.toLowerCase() ===
                "0xf17f52151ebef6c7334fad080c5704d77216b732"),
        );
        setTransfers(incoming);
      }
    } catch (err) {
      console.warn("Failed to load incoming settlements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncoming();
    const interval = setInterval(loadIncoming, 10000);
    return () => clearInterval(interval);
  }, [session?.signerAddress]);

  const handleComplete = async (transferId: string) => {
    setCompletingId(transferId);
    setBanner(null);
    try {
      await apiClient.completeTransfer(transferId);
      setBanner({
        type: "success",
        message: `Settlement #${transferId} verified and completed on-chain! Domestic holding credited as ACTIVE in recipient schema.`,
      });
      await loadIncoming();
    } catch (err) {
      setBanner({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : `Failed to complete transfer #${transferId}`,
      });
    } finally {
      setCompletingId(null);
    }
  };

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
            Incoming Bilateral Transfers
          </h1>
          <p className="text-sm text-gray-500">
            Cross-border settlements initiated by foreign sovereign
            counterparties awaiting domestic verification and acceptance.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadIncoming}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Live"}
        </Button>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-md border text-sm flex items-center justify-between ${
            banner.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            className="text-gray-400 hover:text-gray-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <Table
        headers={[
          "Transfer ID",
          "Counterparty Origin",
          "Credit Reference Hash",
          "Amount (tCO2e)",
          "Status",
          "Initiated At",
          "Action",
        ]}
      >
        {transfers.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              className="px-6 py-8 text-center text-sm text-gray-500"
            >
              {loading
                ? "Checking for incoming settlements via Subgraph..."
                : "No incoming transfers pending verification."}
            </td>
          </tr>
        ) : (
          transfers.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                #{t.id}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-700"
                title={t.sourceRegistry}
              >
                {formatAddress(t.sourceRegistry)}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500"
                title={t.creditReference}
              >
                {t.creditReference
                  ? `${t.creditReference.substring(0, 12)}...`
                  : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {parseInt(t.amount, 10).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                {formatDate(t.initiatedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={completingId === t.id}
                  onClick={() => handleComplete(t.id)}
                >
                  {completingId === t.id ? "Settling..." : "Verify & Complete"}
                </Button>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
};
