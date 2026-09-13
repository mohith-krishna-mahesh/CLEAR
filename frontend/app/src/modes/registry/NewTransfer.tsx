import React, { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { apiClient, CreditRecord } from "../../lib/api-client";
import {
  graphqlClient,
  GET_VERIFIED_REGISTRIES,
  SubgraphRegistry,
  DEFAULT_DEMO_REGISTRIES,
} from "../../lib/graphql-client";

export const NewTransfer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCreditId = searchParams.get("creditId") || "";

  const { session, registryId } = useAuth();
  const navigate = useNavigate();

  const [verifiedRegistries, setVerifiedRegistries] = useState<
    SubgraphRegistry[]
  >([]);
  const [activeCredits, setActiveCredits] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [destRegistryAddress, setDestRegistryAddress] = useState("");
  const [selectedCreditId, setSelectedCreditId] = useState(initialCreditId);
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch VERIFIED registries from live Subgraph query
        try {
          const subData = await graphqlClient.request<{
            registries: SubgraphRegistry[];
          }>(GET_VERIFIED_REGISTRIES);
          // Filter out current registry
          const counterparties = subData.registries.filter(
            (r) =>
              r.id !== registryId &&
              r.signer.toLowerCase() !== session?.signerAddress?.toLowerCase(),
          );
          setVerifiedRegistries(counterparties);
          if (counterparties.length > 0 && !destRegistryAddress) {
            setDestRegistryAddress(counterparties[0].signer);
          }
        } catch (err) {
          console.warn(
            "Subgraph unreachable for verified registries, using fallback:",
            err,
          );
          const counterparties = DEFAULT_DEMO_REGISTRIES.filter(
            (r) => r.tier === "VERIFIED" && r.id !== registryId,
          );
          setVerifiedRegistries(counterparties);
          if (counterparties.length > 0 && !destRegistryAddress) {
            setDestRegistryAddress(counterparties[0].signer);
          }
        }

        // 2. Fetch active domestic credits
        const creditRes = await apiClient.getCredits();
        if (creditRes?.credits) {
          const active = creditRes.credits.filter((c) => c.status === "ACTIVE");
          setActiveCredits(active);
          if (active.length > 0 && !selectedCreditId) {
            setSelectedCreditId(active[0].id);
            setAmount(active[0].amount.toString());
          } else if (initialCreditId) {
            const match = active.find((c) => c.id === initialCreditId);
            if (match) setAmount(match.amount.toString());
          }
        }
      } catch (err) {
        setError("Failed to load initial form data");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [registryId, session?.signerAddress, initialCreditId]);

  const selectedCredit = activeCredits.find((c) => c.id === selectedCreditId);

  const handleCreditChange = (id: string) => {
    setSelectedCreditId(id);
    const match = activeCredits.find((c) => c.id === id);
    if (match) {
      setAmount(match.amount.toString());
    }
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destRegistryAddress) {
      setError("Please select a verified destination counterparty registry.");
      return;
    }
    if (!selectedCreditId) {
      setError("Please choose an active domestic credit to transfer.");
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid positive transfer volume.");
      return;
    }

    if (selectedCredit && numAmount > selectedCredit.amount) {
      setError(
        `Amount cannot exceed available active credit volume (${selectedCredit.amount} tCO2e).`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.initiateTransfer({
        destRegistryAddress,
        creditId: selectedCreditId,
        amount: numAmount,
      });

      // Update local credit cache if using demo mode
      const savedCredits: CreditRecord[] = JSON.parse(
        localStorage.getItem("demo_credits") || "[]",
      );
      const updatedCredits = savedCredits.map((c) =>
        c.id === selectedCreditId ? { ...c, status: "RESERVED" as const } : c,
      );
      localStorage.setItem("demo_credits", JSON.stringify(updatedCredits));

      navigate("/registry/transfers/history");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate settlement on-chain",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-green-600"></span>
          <h2 className="text-xl font-bold text-gray-900">
            Initiate Article 6 Cross-Border Transfer
          </h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Locks domestic inventory to RESERVED and submits an immutable
          bilateral settlement agreement to Hyperledger Besu.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleInitiate} className="space-y-4">
        {/* Live Subgraph-populated Destination Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Destination Registry (Live Subgraph Verified Registries)
          </label>
          <select
            required
            value={destRegistryAddress}
            onChange={(e) => setDestRegistryAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none bg-white"
            disabled={loading || verifiedRegistries.length === 0}
          >
            {verifiedRegistries.length === 0 ? (
              <option value="">No other verified registries found</option>
            ) : (
              verifiedRegistries.map((r) => (
                <option key={r.id} value={r.signer}>
                  {r.name} ({r.jurisdiction}) — {r.signer.substring(0, 8)}...
                  {r.signer.substring(r.signer.length - 6)}
                </option>
              ))
            )}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Populated directly from on-chain RegistryDirectory events indexed by
            Subgraph.
          </p>
        </div>

        {/* Domestic Credit Record Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Domestic Credit to Lock & Transfer
          </label>
          <select
            required
            value={selectedCreditId}
            onChange={(e) => handleCreditChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none bg-white"
            disabled={loading || activeCredits.length === 0}
          >
            {activeCredits.length === 0 ? (
              <option value="">No ACTIVE credits available in inventory</option>
            ) : (
              activeCredits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.projectName} ({c.vintage}) — Available:{" "}
                  {c.amount.toLocaleString()} tCO2e ({c.ownerCompany})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Transfer Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Settlement Volume (tCO2e)
          </label>
          <input
            type="number"
            required
            min="1"
            max={selectedCredit?.amount || 999999}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="e.g. 500"
          />
          {selectedCredit && (
            <p className="text-xs text-gray-500 mt-1">
              Maximum active volume available for this credit:{" "}
              <strong>{selectedCredit.amount} tCO2e</strong>
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={
              submitting ||
              loading ||
              activeCredits.length === 0 ||
              verifiedRegistries.length === 0
            }
          >
            {submitting
              ? "Initiating on-chain settlement..."
              : "Commit On-Chain Settlement"}
          </Button>
        </div>
      </form>
    </div>
  );
};
