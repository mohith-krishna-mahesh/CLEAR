// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface Vm {
    function prank(address) external;
    function assume(bool) external;
}

import "../../contracts/RegistryDirectory.sol";
import "../../contracts/CLEARSettlement.sol";

contract CLEARSettlementFuzzTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    RegistryDirectory public directory;
    CLEARSettlement public settlement;

    address public owner = address(0x1000);
    address public council = address(0x2000);
    address public verifiedDest = address(0x3000);

    function setUp() public {
        directory = new RegistryDirectory(owner, council);
        settlement = new CLEARSettlement(owner, address(directory), 3600);

        // Admit verifiedDest
        vm.prank(verifiedDest);
        uint256 destId = directory.applyAsRegistry("DestReg", "Jur-Dest", "ipfs://dest");
        vm.prank(council);
        directory.approveRegistry(destId);
    }

    /// @notice Invariant: A caller without VERIFIED status can never initiate a settlement.
    function testFuzz_unverifiedCannotInitiateTransfer(
        address unverifiedCaller,
        bytes32 creditRef,
        uint256 amount
    ) public {
        vm.assume(unverifiedCaller != address(0));
        vm.assume(unverifiedCaller != verifiedDest);
        vm.assume(unverifiedCaller != council);
        vm.assume(amount > 0);

        vm.prank(unverifiedCaller);
        (bool success, ) = address(settlement).call(
            abi.encodeWithSelector(
                CLEARSettlement.initiateTransfer.selector,
                verifiedDest,
                creditRef,
                amount
            )
        );

        require(!success, "Unverified caller must never succeed in initiating transfer");
    }
}
