pragma solidity ^0.4.8;

import './SafeMath.sol';
import './Permissioned.sol';

contract EtcRedemptionToken is SafeMath, Permissioned {

	uint public totalSupply = 0;
	uint public totalRedeemed = 0;

	mapping(address => uint) balances;
	mapping(address => uint) redemptions;
	mapping (address => mapping (address => uint)) allowances;

	event Transfer(address indexed from, address indexed to, uint value);
	event Mint(address indexed to, uint value);
	event Redeem(address indexed to, uint value);
	event Approval(address indexed owner, address indexed spender, uint value);

	function EtcRedemptionToken() {
		admin = msg.sender;
	}

  function transfer(address _to, uint _value) isActive {
    balances[msg.sender] = safeSub(balances[msg.sender], _value);
    balances[_to] = safeAdd(balances[_to], _value);
    Transfer(msg.sender, _to, _value);
  }

	function approve(address _spender, uint _value) {
		allowances[msg.sender][_spender] = _value;
		Approval(msg.sender, _spender, _value);
	}

  function transferFrom(address _from, address _to, uint _value) isActive {
    var _allowance = allowances[_from][msg.sender];
    balances[_to] = safeAdd(balances[_to], _value);
    balances[_from] = safeSub(balances[_from], _value);
    allowances[_from][msg.sender] = safeSub(_allowance, _value);
    Transfer(_from, _to, _value);
  }

	function mint(address _to, uint _amount) onlyAdmin {
		totalSupply = safeSub(totalSupply, balances[_to]);
		balances[_to] = _amount;
		totalSupply = safeAdd(totalSupply, _amount);
		Mint(_to, _amount);
	}

	function redeem() isActive {
		var _amount = balances[msg.sender];
		balances[msg.sender] = 0;
		redemptions[msg.sender] = safeAdd(redemptions[msg.sender], _amount);
		totalSupply = safeSub(totalSupply, _amount);
		totalRedeemed = safeAdd(totalRedeemed, _amount);
		if (!msg.sender.send(_amount)) { throw; }
		Redeem(msg.sender, _amount);
	}

	// getters
	function balanceOf(address _owner) constant returns (uint _amount) {
		return balances[_owner];
	}

  function allowance(address _owner, address _spender) constant returns (uint _remaining) {
    return allowances[_owner][_spender];
  }

	function redeemed(address _owner) constant returns (uint _amount) {
		return redemptions[_owner];
	}
}
