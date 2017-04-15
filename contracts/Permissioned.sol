pragma solidity ^0.4.8;

contract Permissioned {

  address public admin;

  function Premissioned() {
    admin = msg.sender;
  }

  modifier onlyAdmin() {
    if (msg.sender != admin) {
      throw;
    }
    _;
  }

  function transferAdmin(address _newAdmin) onlyAdmin {
    admin = _newAdmin;
  }

  function kill() onlyAdmin {
    suicide(admin);
  }

}
