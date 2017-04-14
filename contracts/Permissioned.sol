pragma solidity ^0.4.8;

contract Permissioned {

  address public admin;
  bool public active = false;

  function Premissioned() {
    admin = msg.sender;
  }

  modifier onlyAdmin() {
    if (msg.sender != admin) {
      throw;
    }
    _;
  }

  modifier isActive() {
		if (!active) throw;
		_;
	}

  function transferAdmin(address _newADmin) onlyAdmin {
    admin = _newADmin;
  }

  function setActive(bool _active) onlyAdmin {
    active = _active;
  }

  function kill() onlyAdmin {
    suicide(admin);
  }

}
