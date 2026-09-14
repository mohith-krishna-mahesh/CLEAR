import React, { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import {
  apiClient,
  CreditRecord,
  generateRandomAddress,
} from "../../lib/api-client";
import {
  loadVerifiedRegistries,
  SubgraphRegistry,
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

  // Address entry mode: 'select' from verified or 'custom'
  const [addressMode, setAddressMode] = useState<"select" | "custom">("select");
  const [destRegistryAddress, setDestRegistryAddress] = useState("");
  const [selectedCreditId, setSelectedCreditId] = useState(initialCreditId);
  const [amount, setAmount] = useState<string>("500");

  const loadFormData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch VERIFIED registries from live Subgraph query or persistent storage
      let counterparties: SubgraphRegistry[] = [];
      try {
        counterparties = (await loadVerifiedRegistries()).filter(
          (r) =>
            r.id !== registryId &&
            r.signer.toLowerCase() !== session?.signerAddress?.toLowerCase(),
        );
      } catch {
        counterparties = [];
      }

      setVerifiedRegistries(counterparties);
      if (counterparties.length > 0 && !destRegistryAddress) {
        setDestRegistryAddress(counterparties[0].signer);
      }

      // 2. Fetch active domestic credits
      const creditRes = await apiClient.getCredits(registryId);
      if (creditRes?.credits) {
        const active = creditRes.credits.filter((c) => c.status === "ACTIVE");
        setActiveCredits(active);
        if (active.length > 0) {
          const matched = initialCreditId
            ? active.find((c) => c.id === initialCreditId) || active[0]
            : active[0];
          setSelectedCreditId(matched.id);
          setAmount(matched.amount.toString());
        }
      }
    } catch {
      setError("Failed to load initial transfer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleGenerateRandomRecipient = () => {
    const randomAddr = generateRandomAddress();
    setAddressMode("custom");
    setDestRegistryAddress(randomAddr);
  };

  const handleMintQuickCredit = async () => {
    const newCredit = await apiClient.issueDemoCredit({
      projectName: "Sovereign Solar & Reforestation Project",
      vintage: 2024,
      amount: 1000,
      ownerCompany: session?.name || "National Sovereign Holdings",
      registryId: registryId || "1",
    });
    await loadFormData();
    setSelectedCreditId(newCredit.id);
    setAmount("500");
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destRegistryAddress) {
      setError("Please specify a destination registry address.");
      return;
    }
    if (!selectedCreditId) {
      setError("Please select an active domestic credit from inventory.");
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid positive transfer volume.");
      return;
    }

    if (selectedCredit && numAmount > selectedCredit.amount) {
      setError(
        `Amount cannot exceed available active volume (${selectedCredit.amount} tCO2e).`,
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
        sourceSigner: session?.signerAddress,
        sourceRegistryId: registryId,
      });

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
          Locks domestic inventory to RESERVED and commits an immutable
          bilateral settlement agreement to Hyperledger Besu.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleInitiate} className="space-y-5">
        {/* Destination Selection: Dropdown or Custom Address */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Destination Registry
            </label>
            <div className="flex space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setAddressMode("select")}
                className={`px-2 py-0.5 rounded font-medium ${
                  addressMode === "select"
                    ? "bg-green-100 text-green-800 font-bold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Select Verified
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setAddressMode("custom")}
                className={`px-2 py-0.5 rounded font-medium ${
                  addressMode === "custom"
                    ? "bg-green-100 text-green-800 font-bold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Custom Address
              </button>
            </div>
          </div>

          {addressMode === "select" ? (
            <div>
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
                      {r.name} ({r.jurisdiction}) — {r.signer.substring(0, 8)}
                      ...
                      {r.signer.substring(r.signer.length - 6)}
                    </option>
                  ))
                )}
              </select>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Populated live from on-chain RegistryDirectory.</span>
                <button
                  type="button"
                  onClick={handleGenerateRandomRecipient}
                  className="text-green-600 hover:underline font-semibold"
                >
                  + Use New Custom Address
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                required
                value={destRegistryAddress}
                onChange={(e) => setDestRegistryAddress(e.target.value)}
                placeholder="0x... (Recipient Registry Signer Address)"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-green-500 focus:outline-none"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>
                  Enter any valid sovereign counterparty signer address.
                </span>
                <button
                  type="button"
                  onClick={handleGenerateRandomRecipient}
                  className="text-green-600 hover:underline font-semibold"
                >
                  ⚡ Generate Random Address
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Domestic Credit Record Selection */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Domestic Credit to Lock & Transfer
            </label>
            {activeCredits.length === 0 && (
              <button
                type="button"
                onClick={handleMintQuickCredit}
                className="text-xs text-green-600 hover:underline font-semibold"
              >
                + Mint Demo Credit
              </button>
            )}
          </div>

          {activeCredits.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-center justify-between">
              <span>No ACTIVE credits in domestic inventory.</span>
              <Button size="sm" type="button" onClick={handleMintQuickCredit}>
                + Mint Starter Credit
              </Button>
            </div>
          ) : (
            <select
              required
              value={selectedCreditId}
              onChange={(e) => handleCreditChange(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none bg-white"
            >
              {activeCredits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.projectName} ({c.vintage}) — Available:{" "}
                  {c.amount.toLocaleString()} tCO2e ({c.ownerCompany})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Transfer Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Settlement Volume (tCO2e)
          </label>
          <div className="relative mt-1">
            <input
              type="number"
              required
              min="1"
              max={selectedCredit?.amount || 9999999}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              placeholder="Enter volume to transfer (e.g. 500)"
            />
            {selectedCredit && (
              <button
                type="button"
                onClick={() => setAmount(selectedCredit.amount.toString())}
                className="absolute right-2 top-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold"
              >
                MAX ({selectedCredit.amount})
              </button>
            )}
          </div>
          {selectedCredit && (
            <p className="text-xs text-gray-500 mt-1">
              Available active balance:{" "}
              <strong>{selectedCredit.amount.toLocaleString()} tCO2e</strong>
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || loading || activeCredits.length === 0}
          >
            {submitting
              ? "Committing on-chain settlement..."
              : "Commit On-Chain Settlement"}
          </Button>
        </div>
      </form>
    </div>
  );
};
