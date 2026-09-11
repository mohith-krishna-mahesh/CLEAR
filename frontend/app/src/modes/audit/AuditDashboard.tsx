import React from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";

export const AuditDashboard: React.FC = () => {
  // TODO(P2): wire to Subgraph query for global protocol metrics & recent transfers
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CLEAR Protocol Public Audit</h1>
        <p className="text-sm text-gray-500">
          Decentralized settlement audit trail for Article 6 sovereign carbon transfers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase">Verified Registries</div>
          <div className="text-2xl font-semibold text-gray-900 mt-2">2</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase">Completed Settlements</div>
          <div className="text-2xl font-semibold text-gray-900 mt-2">12</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase">Settled Volume (tCO2e)</div>
          <div className="text-2xl font-semibold text-green-600 mt-2">145,000</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent On-Chain Settlements</h2>
        <Table headers={["Transfer ID", "Source Registry", "Destination", "Amount (tCO2e)", "Status"]}>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#001</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Registry Alpha</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Registry Beta</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5,000</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <StatusBadge status="COMPLETED" />
            </td>
          </tr>
        </Table>
      </div>
    </div>
  );
};
