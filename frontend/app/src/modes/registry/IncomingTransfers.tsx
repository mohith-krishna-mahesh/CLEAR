import React from "react";
import { Table } from "../../components/Table";
import { Button } from "../../components/Button";

export const IncomingTransfers: React.FC = () => {
  // TODO(P2): wire to GET /api/transfer (filtering incoming INITIATED transfers)

  const handleComplete = (transferId: string) => {
    // TODO(P2): wire to POST /api/transfer/:transferId/complete
    alert(`Completed incoming transfer ${transferId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Incoming Bilateral Transfers</h1>
        <p className="text-sm text-gray-500">
          Transfers initiated by counterparty registries awaiting your verification and acceptance.
        </p>
      </div>

      <Table headers={["Transfer ID", "Counterparty Registry", "Credit Ref", "Amount", "Actions"]}>
        <tr>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#002</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Registry Alpha (0x7099...79C8)</td>
          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">0x76a1...b291</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2,500 tCO2e</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Button size="sm" onClick={() => handleComplete("2")}>
              Accept & Settle
            </Button>
          </td>
        </tr>
      </Table>
    </div>
  );
};
