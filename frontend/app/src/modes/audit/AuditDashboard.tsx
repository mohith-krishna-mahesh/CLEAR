import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import {
  loadRegistries,
  loadTransfers,
  SubgraphTransfer,
} from "../../lib/graphql-client";

export const AuditDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [recentTransfers, setRecentTransfers] = useState<SubgraphTransfer[]>(
    [],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ registries }, { transfers, source }] = await Promise.all([
        loadRegistries(),
        loadTransfers(),
      ]);
      const verified = registries.filter((r) => r.tier === "VERIFIED");
      const completed = transfers.filter((t) => t.status === "COMPLETED");
      setVerifiedCount(verified.length);
      setCompletedCount(completed.length);
      const volume = completed.reduce(
        (sum, t) => sum + (parseInt(t.amount, 10) || 0),
        0,
      );
      setTotalVolume(volume);
      setRecentTransfers(transfers.slice(0, 10));
      setIsLive(source === "subgraph" || source === "api");
    } catch (err) {
      console.warn("Could not load audit metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatDate = (timestamp: string) => {
    const num = parseInt(timestamp, 10);
    if (!num) return "-";
    return new Date(num * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              CLEAR Protocol Public Audit
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                isLive
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {isLive ? "● Live" : "Demo Mode"}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Decentralized settlement audit trail for Article 6 sovereign carbon
            transfers on Hyperledger Besu.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Link to="/audit/registries">
            <Button size="sm" variant="secondary">
              View Registries
            </Button>
          </Link>
          <Link to="/audit/transfers">
            <Button size="sm">Transfer Explorer</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Verified Registries
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {verifiedCount}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Admitted sovereign registries
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Completed Settlements
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {completedCount}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Bilateral transfers finalized on-chain
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Settled Volume
          </div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {totalVolume.toLocaleString()}{" "}
            <span className="text-sm font-normal text-gray-500">tCO2e</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Article 6 ITMO verified volume
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent On-Chain Settlements
          </h2>
          <Link
            to="/audit/transfers"
            className="text-xs text-green-600 hover:underline font-medium"
          >
            View all transfers →
          </Link>
        </div>

        <Table
          headers={[
            "Transfer ID",
            "Source Registry",
            "Destination Registry",
            "Amount (tCO2e)",
            "Status",
            "Initiated At",
          ]}
        >
          {recentTransfers.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                No transfer records found on-chain.
              </td>
            </tr>
          ) : (
            recentTransfers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  #{t.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600">
                  {formatAddress(t.sourceRegistry)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600">
                  {formatAddress(t.destRegistry)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {parseInt(t.amount, 10).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {formatDate(t.initiatedAt)}
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </div>
  );
};
