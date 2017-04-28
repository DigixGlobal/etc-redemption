pragma solidity ^0.4.8;

import './SafeMath.sol';
import './Permissioned.sol';
import './TimeLockable.sol';

/// @title Extended ERC20 Token
/// @author Open Zeppelin, modified by Hitchcott

contract ERC20 is Permissioned, TimeLockable {

  uint public totalSupply = 0;
  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowances;

  event Transfer(address indexed from, address indexed to, uint value);
  event Mint(address indexed to, uint value);
  event Approval(address indexed owner, address indexed spender, uint value);

  /// @notice Get token balance
  /// @param _owner Token balance holder
  /// @return { "_value": "Holder balance" }
  function balanceOf(address _owner) constant returns (uint _value) {
    return balances[_owner];
  }

  /// @notice Get balance remaining for `_spender` from `_owner`
  /// @param _owner Address holding a token balance
  /// @param _spender Address previously `approve`d by `_owner`
  /// @return { "_remaining": "Allowance available for `_spender`" }
  function allowance(address _owner, address _spender) constant returns (uint _remaining) {
    return allowances[_owner][_spender];
  }

  /// @notice Transfer sender's tokens to another account
  /// @dev Requires `activationBlock` to have passed
  /// @param _to The address of the recipient of the tokens
  /// @param _value The numver of tokens (in base value, 1e9 = 1dgd)
  function transfer(address _to, uint _value) isActive {
    balances[msg.sender] = SafeMath.safeSub(balances[msg.sender], _value);
    balances[_to] = SafeMath.safeAdd(balances[_to], _value);
    Transfer(msg.sender, _to, _value);
  }

  /// @notice Approve another address to use `transferFrom`
  /// @dev Requires `activationBlock` to have passed
  /// @param _spender Address to give access
  /// @param _value Spender's token allowance
  function approve(address _spender, uint _value) isActive {
    allowances[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
  }

  /// @notice Transfer tokens on behalf of another user
  /// @dev Requires `activationBlock` to have passed
  /// @param _from Address of sender
  /// @param _to Address of receiver
  /// @param _value Tokens to send (in base value)
  function transferFrom(address _from, address _to, uint _value) isActive {
    var _allowance = allowances[_from][msg.sender];
    balances[_to] = SafeMath.safeAdd(balances[_to], _value);
    balances[_from] = SafeMath.safeSub(balances[_from], _value);
    allowances[_from][msg.sender] = SafeMath.safeSub(_allowance, _value);
    Transfer(_from, _to, _value);
  }

  /// @notice Create new tokens
  /// @dev Requires `msg.sender` to be an admin
  /// @param _to Address of token receiver
  /// @param _value Tokens to create for this user (in base value)
  function mint(address _to, uint _value) onlyAdmin {
    totalSupply = SafeMath.safeSub(totalSupply, balances[_to]);
    balances[_to] = _value;
    totalSupply = SafeMath.safeAdd(totalSupply, _value);
    Mint(_to, _value);
  }

}
