import React from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";

export const TransferExplorer: React.FC = () => {
  // TODO(P2): wire to Subgraph query for Transfer entities with pagination and filters
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer Explorer</h1>
        <p className="text-sm text-gray-500">
          Query cross-border settlement records anchored on Hyperledger Besu.
        </p>
      </div>

      <Table headers={["Transfer ID", "Source", "Destination", "Credit Ref", "Amount", "Status", "Initiated At"]}>
        <tr>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#001</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0x7099...79C8</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0x3C44...93BC</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">0x4352...0000</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10,000</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <StatusBadge status="COMPLETED" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2026-09-12 00:00 UTC</td>
        </tr>
      </Table>
    </div>
  );
};
