pragma solidity ^0.4.8;

import './SafeMath.sol';
import './TimeLockable.sol';
import './ERC20.sol';

contract EtcRedemptionToken is TimeLockable, ERC20 {

  uint public totalRedeemed = 0;

  mapping(address => uint) redemptions;

  event Fund(address indexed from, uint value);
  event Redeem(address indexed from, address indexed to, uint value);

  function EtcRedemptionToken() {
    admin = msg.sender;
  }

  function () payable {
    // not really payable; let's prevent accidental sends
    if (msg.value > 0) { throw; }
    redeem(msg.sender);
  }

  // only method that allows funding
  function fund() payable {
    Fund(msg.sender, msg.value);
  }

  function redeem(address _to) isActive {
    // the balance owend to the sender
    var _amount = balances[msg.sender];
    // throw if the balance is zero
    if (_amount == 0) { throw; }
    // throw if contract doesn't have enough value
    if(address(this).balance < _amount) { throw; }
    // set the new balance to zero
    balances[msg.sender] = 0;
    // update the accounts' redemption amount
    redemptions[msg.sender] = SafeMath.safeAdd(redemptions[msg.sender], _amount);
    // update the token's total supply
    totalSupply = SafeMath.safeSub(totalSupply, _amount);
    // update the total redeemed value
    totalRedeemed = SafeMath.safeAdd(totalRedeemed, _amount);
    // send the wei to the requested address
    // TODO check for null address?
    if (!_to.send(_amount)) { throw; }
    // emit event
    Redeem(msg.sender, _to, _amount);
  }

  function redeemedOf(address _owner) constant returns (uint _amount) {
    return redemptions[_owner];
  }
}
