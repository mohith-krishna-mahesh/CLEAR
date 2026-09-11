import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button";

export const Dashboard: React.FC = () => {
  // TODO(P2): wire to GET /api/registry/profile and tenant status metrics
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registry Operations Dashboard</h1>
          <p className="text-sm text-gray-500">
            Sovereign Ledger Portal: Domestic Inventory & Cross-Border Settlements.
          </p>
        </div>
        <Link to="/registry/transfers/new">
          <Button>Initiate Outgoing Transfer</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase">Active Inventory</div>
          <div className="text-2xl font-semibold text-green-600 mt-2">25,000 tCO2e</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase">Reserved In-Flight</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-2">5,000 tCO2e</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase">Transferred Volume</div>
          <div className="text-2xl font-semibold text-gray-900 mt-2">120,000 tCO2e</div>
        </div>
      </div>
    </div>
  );
};
