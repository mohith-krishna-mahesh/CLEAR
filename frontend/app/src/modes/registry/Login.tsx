import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { Button } from "../../components/Button";
import { useNavigate, Link } from "react-router-dom";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@registry-alpha.org");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(P2): wire to POST /api/auth/login and retrieve tenant token
    login({
      userId: "user-alpha-1",
      registryId: "1",
      role: "registry",
      token: "demo-registry-jwt-token",
    });
    navigate("/registry/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Registry Sign In</h2>
      <p className="text-sm text-gray-500 mb-6">
        Sign in to manage domestic inventory and bilateral settlements.
      </p>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
      <div className="mt-4 text-center text-xs text-gray-500">
        Don't have an onboarded registry?{" "}
        <Link to="/registry/signup" className="text-green-600 font-semibold hover:underline">
          Apply here
        </Link>
      </div>
    </div>
  );
};
