pragma solidity ^0.4.8;

contract MockThrowableB {

  function () payable { throw; }

}
