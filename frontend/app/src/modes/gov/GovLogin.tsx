import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";

export const GovLogin: React.FC = () => {
  const [email, setEmail] = useState("council@clear-ledger.org");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(P2): wire to POST /api/auth/login and validate council credentials
    login({
      userId: "council-user-1",
      role: "council",
      token: "demo-council-jwt-token",
    });
    navigate("/gov/pending");
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Council Governance Login</h2>
      <p className="text-sm text-gray-500 mb-6">
        Restricted to CLEAR Secretariat council members.
      </p>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <Button type="submit" className="w-full">
          Sign In as Council Member
        </Button>
      </form>
    </div>
  );
};
