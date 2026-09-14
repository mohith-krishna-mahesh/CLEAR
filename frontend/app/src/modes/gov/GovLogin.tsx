import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/api-client";

export const GovLogin: React.FC = () => {
  const [email, setEmail] = useState("council@clear-ledger.org");
  const [password, setPassword] = useState("council-secret-pass");
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
        role: "council",
      });

      login({
        userId: res.user?.userId || "council-member-1",
        role: "council",
        token: res.token,
        name: res.user?.name || "CLEAR Council Secretariat",
        signerAddress:
          res.user?.signerAddress ||
          "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73",
      });

      navigate("/gov/pending");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign in as council member",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail("council@clear-ledger.org");
    setPassword("council-secret-pass");
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.login({
        email: "council@clear-ledger.org",
        password: "council-secret-pass",
        role: "council",
      });
      login({
        userId: res.user?.userId || "council-genesis-signer",
        role: "council",
        token: res.token,
        name: "CLEAR Secretariat Council",
        signerAddress:
          res.user?.signerAddress ||
          "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73",
      });
      navigate("/gov/pending");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Council quick login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-2">
        <span className="h-3 w-3 rounded-full bg-red-600"></span>
        <h2 className="text-xl font-bold text-gray-900">
          CLEAR Secretariat Council
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Restricted to CLEAR Council members for registry accreditation and
        emergency governance.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Email
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
          {loading ? "Authenticating..." : "Sign In to Council Governance"}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400 mb-3">
          Evaluator / Demo Quick Access
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs font-mono"
          onClick={handleQuickLogin}
          disabled={loading}
        >
          ⚡ 1-Click Council Sign-in
        </Button>
      </div>
    </div>
  );
};
