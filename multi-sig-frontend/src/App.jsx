import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./utils/contract"; // Ensure this is correct
import NewProposalForm from "./components/NewProposalForm"; // Ensure this is the correct path

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");

  // Function to connect to MetaMask wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
    const provider = new ethers.BrowserProvider(window.ethereum); // Use ethers provider
    const accs = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner(); // Getting the signer (wallet)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer); // Contract instance
    setAccount(accs[0]);
    setSigner(signer); // Set signer in state
    setContract(contract); // Set contract in state
    setWalletConnected(true); // Wallet connected successfully
  };

  useEffect(() => {
    connectWallet(); // Automatically connect wallet on mount
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🧾 MultiSig Wallet</h1>
      {walletConnected ? (
        <p>Connected: {account}</p> // Display connected account
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button> // Show Connect Wallet button
      )}
      {walletConnected && contract && <NewProposalForm contract={contract} />} {/* Render form when wallet is connected */}
    </div>
  );
}

export default App;
