import React from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";

export const TransferHistory: React.FC = () => {
  // TODO(P2): wire to GET /api/transfer for tenant TransferCache historical entries
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer Settlement History</h1>
        <p className="text-sm text-gray-500">
          Historical record of all incoming and outgoing settlement transactions.
        </p>
      </div>

      <Table headers={["Transfer ID", "Direction", "Counterparty", "Amount (tCO2e)", "Status", "Updated At"]}>
        <tr>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#001</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">OUTGOING</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Registry Beta</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5,000</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <StatusBadge status="COMPLETED" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2026-09-12 00:15 UTC</td>
        </tr>
      </Table>
    </div>
  );
};
