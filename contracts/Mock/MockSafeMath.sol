pragma solidity ^0.4.8;

import './../SafeMath.sol';

contract MockSafeMath {

  function safeAdd(uint a, uint b) returns (uint) {
    return SafeMath.safeAdd(a, b);
  }

  function safeSub(uint a, uint b) returns (uint) {
    return SafeMath.safeSub(a, b);
  }

  function safeMul(uint a, uint b) returns (uint) {
    return SafeMath.safeMul(a, b);
  }

  function safeDiv(uint a, uint b) returns (uint) {
    return SafeMath.safeDiv(a, b);
  }

}
