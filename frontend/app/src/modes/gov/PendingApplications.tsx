import React from "react";
import { Table } from "../../components/Table";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import { Link } from "react-router-dom";

export const PendingApplications: React.FC = () => {
  // TODO(P2): wire to GET /api/governance/pending or Subgraph query for tier = "PENDING"
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Registry Applications</h1>
          <p className="text-sm text-gray-500">
            Review applicant sovereign credentials before council vote and on-chain verification.
          </p>
        </div>
      </div>

      <Table headers={["ID", "Registry Name", "Jurisdiction", "Signer Address", "Status", "Actions"]}>
        <tr>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Registry Gamma</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jurisdiction-Gamma</td>
          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">0x15d3...6871</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <StatusBadge status="PENDING" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
            <Link to="/gov/approval/2">
              <Button size="sm" variant="outline">Review Details</Button>
            </Link>
          </td>
        </tr>
      </Table>
    </div>
  );
};
