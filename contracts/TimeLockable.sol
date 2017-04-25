pragma solidity ^0.4.8;

import './Permissioned.sol';

contract TimeLockable is Permissioned {

  uint public activationBlock = 0;

  modifier isActive() {
    if (activationBlock == 0 || block.number <= activationBlock) throw;
    _;
  }

  function setActivationBlock(uint _blockNumber) onlyAdmin {
    activationBlock = _blockNumber;
  }

}
