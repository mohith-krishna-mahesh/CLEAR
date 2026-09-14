import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../../components/Button";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../../lib/api-client";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@registry-alpha.org");
  const [password, setPassword] = useState("password123");
  const [registryId, setRegistryId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.login({
        email,
        password,
        role: "registry",
        registryId,
      });

      login({
        userId: res.user?.userId || `registry-user-${registryId}`,
        registryId: res.user?.registryId || registryId,
        role: "registry",
        token: res.token,
        name: res.user?.name || `Registry #${registryId}`,
        jurisdiction: res.user?.jurisdiction || "Sovereign Jurisdiction",
        signerAddress:
          res.user?.signerAddress ||
          "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
        tier: res.user?.tier || "VERIFIED",
      });

      navigate("/registry/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (
    id: string,
    name: string,
    jurisdiction: string,
    signer: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.login({
        email: `admin@registry-${id}.org`,
        password: "password123",
        role: "registry",
        registryId: id,
      });

      login({
        userId: `registry-user-${id}`,
        registryId: id,
        role: "registry",
        token: res.token,
        name,
        jurisdiction,
        signerAddress: signer,
        tier: "VERIFIED",
      });

      navigate("/registry/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-2">
        <span className="h-3 w-3 rounded-full bg-green-600"></span>
        <h2 className="text-xl font-bold text-gray-900">
          Registry Portal Sign In
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Sign in to manage sovereign domestic inventory and bilateral
        settlements.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Registry Account Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Registry ID
          </label>
          <input
            type="text"
            required
            value={registryId}
            onChange={(e) => setRegistryId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none font-mono"
            placeholder="e.g. 1"
          />
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
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Authenticating..." : "Sign In to Registry Portal"}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400 mb-3">
          Live Walkthrough Quick Switch
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() =>
              quickLoginAs(
                "1",
                "Registry Alpha (Costa Rica)",
                "Costa Rica",
                "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
              )
            }
          >
            Sign in as Alpha (#1)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() =>
              quickLoginAs(
                "2",
                "Registry Beta (Kenya)",
                "Kenya",
                "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
              )
            }
          >
            Sign in as Beta (#2)
          </Button>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Don't have an onboarded registry?{" "}
        <Link
          to="/registry/signup"
          className="text-green-600 font-semibold hover:underline"
        >
          Apply here
        </Link>
      </div>
    </div>
  );
};
