pragma solidity ^0.4.8;

import './SafeMath.sol';
import './TimeLockable.sol';
import './ERC20.sol';

contract EtcRedemptionToken is TimeLockable, ERC20 {

  uint public totalTokensRedeemed = 0;
  uint public totalWeiRedeemed = 0;
  uint public rate = 232550000; // ETC wei redeemed per DGD wei

  mapping(address => uint) redemptions;

  event Fund(address indexed from, uint value);
  event Redeem(address indexed from, address indexed to, uint tokensUsed, uint weiRedeemed);
  event RateSet(uint rate);

  function () payable {
    // not really payable; let's prevent accidental sends
    if (msg.value > 0) { throw; }
    // but trigger redeem if value is null
    redeem(msg.sender);
  }

  // the only method that allows funding
  function fund() payable {
    Fund(msg.sender, msg.value);
  }

  // change the withdraw rate
  function setRate(uint _rate) onlyAdmin {
    rate = _rate;
    RateSet(_rate);
  }

  function redeem(address _to) isActive {
    // throw if null address
    if (_to == address(0)) { throw; }
    // get token balance
    var tokenBalance = balances[msg.sender];
    // throw if no balance
    if (tokenBalance == 0) { throw; }
    // get the amount of wei to redeem
    var weiBalance = SafeMath.safeMul(tokenBalance, rate);
    // throw if contract doesn't have enough value
    if(address(this).balance < weiBalance) { throw; }
    // set the new balance to zero
    balances[msg.sender] = 0;
    // update the accounts' redemption tokenBalance
    redemptions[msg.sender] = SafeMath.safeAdd(redemptions[msg.sender], tokenBalance);
    // update the totals
    totalSupply = SafeMath.safeSub(totalSupply, tokenBalance);
    totalTokensRedeemed = SafeMath.safeAdd(totalTokensRedeemed, tokenBalance);
    totalWeiRedeemed = SafeMath.safeAdd(totalWeiRedeemed, weiBalance);
    // send the weiBalance to the requested address
    if (!_to.send(weiBalance)) { throw; }
    // emit event
    Redeem(msg.sender, _to, tokenBalance, weiBalance);
  }

  function redeemedOf(address _owner) constant returns (uint _tokens) {
    return redemptions[_owner];
  }
}
