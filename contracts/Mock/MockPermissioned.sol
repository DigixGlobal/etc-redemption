pragma solidity ^0.4.8;

import './../Permissioned.sol';

contract MockPermissioned is Permissioned {

  // so we can test drain
  function MockPermissioned() payable { }

}
