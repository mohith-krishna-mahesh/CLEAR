import React, { useState } from "react";
import { Button } from "../../components/Button";
import { useNavigate, Link } from "react-router-dom";
import { apiClient, OnboardingResponse } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

export const SignupForm: React.FC = () => {
  const [name, setName] = useState("Registry Alpha (National Carbon Registry)");
  const [jurisdiction, setJurisdiction] = useState("Costa Rica");
  const [metadataURI, setMetadataURI] = useState(
    "ipfs://bafybeiclaroalpha2026",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResponse | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.applyOnboarding({
        name,
        jurisdiction,
        metadataURI,
      });
      setResult(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Onboarding submission failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignInAsNewRegistry = () => {
    if (!result) return;
    login({
      userId: `user-${result.registryId}`,
      registryId: result.registryId,
      role: "registry",
      token: `demo-token-${result.registryId}`,
      name: result.name,
      jurisdiction: result.jurisdiction,
      signerAddress: result.signerAddress,
      tier: (result.tier as any) || "PENDING",
    });
    navigate("/registry/dashboard");
  };

  return (
    <div className="max-w-xl mx-auto mt-6 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-3 mb-2">
        <span className="h-3 w-3 rounded-full bg-green-600"></span>
        <h2 className="text-xl font-bold text-gray-900">
          Apply as Sovereign Carbon Registry
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Submit national or standard registry credentials to join the CLEAR
        Article 6 settlement network.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {result ? (
        <div className="space-y-6 bg-green-50 border border-green-200 p-6 rounded-lg">
          <div>
            <h3 className="text-green-900 font-bold text-lg">
              Onboarding Application Submitted!
            </h3>
            <p className="text-xs text-green-700 mt-1">
              Your sovereign schema has been provisioned and application
              recorded on Hyperledger Besu.
            </p>
          </div>

          <div className="space-y-2 text-xs font-mono bg-white p-4 rounded border border-green-200 text-gray-800">
            <div>
              <span className="font-semibold text-gray-500">Registry ID:</span>{" "}
              #{result.registryId}
            </div>
            <div>
              <span className="font-semibold text-gray-500">Name:</span>{" "}
              {result.name}
            </div>
            <div>
              <span className="font-semibold text-gray-500">Jurisdiction:</span>{" "}
              {result.jurisdiction}
            </div>
            <div className="break-all">
              <span className="font-semibold text-gray-500">
                Signer Key Address:
              </span>{" "}
              {result.signerAddress}
            </div>
            <div>
              <span className="font-semibold text-gray-500">Trust Tier:</span>{" "}
              <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-sans font-semibold">
                PENDING
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="w-full sm:w-auto"
              onClick={handleSignInAsNewRegistry}
            >
              Enter Registry Dashboard
            </Button>
            <Link to="/gov/pending" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Review in Council Gov
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Registry / Institution Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              placeholder="e.g. National Carbon Registry of Costa Rica"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              National Jurisdiction
            </label>
            <input
              type="text"
              required
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              placeholder="e.g. Costa Rica / Kenya"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Governance Metadata URI (IPFS / DID)
            </label>
            <input
              type="text"
              required
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none font-mono"
              placeholder="ipfs://bafkreia..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Cryptographic pointer to national accreditation credentials.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Submitting on-chain..."
              : "Submit Sovereign Onboarding Application"}
          </Button>

          <div className="text-center pt-2 text-xs text-gray-500">
            Already registered?{" "}
            <Link
              to="/registry/login"
              className="text-green-600 font-semibold hover:underline"
            >
              Sign In to Portal
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
