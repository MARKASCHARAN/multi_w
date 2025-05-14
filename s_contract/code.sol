// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract MultiSigWallet {
    // EVENTS
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address to, uint256 value, bytes data, uint8 riskScore);
    event ProposalConfirmed(uint256 indexed proposalId, address indexed owner);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event OwnerAdded(address indexed newOwner);
    event OwnerRemoved(address indexed removedOwner);

    // STRUCTS
    struct Proposal {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
        uint8 aiRiskScore;
        address proposer;
    }

    // STATE
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public threshold;

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public confirmations;

    // MODIFIERS
    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        if (proposalId >= proposals.length) revert InvalidProposal();
        _;
    }

    modifier notExecuted(uint256 proposalId) {
        if (proposals[proposalId].executed) revert AlreadyExecuted();
        _;
    }

    modifier notConfirmed(uint256 proposalId) {
        if (confirmations[proposalId][msg.sender]) revert AlreadyConfirmed();
        _;
    }

    // CUSTOM ERRORS (Gas efficient)
    error NotOwner();
    error AlreadyConfirmed();
    error InvalidProposal();
    error AlreadyExecuted();
    error NotEnoughConfirmations();
    error ZeroAddress();
    error DuplicateOwner();

    // CONSTRUCTOR
    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length >= _threshold, "Owners < threshold");
        require(_threshold > 0, "Threshold must be > 0");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            if (owner == address(0)) revert ZeroAddress();
            if (isOwner[owner]) revert DuplicateOwner();
            isOwner[owner] = true;
            owners.push(owner);
        }

        threshold = _threshold;
    }

    // FUNCTIONS

    function proposeTransaction(address to, uint256 value, bytes calldata data, uint8 aiRiskScore) external onlyOwner {
        Proposal memory proposal = Proposal({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmationCount: 1,
            aiRiskScore: aiRiskScore,
            proposer: msg.sender
        });

        proposals.push(proposal);
        uint256 proposalId = proposals.length - 1;
        confirmations[proposalId][msg.sender] = true;

        emit ProposalCreated(proposalId, msg.sender, to, value, data, aiRiskScore);
    }

    function confirmProposal(uint256 proposalId) 
        external 
        onlyOwner 
        proposalExists(proposalId) 
        notExecuted(proposalId) 
        notConfirmed(proposalId) 
    {
        confirmations[proposalId][msg.sender] = true;
        proposals[proposalId].confirmationCount += 1;
        emit ProposalConfirmed(proposalId, msg.sender);
    }

    function executeProposal(uint256 proposalId) 
        external 
        onlyOwner 
        proposalExists(proposalId) 
        notExecuted(proposalId) 
    {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.confirmationCount < threshold) revert NotEnoughConfirmations();

        proposal.executed = true;
        (bool success, ) = proposal.to.call{value: proposal.value}(proposal.data);
        require(success, "Execution failed");

        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) 
        external 
        onlyOwner 
        proposalExists(proposalId) 
        notExecuted(proposalId) 
    {
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.proposer, "Only proposer can cancel");
        proposal.executed = true; // Mark as executed to disable
        emit ProposalCancelled(proposalId);
    }

    // OWNER MANAGEMENT (optional)
    function addOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(!isOwner[newOwner], "Already owner");

        isOwner[newOwner] = true;
        owners.push(newOwner);
        emit OwnerAdded(newOwner);
    }

    function removeOwner(address owner) external onlyOwner {
        require(isOwner[owner], "Not an owner");
        isOwner[owner] = false;

        // Remove from owners array
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        // Adjust threshold if needed
        if (threshold > owners.length) {
            threshold = owners.length;
        }

        emit OwnerRemoved(owner);
    }

    // VIEW FUNCTIONS
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getConfirmationCount(uint256 proposalId) external view returns (uint256) {
        return proposals[proposalId].confirmationCount;
    }

    function isConfirmed(uint256 proposalId, address owner) external view returns (bool) {
        return confirmations[proposalId][owner];
    }

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    receive() external payable {}
}
