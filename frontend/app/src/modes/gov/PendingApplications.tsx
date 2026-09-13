import React, { useEffect, useState } from "react";
import { Table } from "../../components/Table";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import { apiClient, PendingRegistry } from "../../lib/api-client";
import {
  graphqlClient,
  GET_PENDING_REGISTRIES,
  SubgraphRegistry,
  DEFAULT_DEMO_REGISTRIES,
} from "../../lib/graphql-client";

export const PendingApplications: React.FC = () => {
  const [applications, setApplications] = useState<PendingRegistry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      // First try governance API endpoint
      const res = await apiClient.listPendingRegistries();
      if (res?.registries && res.registries.length >= 0) {
        setApplications(res.registries);
        return;
      }
    } catch {
      // If backend API isn't online, try Subgraph for PENDING or OBSERVER
      try {
        const subData = await graphqlClient.request<{
          registries: SubgraphRegistry[];
        }>(GET_PENDING_REGISTRIES);
        const mapped: PendingRegistry[] = subData.registries.map((r) => ({
          id: r.id,
          onChainId: r.id,
          name: r.name,
          jurisdiction: r.jurisdiction,
          signerAddress: r.signer,
          metadataURI: r.metadataURI,
          tier: r.tier,
          createdAt: new Date(parseInt(r.appliedAt, 10) * 1000).toISOString(),
        }));
        setApplications(mapped);
        return;
      } catch {
        // Fallback demo registry
        const fallbackPending = DEFAULT_DEMO_REGISTRIES.filter(
          (r) => r.tier === "PENDING" || r.tier === "OBSERVER",
        ).map((r) => ({
          id: r.id,
          onChainId: r.id,
          name: r.name,
          jurisdiction: r.jurisdiction,
          signerAddress: r.signer,
          metadataURI: r.metadataURI,
          tier: r.tier,
          createdAt: new Date().toISOString(),
        }));
        setApplications(fallbackPending);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (registryId: string) => {
    setActionLoading(registryId);
    setBanner(null);
    try {
      await apiClient.approveRegistry(registryId);
      setBanner({
        type: "success",
        message: `Registry #${registryId} successfully approved and accredited on-chain (VERIFIED).`,
      });
      await loadPending();
    } catch (err) {
      setBanner({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : `Failed to approve registry #${registryId}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (registryId: string) => {
    setActionLoading(registryId);
    setBanner(null);
    try {
      await apiClient.rejectRegistry(registryId);
      setBanner({
        type: "success",
        message: `Application #${registryId} rejected (REVOKED).`,
      });
      await loadPending();
    } catch (err) {
      setBanner({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : `Failed to reject registry #${registryId}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (registryId: string) => {
    setActionLoading(registryId);
    setBanner(null);
    try {
      await apiClient.promoteRegistry(registryId);
      setBanner({
        type: "success",
        message: `Registry #${registryId} promoted to OBSERVER status.`,
      });
      await loadPending();
    } catch (err) {
      setBanner({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : `Failed to promote registry #${registryId}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pending Registry Applications
          </h1>
          <p className="text-sm text-gray-500">
            Council voting desk: review and accredit sovereign carbon registries
            to the CLEAR settlement protocol.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadPending}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Applications"}
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
          "ID",
          "Registry Name",
          "Jurisdiction",
          "Signer Address",
          "Status",
          "Council Actions",
        ]}
      >
        {applications.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              className="px-6 py-8 text-center text-sm text-gray-500"
            >
              {loading
                ? "Loading applications..."
                : "No pending applications requiring council review."}
            </td>
          </tr>
        ) : (
          applications.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                #{app.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {app.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {app.jurisdiction}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600">
                {formatAddress(app.signerAddress)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={app.tier} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={actionLoading === app.id}
                    onClick={() => handleApprove(app.id)}
                  >
                    Approve
                  </Button>

                  {app.tier === "PENDING" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionLoading === app.id}
                      onClick={() => handlePromote(app.id)}
                    >
                      Promote
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="danger"
                    disabled={actionLoading === app.id}
                    onClick={() => handleReject(app.id)}
                  >
                    Reject
                  </Button>

                  <Link to={`/gov/approval/${app.id}`}>
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
};
