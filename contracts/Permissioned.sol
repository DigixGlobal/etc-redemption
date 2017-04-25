pragma solidity ^0.4.8;

contract Permissioned {

  address public admin;

  function Permissioned() {
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

  /*
  TODO
  function drain() onlyAdmin {
    admin.send(address(this).balance);
  }

  function seppuku() onlyAdmin {
    suicide(admin);
  }
  */

}
