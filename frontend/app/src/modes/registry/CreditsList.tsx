import React, { useEffect, useState, useMemo } from "react";
import { Table } from "../../components/Table";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { apiClient, CreditRecord } from "../../lib/api-client";

export const CreditsList: React.FC = () => {
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  // Add form state
  const [projectName, setProjectName] = useState("Amazon Forest Conservation");
  const [vintage, setVintage] = useState(2024);
  const [amount, setAmount] = useState(1000);
  const [ownerCompany, setOwnerCompany] = useState("BioCarbon Holdings");
  const [saving, setSaving] = useState(false);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getCredits();
      if (res?.credits) {
        setCredits(res.credits);
      }
    } catch (err) {
      console.warn("Failed to load credits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.issueDemoCredit({
        projectName,
        vintage: Number(vintage),
        amount: Number(amount),
        ownerCompany,
      });
      setShowAddModal(false);
      await loadCredits();
    } catch (err) {
      alert(
        "Error issuing credit: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredCredits = useMemo(() => {
    if (statusFilter === "ALL") return credits;
    return credits.filter((c) => c.status === statusFilter);
  }, [credits, statusFilter]);

  const handleStartTransfer = (credit: CreditRecord) => {
    navigate(
      `/registry/transfers/new?creditId=${credit.id}&maxAmount=${credit.amount}`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Domestic Credit Inventory
          </h1>
          <p className="text-sm text-gray-500">
            Sovereign registry database records for registered mitigation
            projects and vintage issuances.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadCredits}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + Issue New Credit
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Filter:
        </span>
        {["ALL", "ACTIVE", "RESERVED", "TRANSFERRED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === status
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <Table
        headers={[
          "ID",
          "Project Name",
          "Vintage",
          "Amount (tCO2e)",
          "Owner Company",
          "Status",
          "Actions",
        ]}
      >
        {filteredCredits.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              className="px-6 py-8 text-center text-sm text-gray-500"
            >
              {loading
                ? "Loading credits from sovereign database..."
                : "No credit records found."}
            </td>
          </tr>
        ) : (
          filteredCredits.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {c.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {c.projectName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {c.vintage}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {c.amount.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {c.ownerCompany}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {c.status === "ACTIVE" ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStartTransfer(c)}
                  >
                    Transfer
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    {c.status === "RESERVED" ? "Locked in escrow" : "Settled"}
                  </span>
                )}
              </td>
            </tr>
          ))
        )}
      </Table>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Register Domestic Carbon Credit
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Record a verified carbon credit in this registry's sovereign
              database ledger.
            </p>

            <form onSubmit={handleCreateCredit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Vintage
                  </label>
                  <input
                    type="number"
                    required
                    value={vintage}
                    onChange={(e) => setVintage(Number(e.target.value))}
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Amount (tCO2e)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Owner Company
                </label>
                <input
                  type="text"
                  required
                  value={ownerCompany}
                  onChange={(e) => setOwnerCompany(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Create Credit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
