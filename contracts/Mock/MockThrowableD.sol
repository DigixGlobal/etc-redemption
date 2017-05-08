pragma solidity ^0.4.8;

import '../EtcRedemptionToken.sol';

contract MockThrowableD {

  function () payable {
    // attempt re-entry ?
    EtcRedemptionToken(msg.sender).redeem(address(this));
  }

}
