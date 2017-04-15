pragma solidity ^0.4.8;

import './../SafeMath.sol';

contract MockSafeMath is SafeMath {

  function sub(uint a, uint b) returns (uint) {
    return safeSub(a, b);
  }

  function add(uint a, uint b) returns (uint) {
    return safeAdd(a, b);
  }

}
