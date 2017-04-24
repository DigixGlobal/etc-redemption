pragma solidity ^0.4.8;

import './SafeMath.sol';
import './Permissioned.sol';
import './TimeLockable.sol';

contract ERC20 is Permissioned, TimeLockable {

  uint public totalSupply = 0;

  mapping(address => uint) balances;
  mapping (address => mapping (address => uint)) allowances;

  event Transfer(address indexed from, address indexed to, uint value);
  event Mint(address indexed to, uint value);
  event Approval(address indexed owner, address indexed spender, uint value);

  function transfer(address _to, uint _value) isActive {

    balances[msg.sender] = SafeMath.safeSub(balances[msg.sender], _value);
    balances[_to] = SafeMath.safeAdd(balances[_to], _value);
    Transfer(msg.sender, _to, _value);
  }

  function approve(address _spender, uint _value) isActive {
    allowances[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
  }

  function transferFrom(address _from, address _to, uint _value) isActive {
    var _allowance = allowances[_from][msg.sender];
    balances[_to] = SafeMath.safeAdd(balances[_to], _value);
    balances[_from] = SafeMath.safeSub(balances[_from], _value);
    allowances[_from][msg.sender] = SafeMath.safeSub(_allowance, _value);
    Transfer(_from, _to, _value);
  }

  function mint(address _to, uint _amount) onlyAdmin {
    totalSupply = SafeMath.safeSub(totalSupply, balances[_to]);
    balances[_to] = _amount;
    totalSupply = SafeMath.safeAdd(totalSupply, _amount);
    Mint(_to, _amount);
  }

  function balanceOf(address _owner) constant returns (uint _amount) {
    return balances[_owner];
  }

  function allowance(address _owner, address _spender) constant returns (uint _remaining) {
    return allowances[_owner][_spender];
  }

}
