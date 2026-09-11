// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RegistryDirectory
/// @notice On-chain registry of participating carbon registries and their
///         trust tier. CLEARSettlement delegates all authorization checks
///         here. Council (a Gnosis Safe multisig) governs admission.
contract RegistryDirectory is Ownable {
    enum TrustTier { NONE, PENDING, OBSERVER, VERIFIED, REVOKED }

    struct RegistryInfo {
        uint256 registryId;
        address signer;
        string name;
        string jurisdiction;
        string metadataURI;
        TrustTier tier;
        uint256 appliedAt;
        uint256 decidedAt;
    }

    mapping(uint256 => RegistryInfo) public registries;
    mapping(address => uint256) public signerToRegistry; // 0 = unset
    address public council;
    uint256 private _nextRegistryId = 1;

    event RegistryApplied(uint256 indexed registryId, address indexed signer, string name, string jurisdiction);
    event RegistryObserved(uint256 indexed registryId);
    event RegistryApproved(uint256 indexed registryId);
    event RegistryRejected(uint256 indexed registryId);
    event RegistryRevoked(uint256 indexed registryId);
    event SignerRotated(uint256 indexed registryId, address indexed oldSigner, address indexed newSigner);
    event CouncilTransferred(address indexed oldCouncil, address indexed newCouncil);
    event MetadataUpdated(uint256 indexed registryId, string metadataURI);

    error NotCouncil(address caller);
    error RegistryNotFound(uint256 registryId);
    error SignerAlreadyRegistered(address signer);
    error InvalidTierTransition(uint256 registryId, TrustTier from, TrustTier to);
    error NotRegistrySigner(uint256 registryId, address caller);
    error ZeroAddress();

    modifier onlyCouncil() {
        if (msg.sender != council) revert NotCouncil(msg.sender);
        _;
    }

    constructor(address initialOwner, address initialCouncil) Ownable(initialOwner) {
        if (initialCouncil == address(0)) revert ZeroAddress();
        council = initialCouncil;
    }

    function applyAsRegistry(
        string calldata name,
        string calldata jurisdiction,
        string calldata metadataURI
    ) external returns (uint256 registryId) {
        if (signerToRegistry[msg.sender] != 0) revert SignerAlreadyRegistered(msg.sender);

        registryId = _nextRegistryId++;
        registries[registryId] = RegistryInfo({
            registryId: registryId,
            signer: msg.sender,
            name: name,
            jurisdiction: jurisdiction,
            metadataURI: metadataURI,
            tier: TrustTier.PENDING,
            appliedAt: block.timestamp,
            decidedAt: 0
        });
        signerToRegistry[msg.sender] = registryId;

        emit RegistryApplied(registryId, msg.sender, name, jurisdiction);
    }

    function updateMetadata(uint256 registryId, string calldata metadataURI) external {
        RegistryInfo storage r = registries[registryId];
        if (r.registryId == 0) revert RegistryNotFound(registryId);
        if (r.signer != msg.sender) revert NotRegistrySigner(registryId, msg.sender);
        r.metadataURI = metadataURI;
        emit MetadataUpdated(registryId, metadataURI);
    }

    function rotateSigner(uint256 registryId, address newSigner) external {
        RegistryInfo storage r = registries[registryId];
        if (r.registryId == 0) revert RegistryNotFound(registryId);
        if (r.signer != msg.sender) revert NotRegistrySigner(registryId, msg.sender);
        _rotateSigner(r, newSigner);
    }

    function promoteToObserver(uint256 registryId) external onlyCouncil {
        RegistryInfo storage r = registries[registryId];
        if (r.registryId == 0) revert RegistryNotFound(registryId);
        if (r.tier != TrustTier.PENDING) revert InvalidTierTransition(registryId, r.tier, TrustTier.OBSERVER);
        r.tier = TrustTier.OBSERVER;
        emit RegistryObserved(registryId);
    }

    function approveRegistry(uint256 registryId) external onlyCouncil {
        RegistryInfo storage r = registries[registryId];
        if (r.registryId == 0) revert RegistryNotFound(registryId);
        if (r.tier != TrustTier.PENDING && r.tier != TrustTier.OBSERVER) {
            revert InvalidTierTransition(registryId, r.tier, TrustTier.VERIFIED);
        }
        r.tier = TrustTier.VERIFIED;
        r.decidedAt = block.timestamp;
        emit RegistryApproved(registryId);
    }

    function rejectApplication(uint256 registryId) external onlyCouncil {
        RegistryInfo storage r = registries[registryId];
        if (r.registryId == 0) revert RegistryNotFound(registryId);
        if (r.tier != TrustTier.PENDING && r.tier != TrustTier.OBSERVER) {
            revert InvalidTierTransition(registryId, r.tier, TrustTier.REVOKED);
        }
        r.tier = TrustTier.REVOKED;
        r.decidedAt = block.timestamp;
        emit RegistryRejected(registryId);
    }

    function revokeRegistry(uint256 registryId) external onlyCouncil {
        RegistryInfo storage r = registries[registryId];
        if (r.registryId == 0) revert RegistryNotFound(registryId);
        if (r.tier != TrustTier.VERIFIED) revert InvalidTierTransition(registryId, r.tier, TrustTier.REVOKED);
        r.tier = TrustTier.REVOKED;
        r.decidedAt = block.timestamp;
        emit RegistryRevoked(registryId);
    }

    function forceRotateSigner(uint256 registryId, address newSigner) external onlyCouncil {
        RegistryInfo storage r = registries[registryId];
        if (r.registryId == 0) revert RegistryNotFound(registryId);
        _rotateSigner(r, newSigner);
    }

    function transferCouncil(address newCouncil) external onlyCouncil {
        if (newCouncil == address(0)) revert ZeroAddress();
        emit CouncilTransferred(council, newCouncil);
        council = newCouncil;
    }

    function _rotateSigner(RegistryInfo storage r, address newSigner) internal {
        if (newSigner == address(0)) revert ZeroAddress();
        if (signerToRegistry[newSigner] != 0) revert SignerAlreadyRegistered(newSigner);
        address old = r.signer;
        delete signerToRegistry[old];
        r.signer = newSigner;
        signerToRegistry[newSigner] = r.registryId;
        emit SignerRotated(r.registryId, old, newSigner);
    }

    function isVerified(address signer) external view returns (bool) {
        uint256 id = signerToRegistry[signer];
        return id != 0 && registries[id].tier == TrustTier.VERIFIED;
    }

    function getRegistry(uint256 registryId) external view returns (RegistryInfo memory) {
        if (registries[registryId].registryId == 0) revert RegistryNotFound(registryId);
        return registries[registryId];
    }

    function getRegistryBySigner(address signer) external view returns (RegistryInfo memory) {
        uint256 id = signerToRegistry[signer];
        if (id == 0) revert RegistryNotFound(0);
        return registries[id];
    }
}
