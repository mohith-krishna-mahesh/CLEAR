import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";

export const ApprovalDetail: React.FC = () => {
  const { registryId } = useParams<{ registryId: string }>();
  const navigate = useNavigate();

  const handleApprove = async () => {
    // TODO(P2): wire to POST /api/governance/:registryId/approve
    alert(`Approved registry ${registryId}`);
    navigate("/gov/pending");
  };

  const handleReject = async () => {
    // TODO(P2): wire to POST /api/governance/:registryId/reject
    alert(`Rejected registry ${registryId}`);
    navigate("/gov/pending");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Application Review: #{registryId}</h2>
      
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-semibold text-gray-700">Registry Name:</span> Registry Gamma
        </div>
        <div>
          <span className="font-semibold text-gray-700">Jurisdiction:</span> Jurisdiction-Gamma
        </div>
        <div>
          <span className="font-semibold text-gray-700">Metadata URI:</span> ipfs://QmGammaMetadata
        </div>
        <div>
          <span className="font-semibold text-gray-700">Designated Signer:</span> 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
        </div>
      </div>

      <div className="flex space-x-4 pt-4 border-t border-gray-200">
        <Button onClick={handleApprove} variant="primary">Approve Application</Button>
        <Button onClick={handleReject} variant="danger">Reject Application</Button>
        <Button onClick={() => navigate("/gov/pending")} variant="outline">Cancel</Button>
      </div>
    </div>
  );
};
