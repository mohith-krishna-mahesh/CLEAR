import React, { useState } from "react";
import { Button } from "../../components/Button";
import { useNavigate, Link } from "react-router-dom";
import {
  apiClient,
  OnboardingResponse,
  generateRandomAddress,
} from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

export const SignupForm: React.FC = () => {
  const [name, setName] = useState("National Carbon Registry of Colombia");
  const [jurisdiction, setJurisdiction] = useState("Colombia");
  const [email, setEmail] = useState("admin@colombia-registry.org");
  const [password, setPassword] = useState("password123");
  const [signerAddress, setSignerAddress] = useState(generateRandomAddress());
  const [metadataURI, setMetadataURI] = useState("ipfs://bafybeicolombia2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResponse | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGenerateSigner = () => {
    setSignerAddress(generateRandomAddress());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.applyOnboarding({
        name,
        jurisdiction,
        metadataURI,
        email,
        password,
        signerAddress,
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
      token: result.token || `session-${result.registryId}`,
      name: result.name,
      jurisdiction: result.jurisdiction,
      signerAddress: result.signerAddress,
      tier: (result.tier as any) || "PENDING",
    });
    navigate("/registry/dashboard");
  };

  return (
    <div className="max-w-xl mx-auto mt-6 bg-white p-8 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div>
        <div className="flex items-center space-x-3 mb-1">
          <span className="h-3 w-3 rounded-full bg-green-600"></span>
          <h2 className="text-xl font-bold text-gray-900">
            Apply as Sovereign Carbon Registry
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Create a new sovereign registry account with isolated ledger
          credentials to participate in cross-border settlements.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {result ? (
        <div className="space-y-6 bg-green-50 border border-green-200 p-6 rounded-lg">
          <div>
            <h3 className="text-green-900 font-bold text-lg">
              Registry Successfully Created!
            </h3>
            <p className="text-xs text-green-700 mt-1">
              Your sovereign credentials and tenant schema have been enrolled
              with starter inventory.
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
            <div>
              <span className="font-semibold text-gray-500">
                Sign In Email:
              </span>{" "}
              {email}
            </div>
            <div className="break-all">
              <span className="font-semibold text-gray-500">
                Designated Signer Key Address:
              </span>{" "}
              {result.signerAddress}
            </div>
            <div>
              <span className="font-semibold text-gray-500">Status:</span>{" "}
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-sans font-bold">
                {result.tier}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="w-full sm:w-auto"
              onClick={handleSignInAsNewRegistry}
            >
              Sign In to Your New Dashboard
            </Button>
            <Link to="/registry/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Go to Sign In Page
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Registry / Sovereign Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              placeholder="e.g. National Carbon Registry of Colombia"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Jurisdiction
              </label>
              <input
                type="text"
                required
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                placeholder="e.g. Colombia"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                placeholder="admin@registry.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Sovereign Signer Key Address (On-Chain Identity)
              </label>
              <button
                type="button"
                onClick={handleGenerateSigner}
                className="text-xs text-green-600 hover:underline font-semibold"
              >
                ⚡ Generate Random Key
              </button>
            </div>
            <input
              type="text"
              required
              value={signerAddress}
              onChange={(e) => setSignerAddress(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-green-500 focus:outline-none text-xs"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Metadata URI
            </label>
            <input
              type="text"
              required
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-green-500 focus:outline-none text-xs"
              placeholder="ipfs://bafkreia..."
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Registering..."
                : "Create Registry Account & Provision Keys"}
            </Button>
          </div>

          <div className="text-center pt-1 text-xs text-gray-500">
            Already have an account?{" "}
            <Link
              to="/registry/login"
              className="text-green-600 font-semibold hover:underline"
            >
              Sign In here
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
