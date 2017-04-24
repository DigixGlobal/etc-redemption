pragma solidity ^0.4.8;

import './../TimeLockable.sol';

contract MockTimeLockable is TimeLockable {

  function testIsActive() isActive returns (bool) {
    return true;
  }

}
