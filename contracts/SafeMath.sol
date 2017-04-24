pragma solidity ^0.4.8;

library SafeMath {

  function assert(bool assertion) internal {
    if (!assertion) {
      throw;
    }
  }

  function safeSub(uint a, uint b) internal returns (uint) {
    assert(b <= a);
    return a - b;
  }

  function safeAdd(uint a, uint b) internal returns (uint) {
    uint c = a + b;
    assert(c>=a && c>=b);
    return c;
  }

}
