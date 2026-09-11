// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface Vm {
    function prank(address) external;
    function assume(bool) external;
}

import "../../contracts/RegistryDirectory.sol";

contract RegistryDirectoryFuzzTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    RegistryDirectory public directory;
    address public owner = address(0x1111);
    address public council = address(0x2222);

    function setUp() public {
        directory = new RegistryDirectory(owner, council);
    }

    /// @notice Invariant: An address that has never been approved by council cannot be VERIFIED.
    function testFuzz_unverifiedAddressNeverVerified(address randomCaller) public {
        vm.assume(randomCaller != address(0));
        vm.assume(randomCaller != council);

        // Apply as registry
        vm.prank(randomCaller);
        directory.applyAsRegistry("Applicant", "Jurisdiction", "ipfs://meta");

        // Prior to council approval, must NEVER return isVerified == true
        bool verified = directory.isVerified(randomCaller);
        require(!verified, "Unapproved applicant must never be verified");
    }
}
