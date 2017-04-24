pragma solidity ^0.4.8;

import './SafeMath.sol';
import './TimeLockable.sol';
import './ERC20.sol';

contract EtcRedemptionToken is TimeLockable, ERC20 {

  uint public totalRedeemed = 0;

  mapping(address => uint) redemptions;

  event Redeem(address indexed from, address indexed to, uint value);

  function EtcRedemptionToken() {
    admin = msg.sender;
  }

  function () payable {
    // prevent non-zero transactions
    if (msg.value > 0) { throw; }
    redeem(msg.sender);
  }

  function redeem(address _to) isActive {
    var _amount = balances[msg.sender];
    // throw if contract doesn't have enough value
    if(address(this).balance < _amount) { throw; }
    balances[msg.sender] = 0;
    redemptions[msg.sender] = SafeMath.safeAdd(redemptions[msg.sender], _amount);
    totalSupply = SafeMath.safeSub(totalSupply, _amount);
    totalRedeemed = SafeMath.safeAdd(totalRedeemed, _amount);
    if (!_to.send(_amount)) { throw; }
    Redeem(msg.sender, _to, _amount);
  }

  function redeemed(address _owner) constant returns (uint _amount) {
    return redemptions[_owner];
  }
}
