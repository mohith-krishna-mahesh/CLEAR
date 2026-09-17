// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRegistryDirectory.sol";

/// @title CLEARSettlement
/// @notice Minimal settlement-only protocol for verifiable cross-border
///         carbon registry transfers. Records ONLY settlement metadata —
///         never the underlying carbon credit itself. Registries remain
///         the sole system of record for credit ownership. All authorization
///         is delegated to RegistryDirectory.
contract CLEARSettlement is Ownable {
    enum TransferStatus {
        INITIATED,
        COMPLETED,
        CANCELLED,
        EXPIRED
    }

    struct Transfer {
        uint256 transferId;
        address sourceRegistry;
        address destRegistry;
        bytes32 creditReference;
        uint256 amount;
        TransferStatus status;
        uint256 initiatedAt;
        uint256 completedAt;
    }

    IRegistryDirectory public directory;
    uint256 public expiryWindow;
    mapping(uint256 => Transfer) public transfers;
    uint256 private _nextTransferId = 1;

    event DirectorySet(address indexed directory);
    event ExpiryWindowSet(uint256 newWindow);
    event TransferInitiated(
        uint256 indexed transferId,
        address indexed sourceRegistry,
        address indexed destRegistry,
        bytes32 creditReference,
        uint256 amount
    );
    event TransferCompleted(uint256 indexed transferId, uint256 completedAt);
    event TransferCancelled(uint256 indexed transferId);
    event TransferExpired(uint256 indexed transferId);

    error NotVerifiedRegistry(address caller);
    error TransferNotFound(uint256 transferId);
    error InvalidDestinationRegistry(address destRegistry);
    error NotDestinationRegistry(uint256 transferId, address caller);
    error NotSourceRegistry(uint256 transferId, address caller);
    error InvalidTransferStatus(uint256 transferId, TransferStatus current);
    error ZeroAmount();
    error TransferNotExpirable(uint256 transferId);

    modifier onlyVerifiedRegistry() {
        if (!directory.isVerified(msg.sender))
            revert NotVerifiedRegistry(msg.sender);
        _;
    }

    constructor(
        address initialOwner,
        address directoryAddress,
        uint256 initialExpiryWindow
    ) Ownable(initialOwner) {
        directory = IRegistryDirectory(directoryAddress);
        expiryWindow = initialExpiryWindow;
        emit DirectorySet(directoryAddress);
        emit ExpiryWindowSet(initialExpiryWindow);
    }

    function setDirectory(address newDirectory) external onlyOwner {
        directory = IRegistryDirectory(newDirectory);
        emit DirectorySet(newDirectory);
    }

    function setExpiryWindow(uint256 newWindow) external onlyOwner {
        expiryWindow = newWindow;
        emit ExpiryWindowSet(newWindow);
    }

    function initiateTransfer(
        address destRegistry,
        bytes32 creditReference,
        uint256 amount
    ) external onlyVerifiedRegistry returns (uint256 transferId) {
        if (!directory.isVerified(destRegistry))
            revert InvalidDestinationRegistry(destRegistry);
        if (amount == 0) revert ZeroAmount();

        transferId = _nextTransferId++;
        transfers[transferId] = Transfer({
            transferId: transferId,
            sourceRegistry: msg.sender,
            destRegistry: destRegistry,
            creditReference: creditReference,
            amount: amount,
            status: TransferStatus.INITIATED,
            initiatedAt: block.timestamp,
            completedAt: 0
        });

        emit TransferInitiated(
            transferId,
            msg.sender,
            destRegistry,
            creditReference,
            amount
        );
    }

    function completeTransfer(
        uint256 transferId
    ) external onlyVerifiedRegistry {
        Transfer storage t = transfers[transferId];
        if (t.transferId == 0) revert TransferNotFound(transferId);
        if (t.destRegistry != msg.sender)
            revert NotDestinationRegistry(transferId, msg.sender);
        if (t.status != TransferStatus.INITIATED)
            revert InvalidTransferStatus(transferId, t.status);

        t.status = TransferStatus.COMPLETED;
        t.completedAt = block.timestamp;
        emit TransferCompleted(transferId, block.timestamp);
    }

    function cancelTransfer(uint256 transferId) external onlyVerifiedRegistry {
        Transfer storage t = transfers[transferId];
        if (t.transferId == 0) revert TransferNotFound(transferId);
        if (t.sourceRegistry != msg.sender)
            revert NotSourceRegistry(transferId, msg.sender);
        if (t.status != TransferStatus.INITIATED)
            revert InvalidTransferStatus(transferId, t.status);

        t.status = TransferStatus.CANCELLED;
        emit TransferCancelled(transferId);
    }

    function expireTransfer(uint256 transferId) external {
        Transfer storage t = transfers[transferId];
        if (t.transferId == 0) revert TransferNotFound(transferId);
        if (t.status != TransferStatus.INITIATED)
            revert InvalidTransferStatus(transferId, t.status);
        if (block.timestamp <= t.initiatedAt + expiryWindow)
            revert TransferNotExpirable(transferId);

        t.status = TransferStatus.EXPIRED;
        emit TransferExpired(transferId);
    }

    function getTransfer(
        uint256 transferId
    ) external view returns (Transfer memory) {
        if (transfers[transferId].transferId == 0)
            revert TransferNotFound(transferId);
        return transfers[transferId];
    }
}
