import React, { useState } from "react";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";

export const SignupForm: React.FC = () => {
  const [name, setName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(P2): wire to POST /api/onboarding/apply
    alert("Application submitted for council review.");
    navigate("/registry/login");
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Apply as Sovereign Registry</h2>
      <p className="text-sm text-gray-500 mb-6">
        Submit jurisdiction details for council verification.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase">Registry Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="e.g. National Carbon Registry"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase">Jurisdiction</label>
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
          <label className="block text-xs font-medium text-gray-700 uppercase">Metadata URI</label>
          <input
            type="text"
            required
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="ipfs://..."
          />
        </div>
        <Button type="submit" className="w-full">
          Submit Onboarding Application
        </Button>
      </form>
    </div>
  );
};
