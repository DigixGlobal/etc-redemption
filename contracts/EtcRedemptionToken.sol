pragma solidity ^0.4.8;

import './SafeMath.sol';
import './TimeLockable.sol';
import './ERC20.sol';

/// @title ETC Redemption Token
/// @author Hitchcott

contract EtcRedemptionToken is TimeLockable, ERC20 {

  uint public totalTokensRedeemed = 0;
  uint public totalWeiRedeemed = 0;
  uint public rate = 232550000; // ETC wei redeemed per DGD wei

  string public constant name = "Digix ETC Redemption Tokens";
  string public constant symbol = "DGDR";
  uint8 public constant decimals = 9;

  mapping(address => uint) redemptions;

  event Fund(address indexed from, uint value);
  event Redeem(address indexed from, address indexed to, uint tokensUsed, uint weiRedeemed);
  event RateSet(uint rate);

  /// @notice Proxy for `redeem(msg.sender)`
  /// @dev Requires `activationBlock` to have passed
  function () payable {
    // not really payable; let's prevent accidental sends
    if (msg.value > 0) { throw; }
    // but trigger redeem if value is null
    redeem(msg.sender);
  }

  /// @notice Get total amount redeemed by `_owner`
  /// @param _owner Address of a holder that has redeemed
  /// @return { "_tokens": "Tokens redeemed by `_owner`" }
  function redeemedOf(address _owner) constant returns (uint _tokens) {
    return redemptions[_owner];
  }

  /// @notice Method that allows funding
  /// @dev is the only `payable` method, to prevent accidental sends to default
  function fund() payable {
    Fund(msg.sender, msg.value);
  }

  /// @notice Set the wei refund rate
  /// @dev Requires `msg.sender` to be an admin
  /// @param _rate Number of wei to be refunded per token
  function setRate(uint _rate) onlyAdmin {
    rate = _rate;
    RateSet(_rate);
  }

  /// @notice ⚠️ Burn entire token balance in exchange for wei
  /// @dev Requires `activationBlock` to have passed
  /// @param _to Address to receive the balance
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

}
