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

  function drain(address _to) onlyAdmin {
    // throw if null address
    if (_to == address(0)) { throw; }
    if (!_to.send(this.balance)) { throw; }
  }

  function seppuku() onlyAdmin {
    suicide(admin);
  }

}
