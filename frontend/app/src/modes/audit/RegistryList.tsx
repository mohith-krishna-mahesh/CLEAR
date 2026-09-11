import React from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";

export const RegistryList: React.FC = () => {
  // TODO(P2): wire to Subgraph query for all Registry entities and their trust tiers
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accredited Registries</h1>
        <p className="text-sm text-gray-500">
          Directory of sovereign and voluntary registries admitted to CLEAR.
        </p>
      </div>

      <Table headers={["ID", "Registry Name", "Jurisdiction", "Signer Address", "Trust Tier", "Decided At"]}>
        <tr>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Registry Alpha</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Country-Alpha</td>
          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">0x7099...79C8</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <StatusBadge status="VERIFIED" />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2026-09-12</td>
        </tr>
      </Table>
    </div>
  );
};
