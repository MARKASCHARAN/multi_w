import React, { useState } from "react";
import { ethers } from "ethers";

const NewProposalForm = ({ contract }) => {
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [risk, setRisk] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tx = await contract.proposeTransaction(to, ethers.parseEther(value), data, parseInt(risk));
    await tx.wait();
    alert("Proposal Created");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} /><br />
      <input placeholder="Value (ETH)" value={value} onChange={(e) => setValue(e.target.value)} /><br />
      <input placeholder="Data (hex)" value={data} onChange={(e) => setData(e.target.value)} /><br />
      <input placeholder="AI Risk Score (0-255)" value={risk} onChange={(e) => setRisk(e.target.value)} /><br />
      <button type="submit">Submit Proposal</button>
    </form>
  );
};

export default NewProposalForm;