import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { apiClient, PendingRegistry } from "../../lib/api-client";
import {
  graphqlClient,
  GET_ALL_REGISTRIES,
  SubgraphRegistry,
  DEFAULT_DEMO_REGISTRIES,
} from "../../lib/graphql-client";

export const ApprovalDetail: React.FC = () => {
  const { registryId } = useParams<{ registryId: string }>();
  const navigate = useNavigate();
  const [registry, setRegistry] = useState<PendingRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiClient.listPendingRegistries();
        const found = res?.registries?.find(
          (r) => r.id === registryId || r.onChainId === registryId,
        );
        if (found) {
          setRegistry(found);
          return;
        }
      } catch {
        // try Subgraph
        try {
          const subData = await graphqlClient.request<{
            registries: SubgraphRegistry[];
          }>(GET_ALL_REGISTRIES);
          const found = subData.registries.find((r) => r.id === registryId);
          if (found) {
            setRegistry({
              id: found.id,
              onChainId: found.id,
              name: found.name,
              jurisdiction: found.jurisdiction,
              signerAddress: found.signer,
              metadataURI: found.metadataURI,
              tier: found.tier,
              createdAt: new Date(
                parseInt(found.appliedAt, 10) * 1000,
              ).toISOString(),
            });
            return;
          }
        } catch {
          // fallback demo
          const found = DEFAULT_DEMO_REGISTRIES.find(
            (r) => r.id === registryId,
          );
          if (found) {
            setRegistry({
              id: found.id,
              onChainId: found.id,
              name: found.name,
              jurisdiction: found.jurisdiction,
              signerAddress: found.signer,
              metadataURI: found.metadataURI,
              tier: found.tier,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [registryId]);

  const handleApprove = async () => {
    if (!registryId) return;
    setActionLoading(true);
    try {
      await apiClient.approveRegistry(registryId);
      navigate("/gov/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!registryId) return;
    setActionLoading(true);
    try {
      await apiClient.promoteRegistry(registryId);
      navigate("/gov/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promote failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!registryId) return;
    setActionLoading(true);
    try {
      await apiClient.rejectRegistry(registryId);
      navigate("/gov/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg border border-gray-200 text-center text-sm text-gray-500">
        Loading applicant dossier #{registryId}...
      </div>
    );
  }

  if (!registry) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg border border-gray-200 text-center space-y-4">
        <p className="text-sm text-gray-500">
          Registry application #{registryId} not found.
        </p>
        <Button size="sm" onClick={() => navigate("/gov/pending")}>
          Back to Pending Applications
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Applicant Dossier #{registry.id}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            {registry.name}
          </h2>
        </div>
        <StatusBadge status={registry.tier} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4 text-sm divide-y divide-gray-100">
        <div className="pt-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Jurisdiction
          </span>
          <span className="text-base text-gray-900 font-medium">
            {registry.jurisdiction}
          </span>
        </div>

        <div className="pt-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Designated Sovereign Signer Address
          </span>
          <span className="text-sm font-mono text-gray-800 break-all">
            {registry.signerAddress}
          </span>
        </div>

        <div className="pt-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Article 6 Governance Metadata URI
          </span>
          <span className="text-sm font-mono text-blue-600 break-all">
            {registry.metadataURI || "ipfs://bafkreia...none"}
          </span>
        </div>

        <div className="pt-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Application Submitted
          </span>
          <span className="text-sm text-gray-700">
            {new Date(registry.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
        <Button
          onClick={handleApprove}
          variant="primary"
          disabled={actionLoading}
        >
          {actionLoading ? "Processing..." : "Approve Application (VERIFIED)"}
        </Button>

        {registry.tier === "PENDING" && (
          <Button
            onClick={handlePromote}
            variant="secondary"
            disabled={actionLoading}
          >
            Promote to OBSERVER
          </Button>
        )}

        <Button
          onClick={handleReject}
          variant="danger"
          disabled={actionLoading}
        >
          Reject Application (REVOKED)
        </Button>

        <Button
          onClick={() => navigate("/gov/pending")}
          variant="outline"
          disabled={actionLoading}
        >
          Back
        </Button>
      </div>
    </div>
  );
};
