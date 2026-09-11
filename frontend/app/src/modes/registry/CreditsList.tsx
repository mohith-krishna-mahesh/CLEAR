import React from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";

export const CreditsList: React.FC = () => {
  // TODO(P2): wire to GET /api/registry/credits for tenant Credit entities
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Domestic Credit Inventory</h1>
        <p className="text-sm text-gray-500">
          Sovereign registry database records for registered projects and vintage issuances.
        </p>
      </div>

      <Table headers={["ID", "Project Name", "Vintage", "Amount (tCO2e)", "Owner Company", "Status"]}>
        <tr>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">CR-9021</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Amazon Basin Reforestation</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10,000</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">EcoForest Ltd</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <StatusBadge status="ACTIVE" />
          </td>
        </tr>
      </Table>
    </div>
  );
};
