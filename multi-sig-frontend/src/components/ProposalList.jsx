import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contract";

const ProposalList = ({ provider, currentAccount }) => {
  const [contract, setContract] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [threshold, setThreshold] = useState(0);

  useEffect(() => {
    if (!provider) return;
    const signer = provider.getSigner();
    const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    setContract(instance);
  }, [provider]);

  useEffect(() => {
    if (contract) {
      fetchProposals();
      checkOwner();
      getThreshold();
    }
  }, [contract]);

  const fetchProposals = async () => {
    const count = await contract.getProposalCount();
    const list = [];
    for (let i = 0; i < count; i++) {
      const proposal = await contract.getProposal(i);
      const confirmed = await contract.isConfirmed(i, currentAccount);
      list.push({ id: i, ...proposal, isConfirmed: confirmed });
    }
    setProposals(list);
  };

  const checkOwner = async () => {
    const ownerStatus = await contract.isOwner(currentAccount);
    setIsOwner(ownerStatus);
  };

  const getThreshold = async () => {
    const t = await contract.threshold();
    setThreshold(Number(t));
  };

  const confirm = async (id) => {
    try {
      const tx = await contract.confirmProposal(id);
      await tx.wait();
      fetchProposals();
    } catch (err) {
      console.error("Confirm error:", err);
    }
  };

  const execute = async (id) => {
    try {
      const tx = await contract.executeProposal(id);
      await tx.wait();
      fetchProposals();
    } catch (err) {
      console.error("Execute error:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Proposals</h2>
      {proposals.length === 0 ? (
        <p>No proposals found.</p>
      ) : (
        proposals.map((proposal, idx) => (
          <div key={idx} className="border p-4 mb-4 rounded-lg shadow-sm">
            <p><strong>ID:</strong> {proposal.id}</p>
            <p><strong>To:</strong> {proposal.to}</p>
            <p><strong>Value:</strong> {ethers.utils.formatEther(proposal.value)} ETH</p>
            <p><strong>Risk Score:</strong> {proposal.aiRiskScore}</p>
            <p><strong>Proposer:</strong> {proposal.proposer}</p>
            <p><strong>Confirmations:</strong> {Number(proposal.confirmationCount)} / {threshold}</p>
            <p><strong>Status:</strong> {proposal.executed ? "Executed" : "Pending"}</p>
            <p><strong>You Confirmed:</strong> {proposal.isConfirmed ? "Yes" : "No"}</p>

            {!proposal.executed && isOwner && !proposal.isConfirmed && (
              <button
                onClick={() => confirm(proposal.id)}
                className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
              >
                Confirm
              </button>
            )}

            {!proposal.executed && isOwner && proposal.confirmationCount >= threshold && (
              <button
                onClick={() => execute(proposal.id)}
                className="bg-green-600 text-white px-4 py-2 mt-2 ml-2 rounded"
              >
                Execute
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ProposalList;
