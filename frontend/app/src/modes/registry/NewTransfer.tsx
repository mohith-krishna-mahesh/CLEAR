import React, { useState } from "react";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";

export const NewTransfer: React.FC = () => {
  const [destRegistry, setDestRegistry] = useState("");
  const [creditId, setCreditId] = useState("");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(P2): wire to POST /api/transfer/initiate
    alert(`Transfer initiated for credit ${creditId} (${amount} tCO2e)`);
    navigate("/registry/transfers/history");
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Initiate Article 6 Cross-Border Transfer</h2>
      <p className="text-sm text-gray-500 mb-6">
        Lock domestic inventory and publish an on-chain settlement agreement to CLEARSettlement.
      </p>
      <form onSubmit={handleInitiate} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase">
            Destination Registry Signer Address
          </label>
          <input
            type="text"
            required
            value={destRegistry}
            onChange={(e) => setDestRegistry(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-green-500 focus:outline-none"
            placeholder="0x..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase">Credit Record ID</label>
          <input
            type="text"
            required
            value={creditId}
            onChange={(e) => setCreditId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="CR-9021"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase">Amount (tCO2e)</label>
          <input
            type="number"
            required
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="5000"
          />
        </div>
        <Button type="submit" className="w-full">
          Initiate On-Chain Settlement
        </Button>
      </form>
    </div>
  );
};
