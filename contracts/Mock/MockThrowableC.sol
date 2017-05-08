pragma solidity ^0.4.8;

contract MockThrowableC {

  function () payable {
    callsAnotherThatThrows();
  }

  function callsAnotherThatThrows() {
    throw;
  }

}
