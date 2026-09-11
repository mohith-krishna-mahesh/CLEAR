// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface IRegistryDirectory {
    function isVerified(address signer) external view returns (bool);
}
