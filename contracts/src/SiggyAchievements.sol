// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SiggyAchievements
/// @notice Records on-chain proof-of-play for Coin Merge / Siggy Stack.
///
/// Players call `record(bytes calldata data)` with a UTF-8 JSON payload.
/// The payload encodes their best score, best tier, and whether they unlocked
/// the Legendary tile. The event is the permanent record; no state is stored.
///
/// The `fallback` accepts raw calldata too, so legacy self-transactions that
/// already carry JSON calldata can be redirected here without client changes.
contract SiggyAchievements {
    /// @notice Emitted once per player record call.
    /// @param player  The wallet that submitted the record.
    /// @param data    Raw UTF-8-encoded JSON payload from the client.
    /// @param timestamp  Block timestamp at record time.
    event Record(address indexed player, bytes data, uint256 timestamp);

    /// @notice Explicit entry point for properly formed calls.
    function record(bytes calldata data) external {
        emit Record(msg.sender, data, block.timestamp);
    }

    /// @notice Catch-all: accepts any raw calldata (e.g. legacy self-tx redirects).
    fallback() external {
        emit Record(msg.sender, msg.data, block.timestamp);
    }

    receive() external payable {
        emit Record(msg.sender, "", block.timestamp);
    }
}
