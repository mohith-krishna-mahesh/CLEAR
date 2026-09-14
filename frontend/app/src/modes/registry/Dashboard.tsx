import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../lib/auth-context";
import { apiClient, CreditRecord } from "../../lib/api-client";
import {
  graphqlClient,
  GET_ALL_REGISTRIES,
  SubgraphRegistry,
} from "../../lib/graphql-client";

export const Dashboard: React.FC = () => {
  const { session, registryId, refreshProfile } = useAuth();
  const [tier, setTier] = useState<string>(session?.tier || "VERIFIED");
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Modal form states for Step 5 of demo walkthrough
  const [newProjectName, setNewProjectName] = useState(
    "Kerala Wind Power Project",
  );
  const [newVintage, setNewVintage] = useState(2024);
  const [newAmount, setNewAmount] = useState(500);
  const [newOwner, setNewOwner] = useState("Acme Carbon Ltd");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    refreshProfile();
    loadDashboardData();
  }, [registryId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Check on-chain tier from Subgraph if available
      try {
        const subData = await graphqlClient.request<{
          registries: SubgraphRegistry[];
        }>(GET_ALL_REGISTRIES);
        const onChainReg = subData.registries.find((r) => r.id === registryId);
        if (onChainReg) {
          setTier(onChainReg.tier);
        }
      } catch {
        // Subgraph offline, retain session tier
      }

      // 2. Load domestic credits
      const res = await apiClient.getCredits();
      if (res?.credits) {
        setCredits(res.credits);
      }
    } catch (err) {
      console.warn("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueDemoCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    try {
      await apiClient.issueDemoCredit({
        projectName: newProjectName,
        vintage: Number(newVintage),
        amount: Number(newAmount),
        ownerCompany: newOwner,
      });
      setShowIssueModal(false);
      await loadDashboardData();
    } catch (err) {
      alert(
        "Failed to issue credit: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setIssuing(false);
    }
  };

  const activeAmount = credits
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + c.amount, 0);

  const reservedAmount = credits
    .filter((c) => c.status === "RESERVED")
    .reduce((sum, c) => sum + c.amount, 0);

  const transferredAmount = credits
    .filter((c) => c.status === "TRANSFERRED")
    .reduce((sum, c) => sum + c.amount, 0);

  const formatAddress = (addr?: string) => {
    if (!addr || addr.length < 10) return addr || "-";
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  return (
    <div className="space-y-6">
      {/* Registry Identity Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {session?.name || `Registry #${registryId || "1"}`}
            </h1>
            <StatusBadge status={tier} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 font-mono">
            <span>
              Jurisdiction:{" "}
              <strong className="text-gray-700">
                {session?.jurisdiction || "Sovereign State"}
              </strong>
            </span>
            <span>
              Signer:{" "}
              <strong className="text-gray-700">
                {formatAddress(session?.signerAddress)}
              </strong>
            </span>
            <span>
              Tenant Schema:{" "}
              <strong className="text-gray-700">
                registry_{registryId || "1"}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowIssueModal(true)}
          >
            + Issue Starter Credit
          </Button>
          <Link to="/registry/transfers/new">
            <Button size="sm" disabled={tier !== "VERIFIED"}>
              Initiate Outgoing Transfer
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Status Banner by Tier */}
      {tier === "PENDING" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0 text-yellow-600 font-bold text-lg">
              ⚠️
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-yellow-800">
                Application Pending Secretariat Council Review
              </h3>
              <p className="text-xs text-yellow-700 mt-1">
                Your registry is enrolled on Hyperledger Besu but awaits Council
                accreditation. Outgoing Article 6 cross-border settlements will
                be unlocked once the council grants VERIFIED status.
              </p>
            </div>
          </div>
        </div>
      )}

      {tier === "OBSERVER" && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0 text-blue-600 font-bold text-lg">
              ℹ️
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800">
                Observer Status: Transacting Restricted
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                Your sovereign identity has been preliminarily vetted. Full
                verification is required before initiating on-chain settlement
                commitments.
              </p>
            </div>
          </div>
        </div>
      )}

      {tier === "VERIFIED" && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0 text-green-600 font-bold text-lg">
              ✓
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-green-800">
                Accredited Sovereign Registry
              </h3>
              <p className="text-xs text-green-700 mt-1">
                Authorized for bilateral Article 6 cross-border settlements with
                counterparty sovereign registries on CLEARSettlement.
              </p>
            </div>
          </div>
        </div>
      )}

      {tier === "REVOKED" && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0 text-red-600 font-bold text-lg">
              ✕
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-red-800">
                Registry Authorization Revoked
              </h3>
              <p className="text-xs text-red-700 mt-1">
                Council multisig has revoked transacting permissions for this
                registry. All new settlement commitments are blocked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Domestic Holdings
          </div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {activeAmount.toLocaleString()}{" "}
            <span className="text-sm font-normal text-gray-500">tCO2e</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Available in local tenant ledger
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Reserved In-Flight Settlements
          </div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {reservedAmount.toLocaleString()}{" "}
            <span className="text-sm font-normal text-gray-500">tCO2e</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Locked awaiting recipient acceptance
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Finalized Transferred Volume
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {transferredAmount.toLocaleString()}{" "}
            <span className="text-sm font-normal text-gray-500">tCO2e</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Permanently debited upon settlement
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/registry/credits"
          className="bg-white p-5 rounded-lg border border-gray-200 hover:border-green-400 transition-colors shadow-sm block"
        >
          <h3 className="font-semibold text-gray-900 text-base">
            Domestic Credits Inventory →
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Browse project vintages, credit holdings, and company allocations.
          </p>
        </Link>

        <Link
          to="/registry/transfers/incoming"
          className="bg-white p-5 rounded-lg border border-gray-200 hover:border-green-400 transition-colors shadow-sm block"
        >
          <h3 className="font-semibold text-gray-900 text-base">
            Incoming Transfers →
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Review and complete pending bilateral settlements targeting your
            jurisdiction.
          </p>
        </Link>

        <Link
          to="/registry/transfers/history"
          className="bg-white p-5 rounded-lg border border-gray-200 hover:border-green-400 transition-colors shadow-sm block"
        >
          <h3 className="font-semibold text-gray-900 text-base">
            Settlement History & Audit →
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Audit trail of completed transfers with deep links to Blockscout.
          </p>
        </Link>
      </div>

      {/* Demo Issue Credit Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Issue Demo Starter Credit
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Demo stand-in for domestic credit issuance (SPEC §11 Step 5).
              Creates an ACTIVE credit row in this registry's isolated schema.
            </p>

            <form onSubmit={handleIssueDemoCredit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Vintage
                  </label>
                  <input
                    type="number"
                    required
                    value={newVintage}
                    onChange={(e) => setNewVintage(Number(e.target.value))}
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Amount (tCO2e)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Owner Company
                </label>
                <input
                  type="text"
                  required
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIssueModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={issuing}>
                  {issuing ? "Issuing..." : "Mint Demo Credit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
