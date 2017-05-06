pragma solidity ^0.4.8;

import './Permissioned.sol';

/// @title Active based on block number
/// @author Hitchcott

contract TimeLockable is Permissioned {

  uint public activationBlock = 0;

  modifier isActive() {
    if (activationBlock == 0 || block.number <= activationBlock) throw;
    _;
  }

  /// @notice Set the activation block number
  /// @param _blockNumber Contract will become active if current block is greater or equal than this
  function setActivationBlock(uint _blockNumber) onlyAdmin {
    activationBlock = _blockNumber;
  }

}
