pragma solidity ^0.4.8;

/// @title Admin Manager & Cleanup Utils
/// @author Hitchcott

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

  /// @notice Relinquish admin rights to another address
  /// @dev Requires `msg.sender` to be an admin
  /// @param _newAdmin New admin
  /// @return { "_value": "Holder balance" }
  function transferAdmin(address _newAdmin) onlyAdmin {
    admin = _newAdmin;
  }

  /// @notice Send all of contract's ETH balance to an address
  /// @dev Requires `msg.sender` to be an admin
  /// @param _to Receiver of balance
  /// @return { "_value": "Holder balance" }
  function drain(address _to) onlyAdmin {
    // throw if null address
    if (_to == address(0)) { throw; }
    if (!_to.send(this.balance)) { throw; }
  }

  /// @notice 🗡 Suicide the contract
  /// @dev Requires `msg.sender` to be an admin
  function seppuku() onlyAdmin {
    suicide(admin);
  }

}
