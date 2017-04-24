pragma solidity ^0.4.8;

import './../SafeMath.sol';

contract MockSafeMath {

  function safeSub(uint a, uint b) returns (uint) {
    return SafeMath.safeSub(a, b);
  }

  function safeAdd(uint a, uint b) returns (uint) {
    return SafeMath.safeAdd(a, b);
  }

}
